"""
시야 (Siya) — 재무 계정 확장(B-1) 사전 실측 진단 (일회성, DB 저장 안 함)

핸드오프(docs/핸드오프_재무확장.md)가 요구한 4종(=6컬럼) 계정이
DART finstate_all에서 실제로 추출 가능한지, 커버리지가 어떤지 샘플로 검증한다.

검증 목표:
  1. [전제] finstate_all 응답에 현금흐름표(sj_div='CF')가 포함되는가
       → CFO를 '별도 조회 없이' 같은 df에서 뽑을 수 있는지의 핵심 전제.
         이게 깨지면 CFO 조달 방식을 재설계해야 하므로 가장 먼저 확인한다.
  2. [커버리지] 6개 계정 매칭율 (account_id 우선, 이름 폴백):
       cost_of_sales / gross_profit / cash_and_equiv /
       current_assets / current_liabilities / cfo
  3. [매출총이익 산출] GrossProfit 직접 계정 vs (매출−매출원가) 계산 vs 부재 분류
       → 핸드오프 §5-4 회신 항목.
  4. [업종 패턴] 금융업(은행/증권/보험)에서 매출원가·유동구분 부재가 '정상'인지 확인
       → 총이익성/유동비율 팩터가 애초에 부적합한 업종을 식별(NULL이 맞는 케이스).
  5. [분기 누적] 2026 1Q(11013)에서 CFO가 누적(thstrm_add_amount)으로 잡히는지 확인.

실행:
    conda activate siya
    set PYTHONIOENCODING=utf-8          (Windows cp949 인코딩 함정 회피)
    python src/data/collectors/check_financial_expansion.py

기준일: FY2025 연간(11011) 중심 + 2026 1Q(11013)로 CFO 누적 확인.
DART 콜: ~28종목 × 2보고서 × (CFS→OFS 폴백) ≈ 120~160콜. 일 한도(10,000) 내 안전.
DART API 사용 (KIS 아님) — collect_financials.py의 finstate_all 호출 패턴 재사용.
"""

import os
import sys
import time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import OpenDartReader
from utils import get_supabase

supabase = get_supabase()
DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)

# ── 확장 대상 6계정: (라벨, sj_div 구간, account_id 우선, 이름 폴백 키워드) ──
#    이름 폴백은 부분일치(regex=False). CFO 한글명은 회사마다
#    '영업활동현금흐름' / '영업활동으로인한현금흐름' 등으로 갈려 '영업활동'으로 넓게 잡는다.
TARGETS = [
    ('매출원가',   'IS', 'ifrs-full_CostOfSales',              '매출원가'),
    ('매출총이익', 'IS', 'ifrs-full_GrossProfit',              '매출총이익'),
    ('현금성자산', 'BS', 'ifrs-full_CashAndCashEquivalents',   '현금및현금성자산'),
    ('유동자산',   'BS', 'ifrs-full_CurrentAssets',            '유동자산'),
    ('유동부채',   'BS', 'ifrs-full_CurrentLiabilities',       '유동부채'),
    ('CFO',        'CF', 'ifrs-full_CashFlowsFromUsedInOperatingActivities', '영업활동'),
]

# 업종 패턴을 눈으로 확인하기 위해 성격이 다른 종목을 손으로 고정 지정.
#   - 제조/일반: 매출원가·유동구분·CF 모두 있을 것으로 기대
#   - 금융(은행/증권/보험/지주): 매출원가/GrossProfit 부재 + 유동/비유동 미구분 예상(→ NULL 정상)
#   - 유통/서비스: 매출원가 있음, 마진 얇음
SAMPLE = [
    # (코드, 이름, 성격태그)
    ('005930', '삼성전자',      '제조'),
    ('000660', 'SK하이닉스',    '제조'),
    ('005380', '현대차',        '제조'),
    ('051910', 'LG화학',        '제조/화학'),
    ('005490', 'POSCO홀딩스',   '철강/지주'),
    ('000270', '기아',          '제조'),
    ('068270', '셀트리온',      '바이오'),
    ('207940', '삼성바이오로직스','바이오'),
    ('035420', 'NAVER',        '인터넷/서비스'),
    ('035720', '카카오',        '인터넷/서비스'),
    ('105560', 'KB금융',        '금융/은행'),
    ('055550', '신한지주',      '금융/은행'),
    ('086790', '하나금융지주',  '금융/은행'),
    ('016360', '삼성증권',      '금융/증권'),
    ('006800', '미래에셋증권',  '금융/증권'),
    ('032830', '삼성생명',      '금융/보험'),
    ('000810', '삼성화재',      '금융/보험'),
    ('028260', '삼성물산',      '지주/건설'),
    ('034730', 'SK',            '지주'),
    ('015760', '한국전력',      '유틸리티'),
    ('033780', 'KT&G',          '소비재'),
    ('097950', 'CJ제일제당',    '음식료'),
    ('023530', '롯데쇼핑',      '유통'),
    ('139480', '이마트',        '유통'),
    ('009540', 'HD한국조선해양','조선/지주'),
    ('001040', 'CJ',            '지주'),
    ('316140', '우리금융지주',  '금융/은행'),
    ('323410', '카카오뱅크',    '금융/은행'),
]


