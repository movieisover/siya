"""
시야 (Siya) — 일일 자동 업데이트 스크립트
매일 장 마감 후 GitHub Actions에서 자동 실행

수행 작업:
  1. 최근 시세 수집 (KIS API 종목별 일봉, 최근 10거래일)
  2. PER/PBR 재계산 (최신 시세 + 재무제표)
  2b. 우선주 재무데이터 복사 (보통주 → 우선주, PER/PBR 재계산)
  3. RSI/MACD 재계산 (최근 시세 기반)
  4. 기관/외국인 수급 수집 (한국투자증권 API)

실행: python src/data/collectors/daily_update.py
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
import FinanceDataReader as fdr
from kis_api import kis_get

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

TODAY = datetime.today()
TODAY_STR = TODAY.strftime('%Y-%m-%d')


def get_all_stocks():
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
# Step 1: 최근 시세 수집 (KIS API 종목별 일봉)
# ══════════════════════════════════════════════

def update_prices():
    """KIS API inquire-daily-itemchartprice로 종목별 최근 10거래일 일봉 수집"""
    print("=" * 60)
    print(f"Step 1: 시세 업데이트 - KIS API ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()
    total = len(stocks)

    start_date = (TODAY - timedelta(days=20)).strftime('%Y%m%d')  # 영업일 10일 확보
    end_date = TODAY.strftime('%Y%m%d')

    total_rows = 0
    success = 0
    errors = 0
    all_rows = []

    for i, s in enumerate(stocks):
        code = s['stock_code']
        name = s['stock_name']

        try:
            data = kis_get(
                '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
                'FHKST03010100',
                {
                    'FID_COND_MRKT_DIV_CODE': 'J',
                    'FID_INPUT_ISCD': code,
                    'FID_INPUT_DATE_1': start_date,
                    'FID_INPUT_DATE_2': end_date,
                    'FID_PERIOD_DIV_CODE': 'D',
                    'FID_ORG_ADJ_PRC': '0',
                }
            )

            if not data:
                continue

            items = data.get('output2', [])
            for item in items:
                date_str = item.get('stck_bsop_date', '')
                close_str = item.get('stck_clpr', '').strip()
                if not date_str or not close_str:
                    continue

                close_val = int(close_str)
                if close_val <= 0:
                    continue

                open_val = int(item.get('stck_oprc', '0') or '0')
                high_val = int(item.get('stck_hgpr', '0') or '0')
                low_val = int(item.get('stck_lwpr', '0') or '0')
                volume = int(item.get('acml_vol', '0') or '0')

                # 등락률: prdy_vrss / (close - prdy_vrss) * 100
                prdy_vrss = int(item.get('prdy_vrss', '0') or '0')
                prev_close = close_val - prdy_vrss
                change_pct = round(prdy_vrss / prev_close * 100, 4) if prev_close > 0 else None

                trade_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
                all_rows.append({
                    'stock_code': code,
                    'trade_date': trade_date,
                    'open': open_val if open_val > 0 else None,
                    'high': high_val if high_val > 0 else None,
                    'low': low_val if low_val > 0 else None,
                    'close': close_val,
                    'volume': volume,
                    'change_pct': change_pct,
                    'source': 'kis_api',
                })

            success += 1

        except Exception as e:
            if errors < 5:
                print(f"  ❌ {name}({code}): {e}")
            errors += 1

        # 1000행마다 배치 저장
        if len(all_rows) >= 1000:
            for j in range(0, len(all_rows), 200):
                batch = all_rows[j:j + 200]
                supabase.table('price_daily').upsert(
                    batch, on_conflict='stock_code,trade_date'
                ).execute()
            total_rows += len(all_rows)
            all_rows = []

        if (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} ({success} 성공, {total_rows}행 저장)")

    # 잔여 저장
    if all_rows:
        for j in range(0, len(all_rows), 200):
            batch = all_rows[j:j + 200]
            supabase.table('price_daily').upsert(
                batch, on_conflict='stock_code,trade_date'
            ).execute()
        total_rows += len(all_rows)

    print(f"✅ 시세 완료: {success}개 종목, {total_rows}건 (오류 {errors}개)\n")
    return total_rows


# ══════════════════════════════════════════════
# Step 2: PER/PBR 재계산
# ══════════════════════════════════════════════

def update_valuation():
    print("=" * 60)
    print(f"Step 2: PER/PBR 재계산 ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()

    shares_map = {}
    for market in ['KOSPI', 'KOSDAQ']:
        try:
            listing = fdr.StockListing(market)
            for _, row in listing.iterrows():
                code = str(row.get('Code', '')).strip()
                shares = row.get('Stocks', None)
                if code and shares and shares > 0:
                    shares_map[code] = int(shares)
        except Exception as e:
            print(f"  ⚠️ {market} 발행주식수 오류: {e}")

    print(f"  발행주식수: {len(shares_map)}개 종목")

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

        net_income = fin.get('net_income')
        total_equity = fin.get('total_equity')

        if not net_income or not total_equity:
            continue

        price_res = supabase.table('price_daily').select('close, trade_date').eq(
            'stock_code', code
        ).order('trade_date', desc=True).limit(1).execute()

        if not price_res.data:
            continue

        close = price_res.data[0]['close']
        trade_date = price_res.data[0]['trade_date']

        eps = (net_income * 1_000_000) / shares
        bps = (total_equity * 1_000_000) / shares

        per = round(close / eps, 2) if eps != 0 else None
        pbr = round(close / bps, 2) if bps != 0 else None

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

    if rows:
        for j in range(0, len(rows), 200):
            batch = rows[j:j + 200]
            supabase.table('valuation').upsert(
                batch, on_conflict='stock_code,trade_date'
            ).execute()

    print(f"✅ PER/PBR 완료: {success}개 종목\n")


# ══════════════════════════════════════════════
# Step 2b: 우선주 재무데이터 복사 (PER/PBR 재계산)
# ══════════════════════════════════════════════

# 우선주 → 보통주 매핑
PREFERRED_TO_COMMON = {
    '005935': '005930',  # 삼성전자우 → 삼성전자
    '005387': '005380',  # 현대차 2우B → 현대차
}


def update_preferred_stocks():
    """우선주에 보통주 재무데이터 복사 + 우선주 시세로 PER/PBR 재계산"""
    print("=" * 60)
    print(f"Step 2b: 우선주 재무데이터 복사 ({TODAY_STR})")
    print("=" * 60)

    for pref_code, common_code in PREFERRED_TO_COMMON.items():
        try:
            # 1. 보통주 최신 valuation 조회
            common_val = supabase.table('valuation').select('*').eq(
                'stock_code', common_code
            ).order('trade_date', desc=True).limit(1).execute()

            if not common_val.data:
                print(f"  ⚠️ {common_code} valuation 없음")
                continue

            cv = common_val.data[0]

            # 2. 우선주 최신 시세 조회
            pref_price = supabase.table('price_daily').select(
                'close, trade_date'
            ).eq('stock_code', pref_code).order('trade_date', desc=True).limit(1).execute()

            if not pref_price.data:
                print(f"  ⚠️ {pref_code} 시세 없음")
                continue

            pref_close = pref_price.data[0]['close']
            pref_date = pref_price.data[0]['trade_date']

            # 3. 우선주 시세로 PER/PBR 재계산
            eps = cv.get('eps')
            bps = cv.get('bps')
            per = round(pref_close / eps, 2) if eps and eps != 0 else None
            pbr = round(pref_close / bps, 2) if bps and bps != 0 else None
            if per is not None and per < 0:
                per = 0

            # 4. valuation upsert
            supabase.table('valuation').upsert({
                'stock_code': pref_code,
                'trade_date': pref_date,
                'per': per,
                'pbr': pbr,
                'eps': eps,
                'bps': bps,
                'dps': cv.get('dps'),
                'div_yield': cv.get('div_yield'),
                'source': 'calc_pref',
            }, on_conflict='stock_code,trade_date').execute()

            # 5. 보통주 최신 financials 복사
            common_fin = supabase.table('financials').select('*').eq(
                'stock_code', common_code
            ).order('fiscal_year', desc=True).limit(3).execute()

            for cf in (common_fin.data or []):
                supabase.table('financials').upsert({
                    'stock_code': pref_code,
                    'fiscal_year': cf['fiscal_year'],
                    'fiscal_quarter': cf['fiscal_quarter'],
                    'revenue': cf.get('revenue'),
                    'operating_income': cf.get('operating_income'),
                    'net_income': cf.get('net_income'),
                    'total_assets': cf.get('total_assets'),
                    'total_equity': cf.get('total_equity'),
                    'total_liabilities': cf.get('total_liabilities'),
                    'roe': cf.get('roe'),
                    'roa': cf.get('roa'),
                    'operating_margin': cf.get('operating_margin'),
                    'debt_ratio': cf.get('debt_ratio'),
                    'source': 'copy_common',
                }, on_conflict='stock_code,fiscal_year,fiscal_quarter').execute()

            print(f"  ✅ {pref_code}: PER={per}, PBR={pbr}, close={pref_close:,}")

        except Exception as e:
            print(f"  ❌ {pref_code}: {e}")

    print(f"✅ 우선주 처리 완료\n")


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
# Step 4: 기관/외국인 수급 수집 (KIS API)
# ══════════════════════════════════════════════

def update_investor():
    """KIS API로 전 종목 투자자별 매매동향 수집"""
    print("=" * 60)
    print(f"Step 4: 기관/외국인 수급 수집 - KIS API ({TODAY_STR})")
    print("=" * 60)

    stocks = get_all_stocks()
    total = len(stocks)
    success = 0
    skip = 0
    errors = 0
    all_rows = []

    for i, s in enumerate(stocks):
        code = s['stock_code']
        name = s['stock_name']

        try:
            data = kis_get(
                '/uapi/domestic-stock/v1/quotations/inquire-investor',
                'FHKST01010900',
                {'FID_COND_MRKT_DIV_CODE': 'J', 'FID_INPUT_ISCD': code}
            )

            if not data:
                skip += 1
                continue

            items = data.get('output', [])
            for item in items:
                date_str = item.get('stck_bsop_date', '')
                frgn_val = item.get('frgn_ntby_tr_pbmn', '').strip()
                orgn_val = item.get('orgn_ntby_tr_pbmn', '').strip()
                if not date_str or (not frgn_val and not orgn_val):
                    continue

                trade_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

                frgn_qty = item.get('frgn_ntby_qty', '').strip()
                orgn_qty = item.get('orgn_ntby_qty', '').strip()

                all_rows.append({
                    'stock_code': code,
                    'trade_date': trade_date,
                    'inst_net_buy': int(orgn_val) if orgn_val else 0,
                    'foreign_net_buy': int(frgn_val) if frgn_val else 0,
                    'inst_net_qty': int(orgn_qty) if orgn_qty else 0,
                    'foreign_net_qty': int(frgn_qty) if frgn_qty else 0,
                    'source': 'kis_api',
                })

            success += 1

        except Exception as e:
            if errors < 5:
                print(f"  ❌ {name}({code}): {e}")
            errors += 1

        # 1000행마다 배치 저장
        if len(all_rows) >= 1000:
            for j in range(0, len(all_rows), 200):
                batch = all_rows[j:j + 200]
                supabase.table('investor_trading').upsert(
                    batch, on_conflict='stock_code,trade_date'
                ).execute()
            all_rows = []

        if (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} ({success} 성공)")

    # 잔여 저장
    if all_rows:
        for j in range(0, len(all_rows), 200):
            batch = all_rows[j:j + 200]
            supabase.table('investor_trading').upsert(
                batch, on_conflict='stock_code,trade_date'
            ).execute()

    print(f"✅ 수급 완료: {success}개 성공, {skip}개 건너뜀, {errors}개 오류\n")


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
    update_preferred_stocks()
    update_technical()
    update_investor()

    elapsed = time.time() - start_time
    print(f"\n{'#' * 60}")
    print(f"  전체 완료! (소요 시간: {elapsed/60:.1f}분)")
    print(f"{'#' * 60}")
