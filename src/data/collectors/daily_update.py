"""
시야 (Siya) — 일일 자동 업데이트 스크립트
매일 장 마감 후 GitHub Actions에서 자동 실행

수행 작업:
  1. 최근 시세 수집 (KIS API 종목별 일봉, 최근 10거래일)
  2. PER/PBR 재계산 (최신 시세 + 재무제표)
  2b. 우선주 재무데이터 복사 (보통주 → 우선주, PER/PBR 재계산)
  3. RSI/MACD 재계산 (최근 시세 기반)
  4. 기관/외국인 수급 수집 (한국투자증권 API)
  5. 원/달러 환율 수집 (ECOS API, 보조지표)
  6. 종목 상태 스냅샷 (관리종목·거래정지 등, KIS API)

실행: python src/data/collectors/daily_update.py
"""

import os
import sys
import time
import httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)

from supabase import create_client
import FinanceDataReader as fdr
from kis_api import kis_get, get_access_token
from collect_fx import update_fx
from collect_stock_status import update_stock_status, describe

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

TODAY = datetime.today()
TODAY_STR = TODAY.strftime('%Y-%m-%d')


# 일시적 연결 끊김 재시도 (2026-06-12 추가)
# GitHub Actions 장시간 실행 중 Supabase가 HTTP/2 연결을 graceful close하면
# httpx.RemoteProtocolError(ConnectionTerminated)가 발생해 스크립트 전체가 죽는다.
# 이런 일시적 네트워크 오류는 지수 백오프로 재시도한다.
_TRANSIENT_HTTPX = (
    httpx.RemoteProtocolError,
    httpx.ReadError,
    httpx.WriteError,
    httpx.ConnectError,
    httpx.ConnectTimeout,
    httpx.ReadTimeout,
    httpx.WriteTimeout,
    httpx.PoolTimeout,
)


def execute_with_retry(query, retries=4, base_delay=1.5):
    """Supabase 쿼리 빌더를 실행하되, 일시적 네트워크 오류 시 재시도한다."""
    for attempt in range(retries):
        try:
            return query.execute()
        except _TRANSIENT_HTTPX as e:
            if attempt == retries - 1:
                raise
            wait = base_delay * (2 ** attempt)
            print(f"  ⚠️ 연결 끊김 재시도 {attempt+1}/{retries} ({type(e).__name__}) — {wait:.0f}s 대기")
            time.sleep(wait)


def _ensure_kis_token():
    """
    KIS 스텝(시세/수급) 진입 가드.
    종목 루프 직전에 토큰을 명시적으로 확보하고, 네트워크 3회 재시도까지 실패해
    None이면 런 전체를 실패(exit 1)로 끝낸다.

    배경: get_access_token이 종목 루프의 try/except 안에서만 불리면, 토큰 None일 때
    전 종목이 조용히 건너뛰어지며 '빈 런 성공'으로 끝난다(가장 위험한 조용한 실패).
    KIS 스텝 진입 전에 가드를 둬서 빨간불(exit≠0)로 명확히 실패시킨다.
    """
    token = get_access_token()
    if token is None:
        print("=" * 60)
        print("❌ KIS 토큰 확보 실패 — 네트워크 재시도 모두 실패")
        print("   KIS 시세/수급 수집 불가 → 런을 실패로 종료 (빈 런 성공 방지)")
        print("=" * 60)
        sys.exit(1)


def get_all_stocks():
    stocks = []
    offset = 0
    while True:
        res = execute_with_retry(supabase.table('stocks').select(
            'stock_code, stock_name, market'
        ).eq('is_active', True).range(offset, offset + 999))
        stocks.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000
    return stocks


