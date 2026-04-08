"""
시야 (Siya) — 일일 자동 업데이트 스크립트
매일 장 마감 후 GitHub Actions에서 자동 실행

수행 작업:
  1. 최근 시세 수집 (FinanceDataReader, 최근 5거래일)
  2. PER/PBR 재계산 (최신 시세 + 재무제표)
  3. RSI/MACD 재계산 (최근 시세 기반)

실행: python src/data/collectors/daily_update.py
"""

import os
import sys
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# .env 로드 (로컬 실행 시)
_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)

# GitHub Actions에서는 환경변수로 직접 주입
from supabase import create_client
import FinanceDataReader as fdr

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

TODAY = datetime.today()
TODAY_STR = TODAY.strftime('%Y-%m-%d')


def get_all_stocks():
    """전체 종목 리스트"""
    stocks = []
    offset = 0
    while True:
        res = supabase.table('stocks').select(
            'stock_code, stock_name, market'
        ).eq('is_active', True).range(offset, offset + 999).execute()
        stocks.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000
    return stocks


# ══════════════════════════════════════════════
# Step 1: 최근 시세 수집
# ══════════════════════════════════════════════

def update_prices():
    """최근 5거래일 시세 수집 (FinanceDataReader)"""
    print("=" * 60)
    print(f"Step 1: 시세 업데이트 ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()
    start_date = (TODAY - timedelta(days=10)).strftime('%Y-%m-%d')
    
    success = 0
    skip = 0
    errors = 0
    total = len(stocks)

    for i, s in enumerate(stocks):
        code = s['stock_code']

        try:
            df = fdr.DataReader(code, start_date)

            if df is None or df.empty:
                skip += 1
                continue

            rows = []
            for date_idx, row in df.iterrows():
                trade_date = date_idx.strftime('%Y-%m-%d')
                close_val = int(row['Close']) if row['Close'] > 0 else None
                if not close_val:
                    continue

                # 등락률 계산
                change_pct = None
                if 'Change' in df.columns and row['Change'] is not None:
                    change_pct = round(float(row['Change']) * 100, 4)

                rows.append({
                    'stock_code': code,
                    'trade_date': trade_date,
                    'open': int(row['Open']) if row['Open'] > 0 else None,
                    'high': int(row['High']) if row['High'] > 0 else None,
                    'low': int(row['Low']) if row['Low'] > 0 else None,
                    'close': close_val,
                    'volume': int(row['Volume']) if 'Volume' in df.columns else None,
                    'change_pct': change_pct,
                    'source': 'fdr'
                })

            if rows:
                supabase.table('price_daily').upsert(
                    rows, on_conflict='stock_code,trade_date'
                ).execute()
                success += 1
            else:
                skip += 1

        except Exception as e:
            if errors < 3:
                print(f"  ❌ {s['stock_name']}({code}): {e}")
            errors += 1

        if (i + 1) % 200 == 0:
            print(f"  ⏳ {i+1}/{total} (성공:{success} 건너뜀:{skip})")
            time.sleep(1)

    print(f"✅ 시세 완료: 성공 {success} / 건너뜀 {skip} / 오류 {errors}\n")
    return success


# ══════════════════════════════════════════════
# Step 2: PER/PBR 재계산
# ══════════════════════════════════════════════

def update_valuation():
    """최신 시세 기반 PER/PBR 재계산"""
    print("=" * 60)
    print(f"Step 2: PER/PBR 재계산 ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()

    # 발행주식수 가져오기 (FDR)
    shares_map = {}
    for market in ['KOSPI', 'KOSDAQ']:
        try:
            listing = fdr.StockListing(market)
            for _, row in listing.iterrows():
                code = str(row.get('Code', '')).strip()
                shares = row.get('Shares', None)
                if code and shares and shares > 0:
                    shares_map[code] = int(shares)
        except Exception as e:
            print(f"  ⚠️ {market} 발행주식수 오류: {e}")

    print(f"  발행주식수: {len(shares_map)}개 종목")

    # 최신 재무 데이터 가져오기
    fin_map = {}
    offset = 0
    while True:
        res = supabase.table('financials').select(
            'stock_code, net_income, total_equity, fiscal_year'
        ).eq('fiscal_quarter', 'FY').order('fiscal_year', desc=True).range(offset, offset + 999).execute()
        for r in res.data:
            if r['stock_code'] not in fin_map:
                fin_map[r['stock_code']] = r
        if len(res.data) < 1000:
            break
        offset += 1000

    success = 0
    rows = []

    for s in stocks:
        code = s['stock_code']
        shares = shares_map.get(code)
        fin = fin_map.get(code)

        if not shares or not fin:
            continue

        net_income = fin.get('net_income')  # 백만원
        total_equity = fin.get('total_equity')  # 백만원

        if not net_income or not total_equity:
            continue

        # 최신 종가 가져오기
        price_res = supabase.table('price_daily').select('close, trade_date').eq(
            'stock_code', code
        ).order('trade_date', desc=True).limit(1).execute()

        if not price_res.data:
            continue

        close = price_res.data[0]['close']
        trade_date = price_res.data[0]['trade_date']

        # EPS, BPS 계산 (백만원 → 원)
        eps = (net_income * 1_000_000) / shares
        bps = (total_equity * 1_000_000) / shares

        per = round(close / eps, 2) if eps != 0 else None
        pbr = round(close / bps, 2) if bps != 0 else None

        # 음수 PER은 적자 → 0으로 표시
        if per is not None and per < 0:
            per = 0

        rows.append({
            'stock_code': code,
            'trade_date': trade_date,
            'per': per,
            'pbr': pbr,
            'eps': round(eps, 2) if eps else None,
            'bps': round(bps, 2) if bps else None,
            'source': 'calc'
        })
        success += 1

    # 배치 저장
    if rows:
        for j in range(0, len(rows), 200):
            batch = rows[j:j + 200]
            supabase.table('valuation').upsert(
                batch, on_conflict='stock_code,trade_date'
            ).execute()

    print(f"✅ PER/PBR 완료: {success}개 종목\n")


# ══════════════════════════════════════════════
# Step 3: RSI/MACD 재계산
# ══════════════════════════════════════════════

def calculate_rsi(closes, period=14):
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


def update_technical():
    """RSI/MACD 재계산"""
    print("=" * 60)
    print(f"Step 3: RSI/MACD 재계산 ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()
    total = len(stocks)
    success = 0
    rows = []

    for i, s in enumerate(stocks):
        code = s['stock_code']

        try:
            result = supabase.table('price_daily').select(
                'close, trade_date'
            ).eq('stock_code', code).order('trade_date', desc=False).limit(100).execute()

            if not result.data or len(result.data) < 35:
                continue

            closes = [r['close'] for r in result.data if r['close'] and r['close'] > 0]
            last_date = result.data[-1]['trade_date']

            if len(closes) < 35:
                continue

            rsi_14 = calculate_rsi(closes, 14)
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
                success += 1

        except Exception:
            pass

        if (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} ({success}개 계산)")

    if rows:
        for j in range(0, len(rows), 200):
            batch = rows[j:j + 200]
            supabase.table('technical').upsert(
                batch, on_conflict='stock_code,trade_date'
            ).execute()

    print(f"✅ RSI/MACD 완료: {success}개 종목\n")


# ══════════════════════════════════════════════
# 메인 실행
# ══════════════════════════════════════════════

if __name__ == '__main__':
    start_time = time.time()
    print(f"\n{'#' * 60}")
    print(f"  시야 일일 데이터 업데이트")
    print(f"  실행 시각: {TODAY.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#' * 60}\n")

    update_prices()
    update_valuation()
    update_technical()

    elapsed = time.time() - start_time
    print(f"\n{'#' * 60}")
    print(f"  전체 완료! (소요 시간: {elapsed/60:.1f}분)")
    print(f"{'#' * 60}")