def parse_amount(value):
    if value is None or value == '' or value == '-':
        return None
    try:
        return int(str(value).replace(',', ''))
    except (ValueError, TypeError):
        return None


def disp_width(s):
    return sum(2 if ord(ch) > 0x1100 else 1 for ch in str(s))


def pad(s, width):
    s = str(s)
    gap = width - disp_width(s)
    return s + (' ' * gap if gap > 0 else '')


def fetch_one(code, year, reprt, fs_div):
    old_stdout = sys.stdout
    sys.stdout = open(os.devnull, 'w')
    try:
        df = dart.finstate_all(code, year, reprt_code=reprt, fs_div=fs_div)
    except Exception:
        df = None
    finally:
        sys.stdout.close()
        sys.stdout = old_stdout
    time.sleep(0.2)
    if df is None or isinstance(df, dict):
        return None
    if hasattr(df, 'empty') and df.empty:
        return None
    return df


def get_any(code, year, reprt):
    """CFS 우선, 없으면 OFS. (df, fs_div) 반환."""
    df = fetch_one(code, year, reprt, 'CFS')
    if df is not None:
        return df, 'CFS'
    df = fetch_one(code, year, reprt, 'OFS')
    if df is not None:
        return df, 'OFS'
    return None, None


def amount_by(rows, account_id, name_kw, cumulative=False):
    """account_id 우선 → 이름 폴백. 매칭 방식('id'/'name'/None)과 값을 함께 반환."""
    def _amt(row):
        if cumulative:
            v = parse_amount(row.get('thstrm_add_amount'))
            if v is not None:
                return v
        return parse_amount(row.get('thstrm_amount'))

    m = rows[rows['account_id'] == account_id]
    if not m.empty:
        return 'id', _amt(m.iloc[0])
    m = rows[rows['account_nm'].str.contains(name_kw, na=False, regex=False)]
    if not m.empty:
        return 'name', _amt(m.iloc[0])
    return None, None


def rows_for(df, sj):
    if sj == 'IS':
        return df[df['sj_div'].isin(['IS', 'CIS'])]
    return df[df['sj_div'] == sj]


def revenue_of(df):
    is_rows = rows_for(df, 'IS')
    for aid, kw in [('ifrs-full_Revenue', '매출액'), (None, '수익')]:
        if aid:
            _, v = amount_by(is_rows, aid, '매출액')
        else:
            _, v = amount_by(is_rows, '___', '수익')
        if v is not None:
            return v
    return None