def get_latest_dps_map():
    """
    종목별 최신 DPS 맵 (배당 carry-forward용).
    daily_update가 매일 새 valuation 행을 만들 때 dps/div_yield가 NULL로 빠져
    상세 화면(최신 행 1건 조회)에서 배당수익률이 '-'로 뜨는 문제 방지.
    최근 30일 내 dps가 채워진 행 중 종목별 최신값 사용 (div_yield는 당일 종가로 재계산).
    """
    cutoff = (TODAY - timedelta(days=30)).strftime('%Y-%m-%d')
    dps_map = {}
    offset = 0
    while True:
        res = execute_with_retry(supabase.table('valuation').select(
            'stock_code, dps, trade_date'
        ).gte('dps', 0).gte('trade_date', cutoff).order(
            'trade_date', desc=True
        ).range(offset, offset + 999))
        for r in res.data:
            code = r['stock_code']
            if code not in dps_map:  # 날짜 내림차순이므로 첫 등장이 최신
                dps_map[code] = r['dps']
        if len(res.data) < 1000:
            break
        offset += 1000
    return dps_map


# ══════════════════════════════════════════════
# Step 1: 최근 시세 수집 (KIS API 종목별 일봉)
# ══════════════════════════════════════════════

def update_prices():
    """KIS API inquire-daily-itemchartprice로 종목별 최근 10거래일 일봉 수집"""
    print("=" * 60)
    print(f"Step 1: 시세 업데이트 - KIS API ({TODAY_STR})")
    print("=" * 60)

    _ensure_kis_token()  # 토큰 없으면 빈 런 성공 방지 위해 여기서 즉시 실패 종료
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
                execute_with_retry(supabase.table('price_daily').upsert(
                    batch, on_conflict='stock_code,trade_date'
                ))
            total_rows += len(all_rows)
            all_rows = []

        if (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} ({success} 성공, {total_rows}행 저장)")

    # 잔여 저장
    if all_rows:
        for j in range(0, len(all_rows), 200):
            batch = all_rows[j:j + 200]
            execute_with_retry(supabase.table('price_daily').upsert(
                batch, on_conflict='stock_code,trade_date'
            ))
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
        res = execute_with_retry(supabase.table('financials').select(
            'stock_code, net_income, net_income_owners, total_equity, equity_owners, fiscal_year'
        ).eq('fiscal_quarter', 'FY').order('fiscal_year', desc=True).range(offset, offset + 999))
        for r in res.data:
            if r['stock_code'] not in fin_map:
                fin_map[r['stock_code']] = r
        if len(res.data) < 1000:
            break
        offset += 1000

    # TTM(최근 4분기) 이익 — EPS 분자를 ttm_earnings 기준으로 전환 (2026-06-24)
    ttm_map = {}
    offset = 0
    while True:
        res = execute_with_retry(supabase.table('ttm_earnings').select(
            'stock_code, ttm_net_income_owners, basis').range(offset, offset + 999))
        for r in res.data:
            ttm_map[r['stock_code']] = r
        if len(res.data) < 1000:
            break
        offset += 1000
    print(f"  TTM 이익: {len(ttm_map)}개 종목")

    dps_map = get_latest_dps_map()
    print(f"  배당 DPS: {len(dps_map)}개 종목")

    success = 0
    rows = []

    for s in stocks:
        code = s['stock_code']
        shares = shares_map.get(code)
        fin = fin_map.get(code)

        if not shares or not fin:
            continue

        # EPS = TTM(최근 4분기) 지배주주순이익 기준 (ttm_earnings, 2026-06-24 전환).
        #   ttm_earnings.basis가 'ttm'/'annual' 원천 — 'annual' 폴백 행도 ttm_net_income_owners에
        #   직전 FY 지배주주순이익이 들어있어 한 소스로 일관 처리. ttm_earnings에 없거나
        #   값이 NULL이면 FY financials로 최종 폴백(basis='annual').
        ttm = ttm_map.get(code)
        if ttm and ttm.get('ttm_net_income_owners') is not None:
            net_income = ttm['ttm_net_income_owners']
            eps_basis = ttm['basis']
        else:
            net_income = fin.get('net_income_owners') or fin.get('net_income')
            eps_basis = 'annual'
        # BPS는 지분(시점값)이라 TTM 무관 — FY 지배주주지분 유지.
        total_equity = fin.get('equity_owners') or fin.get('total_equity')

        if not net_income or not total_equity:
            continue

        price_res = execute_with_retry(supabase.table('price_daily').select('close, trade_date').eq(
            'stock_code', code
        ).order('trade_date', desc=True).limit(1))

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

        row = {
            'stock_code': code,
            'trade_date': trade_date,
            'per': per,
            'pbr': pbr,
            'eps': round(eps, 2) if eps else None,
            'bps': round(bps, 2) if bps else None,
            'eps_basis': eps_basis,
            'source': 'calc'
        }

        # 배당 carry-forward: 최신 DPS를 당일 종가로 div_yield 재계산해 새 행에도 채움
        dps = dps_map.get(code)
        if dps is not None:
            row['dps'] = dps
            row['div_yield'] = round(dps / close * 100, 2) if (dps > 0 and close > 0) else 0

        rows.append(row)
        success += 1

    if rows:
        for j in range(0, len(rows), 200):
            batch = rows[j:j + 200]
            execute_with_retry(supabase.table('valuation').upsert(
                batch, on_conflict='stock_code,trade_date'
            ))

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
            common_val = execute_with_retry(supabase.table('valuation').select('*').eq(
                'stock_code', common_code
            ).order('trade_date', desc=True).limit(1))

            if not common_val.data:
                print(f"  ⚠️ {common_code} valuation 없음")
                continue

            cv = common_val.data[0]

            # 2. 우선주 최신 시세 조회
            pref_price = execute_with_retry(supabase.table('price_daily').select(
                'close, trade_date'
            ).eq('stock_code', pref_code).order('trade_date', desc=True).limit(1))

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
            execute_with_retry(supabase.table('valuation').upsert({
                'stock_code': pref_code,
                'trade_date': pref_date,
                'per': per,
                'pbr': pbr,
                'eps': eps,
                'bps': bps,
                'dps': cv.get('dps'),
                'div_yield': cv.get('div_yield'),
                'eps_basis': cv.get('eps_basis'),  # 보통주 EPS 기준(ttm/annual) 그대로 승계
                'source': 'calc_pref',
            }, on_conflict='stock_code,trade_date'))

            # 5. 보통주 최신 financials 복사 (연간 FY행만 — 분기행 dart_q 도입 후
            #    fiscal_quarter 필터 없으면 2026 Q1 등 분기행이 섞여 복사되는 회귀 방지)
            common_fin = execute_with_retry(supabase.table('financials').select('*').eq(
                'stock_code', common_code
            ).eq('fiscal_quarter', 'FY').order('fiscal_year', desc=True).limit(3))

            for cf in (common_fin.data or []):
                execute_with_retry(supabase.table('financials').upsert({
                    'stock_code': pref_code,
                    'fiscal_year': cf['fiscal_year'],
                    'fiscal_quarter': cf['fiscal_quarter'],
                    'revenue': cf.get('revenue'),
                    'operating_income': cf.get('operating_income'),
                    'net_income': cf.get('net_income'),
                    'net_income_owners': cf.get('net_income_owners'),
                    'total_assets': cf.get('total_assets'),
                    'total_equity': cf.get('total_equity'),
                    'equity_owners': cf.get('equity_owners'),
                    'total_liabilities': cf.get('total_liabilities'),
                    'cost_of_sales': cf.get('cost_of_sales'),
                    'gross_profit': cf.get('gross_profit'),
                    'cash_and_equiv': cf.get('cash_and_equiv'),
                    'current_assets': cf.get('current_assets'),
                    'current_liabilities': cf.get('current_liabilities'),
                    'cfo': cf.get('cfo'),
                    'roe': cf.get('roe'),
                    'roa': cf.get('roa'),
                    'operating_margin': cf.get('operating_margin'),
                    'debt_ratio': cf.get('debt_ratio'),
                    'source': 'copy_common',
                }, on_conflict='stock_code,fiscal_year,fiscal_quarter'))

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
            result = execute_with_retry(supabase.table('price_daily').select(
                'close, trade_date'
            ).eq('stock_code', code).order('trade_date', desc=False).limit(100))

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
            execute_with_retry(supabase.table('technical').upsert(
                batch, on_conflict='stock_code,trade_date'
            ))

    print(f"✅ RSI/MACD 완료: {success}개 종목\n")


