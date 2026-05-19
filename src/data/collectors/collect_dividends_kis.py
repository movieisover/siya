"""
시야 (Siya) — KIS API 배당 데이터 수집

전 종목에 대해 최근 1년 배당 이력을 조회하고,
연간 DPS와 div_yield를 계산하여 valuation 테이블에 업데이트.

- 엔드포인트: /uapi/domestic-stock/v1/ksdinfo/dividend (HHKDB669102C0)
- DPS = 최근 1년 이내 record_date의 per_sto_divi_amt 합산
- div_yield = DPS / 최신 종가 × 100

주 1회 실행 권장 (배당은 분기/연 단위로만 변경됨).

실행: python src/data/collectors/collect_dividends_kis.py
"""

import os
import sys
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)

from supabase import create_client
from kis_api import get_dividend_history

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

TODAY = datetime.today()
TODAY_STR = TODAY.strftime('%Y-%m-%d')
ONE_YEAR_AGO = TODAY - timedelta(days=365)


def get_all_stocks():
    """활성 종목 전체 반환."""
    stocks = []
    offset = 0
    while True:
        res = supabase.table('stocks').select(
            'stock_code, stock_name'
        ).eq('is_active', True).range(offset, offset + 999).execute()
        stocks.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000
    return stocks


def get_latest_valuation_dates():
    """
    종목별 valuation 테이블의 가장 최신 trade_date 맵.
    dps/div_yield는 기존 per/pbr 행에만 UPDATE한다 (새 행 INSERT 금지).
    """
    cutoff = (TODAY - timedelta(days=10)).strftime('%Y-%m-%d')
    date_map = {}
    offset = 0
    while True:
        res = supabase.table('valuation').select(
            'stock_code, trade_date'
        ).gte('trade_date', cutoff).range(offset, offset + 999).execute()

        for r in res.data:
            code = r['stock_code']
            if code not in date_map or r['trade_date'] > date_map[code]:
                date_map[code] = r['trade_date']
        if len(res.data) < 1000:
            break
        offset += 1000
    return date_map


def get_latest_prices():
    """
    종목별 최신 시세(close, trade_date) 맵.
    price_daily에서 최근 3일 이내 데이터만 조회 (ORDER BY 없이 배치 처리).
    """
    cutoff = (TODAY - timedelta(days=5)).strftime('%Y-%m-%d')
    price_map = {}
    offset = 0
    while True:
        res = supabase.table('price_daily').select(
            'stock_code, close, trade_date'
        ).gte('trade_date', cutoff).range(offset, offset + 999).execute()

        for r in res.data:
            code = r['stock_code']
            # 기존보다 더 최신 날짜면 교체
            if code not in price_map or r['trade_date'] > price_map[code]['trade_date']:
                price_map[code] = {
                    'close': r['close'],
                    'trade_date': r['trade_date'],
                }
        if len(res.data) < 1000:
            break
        offset += 1000
    return price_map


def calc_annual_dps(dividend_history):
    """
    배당 이력 리스트에서 최근 1년 DPS 합산.
    현금배당(per_sto_divi_amt)만 사용. 주식배당(stk_divi_rate)은 제외.
    """
    total_dps = 0.0
    for item in dividend_history:
        record_date_str = item.get('record_date', '').strip()
        if not record_date_str or len(record_date_str) != 8:
            continue
        try:
            record_dt = datetime.strptime(record_date_str, '%Y%m%d')
        except ValueError:
            continue

        if record_dt < ONE_YEAR_AGO or record_dt > TODAY:
            continue

        amt_str = (item.get('per_sto_divi_amt') or '').strip()
        if not amt_str:
            continue
        try:
            total_dps += float(amt_str)
        except ValueError:
            continue

    return total_dps


def update_dividends():
    print("=" * 60)
    print(f"KIS 배당 데이터 수집 ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()
    total = len(stocks)
    print(f"전체 종목: {total}개")

    print("최신 시세 로드 중...")
    price_map = get_latest_prices()
    print(f"시세 있음: {len(price_map)}개 종목")

    print("valuation 최신 날짜 로드 중...")
    val_date_map = get_latest_valuation_dates()
    print(f"valuation 있음: {len(val_date_map)}개 종목")

    success = 0
    skip_no_price = 0
    skip_no_val = 0
    skip_no_div = 0
    errors = 0
    rows = []

    for i, s in enumerate(stocks):
        code = s['stock_code']
        name = s['stock_name']

        price_info = price_map.get(code)
        if not price_info:
            skip_no_price += 1
            continue

        close = price_info['close']
        if not close or close <= 0:
            skip_no_price += 1
            continue

        val_trade_date = val_date_map.get(code)
        if not val_trade_date:
            # 기존 per/pbr 행이 없으면 새 행을 만들지 않고 건너뜀
            skip_no_val += 1
            continue

        try:
            history = get_dividend_history(code)
            dps = calc_annual_dps(history)

            if dps <= 0:
                skip_no_div += 1
                rows.append({
                    'stock_code': code,
                    'trade_date': val_trade_date,
                    'dps': 0,
                    'div_yield': 0,
                })
                continue

            div_yield = round(dps / close * 100, 2)
            rows.append({
                'stock_code': code,
                'trade_date': val_trade_date,
                'dps': round(dps, 2),
                'div_yield': div_yield,
            })
            success += 1

        except Exception as e:
            if errors < 5:
                print(f"  ❌ {name}({code}): {e}")
            errors += 1

        # 500건마다 배치 저장
        if len(rows) >= 500:
            _save_batch(rows)
            rows = []

        if (i + 1) % 200 == 0:
            print(f"  ⏳ {i+1}/{total} (배당 {success}, 무배당 {skip_no_div}, 오류 {errors})")

    # 잔여 저장
    if rows:
        _save_batch(rows)

    print()
    print(f"✅ 배당 수집 완료")
    print(f"  - 배당 있음: {success}개")
    print(f"  - 배당 없음: {skip_no_div}개")
    print(f"  - 시세 없음: {skip_no_price}개")
    print(f"  - valuation 행 없음: {skip_no_val}개")
    print(f"  - 오류: {errors}개")


def _save_batch(rows):
    """
    기존 valuation 행(stock_code + trade_date 매칭)의 dps/div_yield만 UPDATE.
    새 행을 INSERT하면 per/pbr이 NULL인 빈 행이 생겨 스크리너가 깨지므로 절대 upsert 금지.
    """
    for r in rows:
        try:
            supabase.table('valuation').update({
                'dps': r['dps'],
                'div_yield': r['div_yield'],
            }).eq('stock_code', r['stock_code']).eq(
                'trade_date', r['trade_date']
            ).execute()
        except Exception as e:
            print(f"  ⚠️ 저장 실패 ({r['stock_code']}): {e}")


if __name__ == '__main__':
    start = time.time()
    print(f"\n{'#' * 60}")
    print(f"  시야 KIS 배당 수집")
    print(f"  실행 시각: {TODAY.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#' * 60}\n")

    update_dividends()

    elapsed = time.time() - start
    print(f"\n소요 시간: {elapsed/60:.1f}분")