def main():
    print("=" * 96)
    print("재무 계정 확장(B-1) 사전 실측 진단  —  FY2025 연간 중심 + 2026 1Q CFO 누적 확인")
    print("=" * 96)
    print(f"\n샘플 {len(SAMPLE)}종목 (제조/바이오/서비스/금융/유통/지주 혼합)\n")

    # 커버리지 카운터
    labels = [t[0] for t in TARGETS]
    cov = {lab: {'id': 0, 'name': 0, 'miss': 0} for lab in labels}
    cf_present = 0            # finstate_all에 CF 구간이 포함된 종목 수
    gp_kind_tally = {'직접': 0, '계산': 0, '부재': 0}
    cfo_cum_ok = {'ok': 0, 'no': 0, 'n/a': 0}   # 2026 1Q CFO 누적 잡힘 여부

    header = (f"{pad('종목명', 20)} {pad('성격', 12)} {pad('fs', 5)} {pad('CF', 4)} "
              f"{pad('매출원가', 9)} {pad('매출총익', 9)} {pad('현금성', 8)} "
              f"{pad('유동자산', 9)} {pad('유동부채', 9)} {pad('CFO', 6)} {pad('GP산출', 8)}")
    print(header)
    print("-" * disp_width(header))

    def mark(kind):
        # 'id' 매칭=●, 'name' 폴백=○, 부재=·
        return {'id': '●', 'name': '○', None: '·'}[kind]

    for code, name, tag in SAMPLE:
        df, fs = get_any(code, 2025, '11011')
        if df is None:
            print(f"{pad(name, 20)} {pad(tag, 12)} {pad('-', 5)} (FY2025 조회 실패/부재)")
            continue

        sj_set = set(str(x) for x in df['sj_div'].unique())
        has_cf = 'CF' in sj_set
        if has_cf:
            cf_present += 1

        # 6계정 매칭
        cell = {}
        for lab, sj, aid, kw in TARGETS:
            rows = rows_for(df, sj)
            kind, _v = amount_by(rows, aid, kw)
            cell[lab] = kind
            if kind == 'id':
                cov[lab]['id'] += 1
            elif kind == 'name':
                cov[lab]['name'] += 1
            else:
                cov[lab]['miss'] += 1

        # 매출총이익 산출 방식 분류
        is_rows = rows_for(df, 'IS')
        gp_kind_val = amount_by(is_rows, 'ifrs-full_GrossProfit', '매출총이익')[1]
        cost_val = amount_by(is_rows, 'ifrs-full_CostOfSales', '매출원가')[1]
        rev_val = revenue_of(df)
        if gp_kind_val is not None:
            gp_kind = '직접'
        elif rev_val is not None and cost_val is not None:
            gp_kind = '계산'
        else:
            gp_kind = '부재'
        gp_kind_tally[gp_kind] += 1

        # 2026 1Q CFO 누적 확인 (제출된 종목만)
        dfq, _fsq = get_any(code, 2026, '11013')
        if dfq is None:
            cfo_cum_ok['n/a'] += 1
        else:
            cf_rows_q = rows_for(dfq, 'CF')
            kindq, vq = amount_by(cf_rows_q,
                                  'ifrs-full_CashFlowsFromUsedInOperatingActivities',
                                  '영업활동', cumulative=True)
            if vq is not None:
                cfo_cum_ok['ok'] += 1
            else:
                cfo_cum_ok['no'] += 1

        print(f"{pad(name, 20)} {pad(tag, 12)} {pad(fs, 5)} "
              f"{pad('Y' if has_cf else 'N', 4)} "
              f"{pad(mark(cell['매출원가']), 9)} {pad(mark(cell['매출총이익']), 9)} "
              f"{pad(mark(cell['현금성자산']), 8)} {pad(mark(cell['유동자산']), 9)} "
              f"{pad(mark(cell['유동부채']), 9)} {pad(mark(cell['CFO']), 6)} "
              f"{pad(gp_kind, 8)}")

    n = len(SAMPLE)
    print("\n" + "=" * 96)
    print(f"[전제] finstate_all 내 현금흐름표(CF) 포함: {cf_present}/{n}종목")
    print("   → CF가 대부분 포함되면 CFO를 별도 조회 없이 같은 df에서 추출 가능(설계 전제 성립).")
    print("=" * 96)

    print("\n[커버리지] 계정별 매칭 (●id / ○name / ·부재)")
    print(f"{'계정':<14}{'id매칭':>8}{'이름폴백':>10}{'부재':>8}{'유효%':>8}")
    for lab in labels:
        c = cov[lab]
        valid = c['id'] + c['name']
        pct = valid / n * 100 if n else 0
        print(f"{pad(lab, 14)}{c['id']:>8}{c['name']:>10}{c['miss']:>8}{pct:>7.0f}%")

    print("\n[매출총이익 산출 방식]")
    for k in ('직접', '계산', '부재'):
        print(f"  · {pad(k, 6)} {gp_kind_tally[k]}종목")
    print("   → '직접'=DART GrossProfit 계정 사용 / '계산'=매출−매출원가 / '부재'=둘 다 없음(금융업 등)")

    print("\n[분기(2026 1Q) CFO 누적 추출]")
    print(f"  · 누적값 잡힘 {cfo_cum_ok['ok']} / 못잡음 {cfo_cum_ok['no']} / 분기미제출 {cfo_cum_ok['n/a']}")

    print("\n" + "-" * 96)
    print("해석 가이드:")
    print("  · 매출원가/매출총이익 '부재'가 금융(은행·증권·보험)에 몰리면 → 정상(그 업종은 총이익성 부적합).")
    print("  · 유동자산/유동부채 '부재'가 금융에 몰리면 → 정상(유동/비유동 미구분 관행).")
    print("  · CFO '부재'가 제조/일반주에서 나오면 → 조사 필요(현금흐름표 미제출 or account_id 상이).")
    print("  · CF 포함율이 낮으면 → CFO 조달 방식 재설계 필요(핸드오프 §4 보고 대상).")
    print("=" * 96)


if __name__ == '__main__':
    main()