# ══════════════════════════════════════════════
# Step 4: 기관/외국인 수급 수집 (KIS API)
# ══════════════════════════════════════════════

def update_investor():
    """KIS API로 전 종목 투자자별 매매동향 수집"""
    print("=" * 60)
    print(f"Step 4: 기관/외국인 수급 수집 - KIS API ({TODAY_STR})")
    print("=" * 60)

    _ensure_kis_token()  # 런 도중 토큰 만료/네트워크 단절 대비 2차 가드
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
                execute_with_retry(supabase.table('investor_trading').upsert(
                    batch, on_conflict='stock_code,trade_date'
                ))
            all_rows = []

        if (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} ({success} 성공)")

    # 잔여 저장
    if all_rows:
        for j in range(0, len(all_rows), 200):
            batch = all_rows[j:j + 200]
            execute_with_retry(supabase.table('investor_trading').upsert(
                batch, on_conflict='stock_code,trade_date'
            ))

    print(f"✅ 수급 완료: {success}개 성공, {skip}개 건너뜀, {errors}개 오류\n")


# ══════════════════════════════════════════════
# Step 5: 원/달러 환율 수집 (ECOS API, 보조지표)
# ══════════════════════════════════════════════

def update_fx_step():
    """
    ECOS 매매기준율을 fx_daily에 업서트 (collect_fx.update_fx 재사용, 단일 출처).
    최근 며칠치를 겹쳐 받아 누락분을 UPSERT로 자동 만회한다 (하루 1건이라 부담 없음).
    환율은 보조지표이므로 실패해도 전체 수집을 막지 않도록 try/except로 격리한다.
    """
    print("=" * 60)
    print(f"Step 5: 원/달러 환율 수집 - ECOS API ({TODAY_STR})")
    print("=" * 60)

    try:
        res = update_fx(supabase, days=10, executor=execute_with_retry)
        print(f"✅ FX 완료: {res['saved']}건 저장 "
              f"({res['start']}~{res['end']}, 건너뜀 {res['skipped']}개)\n")
    except Exception as e:
        print(f"  ⚠️ FX 수집 실패 (건너뜀, 메인 수집에 영향 없음): {e}\n")


