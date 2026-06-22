"""
시야 (Siya) — 분기 재무 데이터 품질 사전 점검 (일회성 진단 도구)

TTM(최근 4분기) 전환 빌드에 앞서, DART 분기 재무 데이터가 실제로 쓸 만한지 검증한다.
샘플 30종목(대형5/중형10/소형10/SPAC5)에 대해 4개 지표를 측정하고
TTM 적용 가능 비율 + 커버리지 정책 결론을 출력한다. DB에 저장하지 않는다.

실행:
    conda activate siya
    set PYTHONIOENCODING=utf-8   (Windows cp949 인코딩 함정 회피)
    python src/data/collectors/check_quarterly_coverage.py

참고: DART API 일 10,000건 제한. 30종목 × ~5~10개 분기점 ≈ 200~300콜로 한도 내 안전.
DART API 사용 (KIS 아님) — collect_financials.py의 finstate_all 호출 패턴 재사용.
기준일: 2026-06-22 (직전 연간=FY2025, 최신 분기=2026 1Q).

[정밀화 v2 — 2026-06-22]
 - 누적값: 분기보고서 손익은 thstrm_amount(당기 3개월)와 thstrm_add_amount(당기 누적)가
   공존한다. TTM/누적정합은 '누적'이 필요하므로 add_amount 우선 사용(없으면 thstrm).
 - account_id 매칭: CFS(연결) 강제 후 판정. 개별재무제표(OFS)엔 지배주주 분리가 없어
   폴백으로 잡히면 ID가 당연히 없으므로, N의 진짜 원인을 분류:
     · 분기없음     : 최근 분기보고 자체가 없음
     · 개별만(OFS)  : 연결(CFS) 미제출 → 폴백이라 지배주주 분리 없음 (아티팩트성)
     · 연결O/ID없음 : 연결은 있는데 표준 account_id 부재 (진짜 부재)
"""

import os
import re
import sys
import time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import FinanceDataReader as fdr
import OpenDartReader
from utils import get_supabase

supabase = get_supabase()
DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)

# 지배주주 XBRL account_id (연간 수집에서 쓰던 것과 동일 — collect_financials.py)
ACC_NI_OWNERS = 'ifrs-full_ProfitLossAttributableToOwnersOfParent'
ACC_EQ_OWNERS = 'ifrs-full_EquityAttributableToOwnersOfParent'

# 고정 지정 대형 5
LARGE_FIXED = [
    ('005930', '삼성전자'),
    ('000660', 'SK하이닉스'),
    ('028260', '삼성물산'),
    ('035720', '카카오'),
    ('105560', 'KB금융'),
]

# 분기 보고서 reprt_code (11011=사업보고서/연간, 11012=반기, 11013=1분기, 11014=3분기)
# 기준일 2026-06-22 기준 "최근 4개 분기" = 직전 4개 분기보고 시점
RECENT4 = [
    (2026, '11013', "26.1Q"),
    (2025, '11011', "25.사업"),
    (2025, '11014', "25.3Q"),
    (2025, '11012', "25.반기"),
]

# 누적 정합성 체크용 (같은 회계연도 1Q→반기→3Q 매출 누적 단조증가)
CUM_2025 = [(2025, '11013'), (2025, '11012'), (2025, '11014')]

# TTM 공식 구성요소: 직전연간(FY2025) − 작년동기(2025 1Q) + 올해동기(2026 1Q)
TTM_PARTS = [(2025, '11011'), (2025, '11013'), (2026, '11013')]

# account_id 매칭 판정에 쓰는 '분기' 보고(연간 제외, 최신순)
QUARTER_SEQ = [(2026, '11013'), (2025, '11014'), (2025, '11012')]


def parse_amount(value):
    if value is None or value == '' or value == '-':
        return None
    try:
        return int(str(value).replace(',', ''))
    except (ValueError, TypeError):
        return None


def is_preferred(name):
    return bool(re.search(r'우[A-Z]?$', name))


def disp_width(s):
    return sum(2 if ord(ch) > 0x1100 else 1 for ch in str(s))


def pad(s, width):
    s = str(s)
    gap = width - disp_width(s)
    return s + (' ' * gap if gap > 0 else '')


