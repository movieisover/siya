"""
시야 (Siya) — RSI/MACD 자체 계산 + technical 테이블 저장
시세(price_daily) 데이터로 직접 계산

실행: python src/data/collectors/calc_technical.py
"""

import time
from datetime import datetime
from utils import get_supabase, get_all_stocks

supabase = get_supabase()
TODAY = datetime.today().strftime('%Y-%m-%d')


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
    """MACD 계산 (12, 26, 9)"""
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


def calc_technical():
    print("=" * 60)
    print(f"RSI/MACD 계산 시작 ({TODAY})")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)
    total = len(stocks_list)
    print(f"대상 종목: {total}개\n")

    success_count = 0
    skip_count = 0
    error_count = 0
    rows = []

    for i, s in enumerate(stocks_list):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 200 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 계산 중...")

        try:
            # 최근 60거래일 종가 가져오기 (RSI 14일 + MACD 35일에 충분)
            result = supabase.table('price_daily').select(
                'close, trade_date'
            ).eq('stock_code', code).order('trade_date', desc=False).limit(100).execute()

            if not result.data or len(result.data) < 35:
                skip_count += 1
                continue

            closes = [r['close'] for r in result.data if r['close'] and r['close'] > 0]
            last_date = result.data[-1]['trade_date']

            if len(closes) < 35:
                skip_count += 1
                continue

            # RSI 계산
            rsi_14 = calculate_rsi(closes, 14)

            # MACD 계산
            macd_val, signal_val, hist_val = calculate_macd(closes)

            if rsi_14 is not None:
                rows.append({
                    'stock_code': code,
                    'trade_date': last_date,
                    'rsi_14': round(rsi_14, 2),
                    'macd': round(macd_val, 4) if macd_val is not None else None,
                    'macd_signal': round(signal_val, 4) if signal_val is not None else None,
                    'macd_histogram': round(hist_val, 4) if hist_val is not None else None,
                    'source': 'calc'
                })
                success_count += 1

        except Exception as e:
            if i < 5:
                print(f"  ❌ {name} 오류: {e}")
            error_count += 1

        if (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} 완료 ({success_count}개 성공)")

    # 배치 저장
    if rows:
        print(f"\n📦 Supabase 저장 중... ({len(rows)}건)")
        batch_size = 200
        saved = 0
        for j in range(0, len(rows), batch_size):
            batch = rows[j:j + batch_size]
            try:
                supabase.table('technical').upsert(
                    batch, on_conflict='stock_code,trade_date'
                ).execute()
                saved += len(batch)
            except Exception as e:
                print(f"  ❌ 저장 오류: {e}")
        print(f"  ✅ {saved}건 저장 완료")

    # 샘플 확인
    print(f"\n--- 계산 결과 샘플 ---")
    samples = ['005930', '000660', '068270', '035420', '373220']
    for code in samples:
        match = [r for r in rows if r['stock_code'] == code]
        if match:
            r = match[0]
            name_result = supabase.table('stocks').select('stock_name').eq('stock_code', code).execute()
            name = name_result.data[0]['stock_name'] if name_result.data else code
            gc = "골든크로스" if r['macd'] and r['macd_signal'] and r['macd'] > r['macd_signal'] else "데드크로스"
            print(f"  {name}: RSI={r['rsi_14']} MACD={r['macd']} ({gc})")

    print(f"\n{'=' * 60}")
    print(f"RSI/MACD 계산 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개 (데이터 부족)")
    print(f"  ❌ 오류: {error_count}개")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    calc_technical()