# ══════════════════════════════════════════════
# Step 6: 종목 상태 스냅샷 (관리종목·거래정지 등)
# ══════════════════════════════════════════════

def update_stock_status_step():
    """
    KIS 주식현재가로 전 종목 상태 플래그를 훑어 stock_status에 업서트
    (collect_stock_status.update_stock_status 재사용, 단일 출처).

    ⚠️ Step 1(일봉)·Step 4(수급)와 **다른 엔드포인트**라 종목당 1콜이 별도로 든다.
       두 응답 모두 상태 플래그를 담고 있지 않음(2026-08-27 실측). 전종목 ~19분.

    과거 상태는 어느 소스로도 소급 복원할 수 없다 → **매일 쌓는 것 자체가 산출물**이라
    누락된 날은 영구히 빈다. 다만 보조 데이터이므로 실패해도 Step 1~5를 막지 않게
    try/except로 격리한다(FX Step 5와 동일 방침).
    """
    print("=" * 60)
    print(f"Step 6: 종목 상태 스냅샷 - KIS API ({TODAY_STR})")
    print("=" * 60)

    try:
        _ensure_kis_token()  # 런 도중 토큰 만료 대비 (Step 1·4와 동일 가드)
        res = update_stock_status(supabase, executor=execute_with_retry,
                                  snapshot_date=TODAY_STR)
        print(f"✅ 상태 스냅샷 완료: {res['success']}/{res['total']} 성공, "
              f"{res['skipped']}개 건너뜀, {res['errors']}개 오류, {res['saved']}행 저장")
        print(f"   상태 플래그가 선 종목: {len(res['flagged'])}개")
        for r in res['flagged']:
            print(f"   · {r['stock_code']} {r['stock_name']} → {describe(r)}")
        print()
    except Exception as e:
        print(f"  ⚠️ 상태 스냅샷 실패 (건너뜀, 메인 수집에 영향 없음): {e}\n")


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
    update_fx_step()
    update_stock_status_step()

    elapsed = time.time() - start_time
    print(f"\n{'#' * 60}")
    print(f"  전체 완료! (소요 시간: {elapsed/60:.1f}분)")
    print(f"{'#' * 60}")
