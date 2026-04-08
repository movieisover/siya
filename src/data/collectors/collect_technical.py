"""
시야 (Siya) — 기술지표 수집 (technical)
TradingView-Screener로 전 종목 RSI/MACD 데이터를 Supabase에 저장

실행: python src/data/collectors/collect_technical.py

참고: TradingView-Screener는 현재 시점 기술지표만 제공 (과거 데이터 없음)
     → 매일 실행하여 30일치 누적
"""

import time
from datetime import datetime
from utils import get_supabase, get_all_stocks, batch_upsert

supabase = get_supabase()

TODAY = datetime.today().strftime('%Y-%m-%d')


def collect_technical():
    print("=" * 60)
    print(f"기술지표 수집 시작 ({TODAY})")
    print("=" * 60)

    try:
        from tradingview_screener import Scanner
    except ImportError:
        print("❌ tradingview-screener 패키지가 필요합니다.")
        print("   pip install tradingview-screener")
        return

    stocks_list = get_all_stocks(supabase)
    stock_codes = {s['stock_code']: s['stock_name'] for s in stocks_list}
    print(f"대상 종목: {len(stock_codes)}개\n")

    # TradingView에서 한국 주식 기술지표 스캔
    print("📊 TradingView에서 기술지표 스캔 중...")

    try:
        # 한국 시장 전체 스캔
        result = (
            Scanner()
            .set_markets('korea')
            .select(
                'name', 'close', 
                'RSI', 'RSI[1]',
                'MACD.macd', 'MACD.signal', 'MACD.hist'
            )
            .limit(3000)
            .scan()
        )

        df = result

        if hasattr(df, 'empty') and df.empty:
            print("❌ TradingView 데이터 없음")
            return

        print(f"  TradingView 결과: {len(df)}개 종목")
        print(f"  컬럼: {list(df.columns)}")

    except Exception as e:
        print(f"❌ TradingView 스캔 오류: {e}")
        print(f"\n💡 TradingView-Screener가 작동하지 않으면,")
        print(f"   pykrx에서 직접 RSI/MACD를 계산하는 방식으로 전환할 수 있습니다.")
        print(f"   → collect_technical_pykrx.py 사용")
        
        # 대안: pykrx 기반 기술지표 계산
        collect_technical_from_pykrx()
        return

    # 데이터 변환 및 저장
    rows = []
    matched = 0

    for _, row in df.iterrows():
        # TradingView ticker에서 종목코드 추출
        ticker = str(row.get('name', ''))
        
        # KOSE:005930 또는 KRX:005930 형태에서 코드 추출
        code = ticker.split(':')[-1] if ':' in ticker else ticker
        
        # 6자리 숫자가 아니면 건너뛰기
        if len(code) != 6 or not code.isdigit():
            continue
        
        if code not in stock_codes:
            continue

        rsi_14 = row.get('RSI', None)
        macd = row.get('MACD.macd', None)
        macd_signal = row.get('MACD.signal', None)
        macd_hist = row.get('MACD.hist', None)

        rows.append({
            'stock_code': code,
            'trade_date': TODAY,
            'rsi_14': round(float(rsi_14), 2) if rsi_14 is not None else None,
            'macd': round(float(macd), 4) if macd is not None else None,
            'macd_signal': round(float(macd_signal), 4) if macd_signal is not None else None,
            'macd_histogram': round(float(macd_hist), 4) if macd_hist is not None else None,
            'source': 'tradingview'
        })
        matched += 1

    print(f"  매칭된 종목: {matched}개")

    if rows:
        success, errors = batch_upsert(supabase, 'technical', rows, 'stock_code,trade_date')
        print(f"\n✅ 저장 완료: {success}건 성공, {errors}건 오류")
    else:
        print("\n⚠️ 저장할 데이터 없음")


def collect_technical_from_pykrx():
    """
    대안: pykrx 시세 데이터로 RSI/MACD 직접 계산
    TradingView-Screener가 작동하지 않을 때 사용
    """
    import numpy as np
    from pykrx import stock
    from datetime import timedelta

    print("\n📊 pykrx 기반 기술지표 계산 모드")

    stocks_list = get_all_stocks(supabase)
    total = len(stocks_list)
    print(f"대상 종목: {total}개\n")

    # RSI/MACD 계산을 위해 최근 60일 시세 필요
    end_date = datetime.today()
    start_date = end_date - timedelta(days=90)
    start_str = start_date.strftime('%Y%m%d')
    end_str = end_date.strftime('%Y%m%d')

    success_count = 0
    skip_count = 0
    error_count = 0

    for i, s in enumerate(stocks_list):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 100 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 계산 중...")

        try:
            df = stock.get_market_ohlcv(start_str, end_str, code)

            if df.empty or len(df) < 30:
                skip_count += 1
                continue

            # 종가 컬럼 확인
            close_col = '종가' if '종가' in df.columns else 'Close'
            closes = df[close_col].values.astype(float)

            # RSI 14일 계산
            rsi_14 = calculate_rsi(closes, 14)

            # MACD 계산 (12, 26, 9)
            macd_val, signal_val, hist_val = calculate_macd(closes)

            if rsi_14 is not None:
                row = {
                    'stock_code': code,
                    'trade_date': TODAY,
                    'rsi_14': round(rsi_14, 2),
                    'macd': round(macd_val, 4) if macd_val is not None else None,
                    'macd_signal': round(signal_val, 4) if signal_val is not None else None,
                    'macd_histogram': round(hist_val, 4) if hist_val is not None else None,
                    'source': 'pykrx_calc'
                }

                supabase.table('technical').upsert(
                    row, on_conflict='stock_code,trade_date'
                ).execute()
                success_count += 1

        except Exception as e:
            if i < 5:
                print(f"  ❌ {name} 오류: {e}")
            error_count += 1

        if (i + 1) % 200 == 0:
            print(f"  ⏳ {i+1}/{total} 완료 ({success_count}개 성공)")
            time.sleep(0.5)

    print(f"\n{'=' * 60}")
    print(f"기술지표 계산 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개")
    print(f"  ❌ 오류: {error_count}개")
    print(f"{'=' * 60}")


def calculate_rsi(closes, period=14):
    """RSI 계산"""
    if len(closes) < period + 1:
        return None

    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for j in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[j]) / period
        avg_loss = (avg_loss * (period - 1) + losses[j]) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def calculate_macd(closes, fast=12, slow=26, signal=9):
    """MACD 계산"""
    if len(closes) < slow + signal:
        return None, None, None

    def ema(data, period):
        result = [data[0]]
        multiplier = 2 / (period + 1)
        for i in range(1, len(data)):
            result.append(data[i] * multiplier + result[-1] * (1 - multiplier))
        return result

    ema_fast = ema(closes, fast)
    ema_slow = ema(closes, slow)

    macd_line = [ema_fast[i] - ema_slow[i] for i in range(len(closes))]
    signal_line = ema(macd_line[slow-1:], signal)

    macd_val = macd_line[-1]
    signal_val = signal_line[-1] if signal_line else None
    hist_val = macd_val - signal_val if signal_val is not None else None

    return macd_val, signal_val, hist_val


if __name__ == '__main__':
    collect_technical()