def fetch_one(code, year, reprt, fs_div):
    """단일 fs_div로 finstate_all 호출. 실패/없음 → None. stdout 노이즈 억제."""
    old_stdout = sys.stdout
    sys.stdout = open(os.devnull, 'w')
    try:
        df = dart.finstate_all(code, year, reprt_code=reprt, fs_div=fs_div)
    except Exception:
        df = None
    finally:
        sys.stdout.close()
        sys.stdout = old_stdout
    time.sleep(0.2)  # DART 유량 배려
    if df is None or isinstance(df, dict):
        return None
    if hasattr(df, 'empty') and df.empty:
        return None
    return df


def cum_amount(row):
    """누적 금액 우선(thstrm_add_amount), 없으면 당기(thstrm_amount).
    1분기·사업보고서는 add_amount가 없거나 thstrm과 동일."""
    v = parse_amount(row.get('thstrm_add_amount'))
    if v is None:
        v = parse_amount(row.get('thstrm_amount'))
    return v


def by_id_cum(rows, account_id):
    m = rows[rows['account_id'] == account_id]
    if not m.empty:
        return cum_amount(m.iloc[0])
    return None


def by_name_cum(rows, keyword):
    m = rows[rows['account_nm'].str.contains(keyword, na=False, regex=False)]
    if not m.empty:
        return cum_amount(m.iloc[0])
    return None


def revenue_cum(df):
    is_rows = df[df['sj_div'].isin(['IS', 'CIS'])]
    return (by_id_cum(is_rows, 'ifrs-full_Revenue')
            or by_name_cum(is_rows, '매출액') or by_name_cum(is_rows, '수익'))


def ni_owners_cum(df):
    is_rows = df[df['sj_div'].isin(['IS', 'CIS'])]
    return by_id_cum(is_rows, ACC_NI_OWNERS)


def owner_id_in(df):
    """지배주주 순이익 account_id가 손익(IS/CIS)에 등장하는가."""
    is_rows = df[df['sj_div'].isin(['IS', 'CIS'])]
    return bool((is_rows['account_id'] == ACC_NI_OWNERS).any())


# ────────────────────────────────────────────────────────────────
# 샘플 추출
# ────────────────────────────────────────────────────────────────
def load_market_caps():
    caps = {}
    for market in ['KOSPI', 'KOSDAQ']:
        df = fdr.StockListing(market)
        for _, row in df.iterrows():
            code = str(row.get('Code', '')).strip()
            if len(code) != 6:
                continue
            marcap = row.get('Marcap', None)
            name = str(row.get('Name', '')).strip()
            if marcap and int(marcap) > 0:
                caps[code] = {'name': name, 'marcap': int(marcap), 'market': market}
    return caps


def load_sectors():
    sectors = {}
    offset = 0
    while True:
        res = supabase.table('stocks').select('stock_code, sector')\
            .range(offset, offset + 999).execute()
        for r in res.data:
            sectors[r['stock_code']] = r.get('sector')
        if len(res.data) < 1000:
            break
        offset += 1000
    return sectors


def load_traded_latest():
    last = supabase.table('price_daily').select('trade_date')\
        .order('trade_date', desc=True).limit(1).execute()
    if not last.data:
        return set(), None
    latest = last.data[0]['trade_date']
    traded = set()
    offset = 0
    while True:
        res = supabase.table('price_daily').select('stock_code')\
            .eq('trade_date', latest).range(offset, offset + 999).execute()
        for r in res.data:
            traded.add(r['stock_code'])
        if len(res.data) < 1000:
            break
        offset += 1000
    return traded, latest


def build_sample(caps, sectors, traded):
    used = set(c for c, _ in LARGE_FIXED)
    common = {c: v for c, v in caps.items()
              if not is_preferred(v['name']) and '스팩' not in v['name']}
    ranked = sorted(common.items(), key=lambda kv: kv[1]['marcap'], reverse=True)
    n = len(ranked)

    mid_band = ranked[int(n * 0.30): int(n * 0.70)]
    mid, seen_sectors = [], set()
    for code, v in mid_band:
        if code in used:
            continue
        sec = sectors.get(code) or '미분류'
        if sec in seen_sectors:
            continue
        mid.append((code, v['name']))
        seen_sectors.add(sec)
        used.add(code)
        if len(mid) >= 10:
            break
    for code, v in mid_band:
        if len(mid) >= 10:
            break
        if code in used:
            continue
        mid.append((code, v['name']))
        used.add(code)

    small = []
    for code, v in sorted(common.items(), key=lambda kv: kv[1]['marcap']):
        if code in used or code not in traded:
            continue
        small.append((code, v['name']))
        used.add(code)
        if len(small) >= 10:
            break

    spacs = sorted([(c, v) for c, v in caps.items() if '스팩' in v['name']],
                   key=lambda kv: kv[1]['marcap'], reverse=True)
    spac = [(c, v['name']) for c, v in spacs[:5]]

    return [('대형', LARGE_FIXED), ('중형', mid), ('소형', small), ('SPAC', spac)]


