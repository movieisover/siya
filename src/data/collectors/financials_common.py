"""
시야 (Siya) — 재무제표 공용 추출 로직
collect_financials.py(연간)와 collect_quarterly.py(분기)가 공유하는 함수.

핵심: DART finstate_all 결과에서 XBRL account_id 기반으로 주요 계정을 추출한다.
회사마다 계정 한글명이 달라(예: "지배기업의 소유주지분" vs "지배기업소유주지분당기순이익")
account_id로 매칭하고 이름은 폴백으로만 쓴다. (2026-06-18 지배주주 기준 전환)

연간/1분기는 thstrm_amount(당기금액)가 곧 누적이지만, 반기·3분기 보고서는
thstrm_amount(3개월 또는 당기)와 thstrm_add_amount(당기 누적)가 다르다.
TTM 계산은 '누적'이 필요하므로 분기 수집은 extract_financials(df, cumulative=True)로 부른다.
(2026-06-22 분기 점검에서 확정: 누적은 반드시 thstrm_add_amount.)
"""


def parse_amount(value):
    """문자열 금액 → 정수 변환"""
    if value is None or value == '' or value == '-':
        return None
    try:
        return int(str(value).replace(',', ''))
    except (ValueError, TypeError):
        return None


def to_million(value):
    """원 단위 → 백만원 단위 변환"""
    if value is None or value == 0:
        return None
    return int(value / 1_000_000)


def extract_financials(df, cumulative=False):
    """
    finstate_all 결과(단일 fs_div로 필터링됨) → 주요 계정 dict (원 단위).
    손익 항목은 sj_div IS/CIS에서, 재무상태표 항목은 BS에서만 찾는다
    (자본변동표 SCE 등에 같은 계정이 중복 등장하므로 구간 제한 필수).

    cumulative=False (연간/1분기): thstrm_amount(당기금액)를 읽는다. (기존 동작 — 무변경)
    cumulative=True  (반기/3분기): thstrm_add_amount(당기 누적)를 우선 읽고,
        비어 있으면 thstrm_amount로 폴백한다.
        - 손익(IS/CIS)은 누적이 의미 있어 add_amount가 채워져 있다.
        - 재무상태표(BS)는 시점 잔액이라 add_amount가 보통 비어 → thstrm_amount로 자연 폴백
          (잔액은 누적 개념이 없으므로 이게 정확함).
    """
    is_rows = df[df['sj_div'].isin(['IS', 'CIS'])]
    bs_rows = df[df['sj_div'] == 'BS']

    def _amount(row):
        # cumulative이면 누적 컬럼 우선, 없으면 당기금액으로 폴백
        if cumulative:
            v = parse_amount(row.get('thstrm_add_amount'))
            if v is not None:
                return v
        return parse_amount(row.get('thstrm_amount'))

    def by_id(rows, account_id):
        m = rows[rows['account_id'] == account_id]
        if not m.empty:
            return _amount(m.iloc[0])
        return None

    def by_name(rows, keyword):
        # 계정명에 괄호 등 정규식 특수문자가 있어 regex=False(리터럴 부분일치) 사용
        m = rows[rows['account_nm'].str.contains(keyword, na=False, regex=False)]
        if not m.empty:
            return _amount(m.iloc[0])
        return None

    def _first(*vals):
        # None이 아닌 첫 값 채택. '0 or 다음'으로 넘어가던 falsy 폴백 버그 방지
        # (예: SPAC은 ifrs-full_Revenue '영업수익'=0 → '0 or by_name("수익")'이
        #  '금융수익' 같은 엉뚱한 행을 매출로 오추출. 0도 유효값(매출 0)으로 채택).
        for v in vals:
            if v is not None:
                return v
        return None

    revenue = _first(by_id(is_rows, 'ifrs-full_Revenue'),
                     by_name(is_rows, '매출액'), by_name(is_rows, '수익'))
    operating_income = _first(by_id(is_rows, 'dart_OperatingIncomeLoss'),
                              by_id(is_rows, 'ifrs-full_ProfitLossFromOperatingActivities'),
                              by_name(is_rows, '영업이익'))
    net_income = _first(by_id(is_rows, 'ifrs-full_ProfitLoss'),
                        by_name(is_rows, '당기순이익'), by_name(is_rows, '당기순손익'))
    net_income_owners = by_id(is_rows, 'ifrs-full_ProfitLossAttributableToOwnersOfParent')

    total_assets = _first(by_id(bs_rows, 'ifrs-full_Assets'), by_name(bs_rows, '자산총계'))
    total_liabilities = _first(by_id(bs_rows, 'ifrs-full_Liabilities'), by_name(bs_rows, '부채총계'))
    total_equity = _first(by_id(bs_rows, 'ifrs-full_Equity'), by_name(bs_rows, '자본총계'))
    equity_owners = by_id(bs_rows, 'ifrs-full_EquityAttributableToOwnersOfParent')

    # 개별재무제표(OFS) 등 지배/비지배 분리가 없으면 전체값으로 대체
    # (연결 미제출 단일법인: 전체 순이익 = 지배주주 순이익 — 분기 점검에서 확정한 구제 원리)
    if net_income_owners is None:
        net_income_owners = net_income
    if equity_owners is None:
        equity_owners = total_equity

    return {
        'revenue': revenue,
        'operating_income': operating_income,
        'net_income': net_income,
        'net_income_owners': net_income_owners,
        'total_assets': total_assets,
        'total_liabilities': total_liabilities,
        'total_equity': total_equity,
        'equity_owners': equity_owners,
    }