# ────────────────────────────────────────────────────────────────
# 종목별 진단
# ────────────────────────────────────────────────────────────────
def diagnose(code):
    cfs_cache, ofs_cache = {}, {}

    def get_cfs(year, reprt):
        if (year, reprt) not in cfs_cache:
            cfs_cache[(year, reprt)] = fetch_one(code, year, reprt, 'CFS')
        return cfs_cache[(year, reprt)]

    def get_ofs(year, reprt):
        if (year, reprt) not in ofs_cache:
            ofs_cache[(year, reprt)] = fetch_one(code, year, reprt, 'OFS')
        return ofs_cache[(year, reprt)]

    def get_any(year, reprt):
        d = get_cfs(year, reprt)
        if d is not None:
            return d, 'CFS'
        d = get_ofs(year, reprt)
        if d is not None:
            return d, 'OFS'
        return None, None

    # 1) 최근 4개 분기 존재율 (CFS/OFS 어느 쪽이든 존재하면 카운트)
    present = 0
    for year, reprt, _ in RECENT4:
        df, _fs = get_any(year, reprt)
        if df is not None:
            present += 1

    # 2) account_id 매칭 — CFS 강제 + N 원인 분류
    #    최신 분기보고(연간 제외)를 기준으로 판정
    account_match = False
    reason = ''
    fs_used = '-'
    latest_q = None
    for year, reprt in QUARTER_SEQ:
        df, fs = get_any(year, reprt)
        if df is not None:
            latest_q = (year, reprt, fs)
            break
    if latest_q is None:
        reason = '분기없음'
    else:
        y, r, fs = latest_q
        cfs = get_cfs(y, r)
        if cfs is None:
            # 연결 미제출 → OFS만 존재 (지배주주 분리 없음)
            reason = '개별만(OFS)'
            fs_used = 'OFS'
        elif owner_id_in(cfs):
            account_match = True
            fs_used = 'CFS'
        else:
            reason = '연결O/ID없음'
            fs_used = 'CFS'

    # 3) 누적 정합성: 2025 1Q ≤ 반기 ≤ 3Q (매출 '누적' 기준, add_amount 사용)
    revs = []
    for year, reprt in CUM_2025:
        df, _fs = get_any(year, reprt)
        revs.append(revenue_cum(df) if df is not None else None)
    if all(rv is not None for rv in revs):
        q1, h1, q3 = revs
        cum_ok = 'Y' if (q1 <= h1 <= q3) else 'N'
    else:
        cum_ok = '-'

    # 4) TTM 공식 데이터 존재: FY2025 + 2025 1Q + 2026 1Q 모두 지배주주 순이익(CFS) 보유
    ttm_parts_ok = True
    for year, reprt in TTM_PARTS:
        cfs = get_cfs(year, reprt)
        if cfs is None or ni_owners_cum(cfs) is None:
            ttm_parts_ok = False
            break

    verdict = 'TTM' if (present >= 3 and account_match) else '연간폴백'
    api = len(cfs_cache) + len(ofs_cache)

    return {
        'present': present,
        'account_match': 'Y' if account_match else 'N',
        'reason': reason,
        'fs_used': fs_used,
        'cum_ok': cum_ok,
        'ttm_parts_ok': ttm_parts_ok,
        'verdict': verdict,
        'api': api,
    }


def main():
    print("=" * 84)
    print("분기 재무 데이터 품질 사전 점검 [정밀화 v2]  —  기준일 2026-06-22")
    print("=" * 84)

    print("\n[1/3] 시총·업종·거래 데이터 로딩...")
    caps = load_market_caps()
    sectors = load_sectors()
    traded, latest_date = load_traded_latest()
    print(f"  시총 {len(caps)}종목 / 업종 {len(sectors)}종목 / "
          f"최근 거래일({latest_date}) 체결 {len(traded)}종목")

    print("\n[2/3] 샘플 30종목 추출...")
    groups = build_sample(caps, sectors, traded)
    for gname, items in groups:
        print(f"  {gname}({len(items)}): {', '.join(nm for _, nm in items)}")

    print("\n[3/3] DART 분기 보고서 조회 + 진단 (CFS 강제)...\n")
    header = (f"{pad('종목명', 18)} {pad('그룹', 6)} {pad('분기', 7)} "
              f"{pad('ID매칭', 8)} {pad('fs', 5)} {pad('누적정합', 9)} "
              f"{pad('판정', 10)} {pad('N원인', 14)}")
    print(header)
    print("-" * disp_width(header))

    group_stats = {}
    reason_tally = {}
    total_ttm = total_n = total_api = 0

    for gname, items in groups:
        group_stats.setdefault(gname, [0, 0])
        for code, name in items:
            d = diagnose(code)
            total_api += d['api']
            group_stats[gname][1] += 1
            total_n += 1
            if d['verdict'] == 'TTM':
                group_stats[gname][0] += 1
                total_ttm += 1
            if d['account_match'] == 'N' and d['reason']:
                reason_tally[d['reason']] = reason_tally.get(d['reason'], 0) + 1
            flag = ' *' if (d['verdict'] == 'TTM' and not d['ttm_parts_ok']) else ''
            print(f"{pad(name, 18)} {pad(gname, 6)} {pad(str(d['present']) + '/4', 7)} "
                  f"{pad(d['account_match'], 8)} {pad(d['fs_used'], 5)} "
                  f"{pad(d['cum_ok'], 9)} {pad(d['verdict'] + flag, 10)} "
                  f"{pad(d['reason'], 14)}")

    print("\n" + "=" * 84)
    print("그룹별 TTM 적용 가능 비율")
    print("=" * 84)
    for gname, (ttm, tot) in group_stats.items():
        ratio = (ttm / tot * 100) if tot else 0
        print(f"  {pad(gname, 6)} {ttm}/{tot}  ({ratio:.0f}%)")
    overall = (total_ttm / total_n * 100) if total_n else 0
    print(f"\n  전체  {total_ttm}/{total_n}  ({overall:.0f}%)")

    print("\n" + "-" * 84)
    print("account_id 매칭 실패(N) 원인 분류:")
    if reason_tally:
        for rname, cnt in sorted(reason_tally.items(), key=lambda kv: -kv[1]):
            print(f"  · {pad(rname, 14)} {cnt}건")
    else:
        print("  (없음)")
    print("  ※ '개별만(OFS)'은 연결 미제출 폴백 아티팩트 — 연결 기준 데이터원을 보강하면")
    print("     구제 가능. '연결O/ID없음'이 진짜 부재(TTM 불가).")
    print(f"\n  DART 호출: 약 {total_api}건")
    print(f"  ('*' = TTM 판정이나 공식 구성요소(FY/작년동기/올해동기) 일부 결측)")

    # 한 줄 결론 — 진짜부재(연결O/ID없음)만 불가로 보면 잠재 커버리지가 달라짐
    true_absent = reason_tally.get('연결O/ID없음', 0)
    ofs_only = reason_tally.get('개별만(OFS)', 0)
    no_q = reason_tally.get('분기없음', 0)
    print("\n" + "=" * 84)
    if overall >= 85:
        concl = f"전체 {overall:.0f}% → TTM 전면 적용 + 미달 종목만 연간 폴백 권장."
    elif overall >= 65:
        concl = f"전체 {overall:.0f}% → 대형·중형 위주 TTM, 소형/SPAC 연간 폴백 권장."
    else:
        concl = f"전체 {overall:.0f}%로 하한 부족 → 종목별 게이트(TTM 가능분만)·나머지 연간 폴백."
    print("결론: " + concl)
    if ofs_only:
        print(f"  └ 단, N {sum(reason_tally.values())}건 중 '개별만(OFS)' {ofs_only}건은 폴백 아티팩트라")
        print(f"     연결 데이터원 보강 시 구제 가능 → 실질 상한은 더 높음. "
              f"진짜 부재(연결O/ID없음)는 {true_absent}건, 분기없음 {no_q}건.")
    print("=" * 84)


if __name__ == '__main__':
    main()
