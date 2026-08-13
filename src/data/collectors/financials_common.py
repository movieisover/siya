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
    cf_rows = df[df['sj_div'] == 'CF']  # 현금흐름표 — CFO(영업활동현금흐름) 추출용 (B-1 확장)

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

    # ── 확장 계정 (B-1: 총이익성·유동비율·발생액·Piotroski F-score 원자료) ──
    # 시야는 원자료만 채운다. 팩터(GP/자산, 유동비율, CFO>ROA 등) 산출은 소비자(시야트레이더) 몫.
    # cumulative=True(분기)면 by_id/by_name 내부 _amount가 thstrm_add_amount(누적)를 우선하므로
    # CF/IS 항목은 자동으로 누적 기준이 된다. BS는 시점 잔액이라 thstrm_amount로 자연 폴백.

    # 손익(IS): 매출원가·매출총이익. 금융/일부 서비스업(NAVER·카카오 등)은 매출원가 개념이
    #           없어 부재(NULL이 정상 — 그 업종은 총이익성 팩터 부적합).
    cost_of_sales = _first(by_id(is_rows, 'ifrs-full_CostOfSales'),
                           by_name(is_rows, '매출원가'))
    gross_profit = _first(by_id(is_rows, 'ifrs-full_GrossProfit'),
                          by_name(is_rows, '매출총이익'))
    # 매출총이익 폴백: GrossProfit 계정이 없으면 매출액 − 매출원가로 산출(둘 다 있을 때만).
    # (실측상 GrossProfit 보유 종목은 전부 직접 계정 → 이 폴백은 소수 안전장치.)
    if gross_profit is None and revenue is not None and cost_of_sales is not None:
        gross_profit = revenue - cost_of_sales

    # 재무상태표(BS): 현금성자산·유동자산·유동부채. 금융업은 유동/비유동 미구분이라 부재 가능(정상).
    cash_and_equiv = _first(by_id(bs_rows, 'ifrs-full_CashAndCashEquivalents'),
                            by_name(bs_rows, '현금및현금성자산'))
    current_assets = _first(by_id(bs_rows, 'ifrs-full_CurrentAssets'),
                            by_name(bs_rows, '유동자산'))
    current_liabilities = _first(by_id(bs_rows, 'ifrs-full_CurrentLiabilities'),
                                 by_name(bs_rows, '유동부채'))

    # 현금흐름표(CF): 영업활동현금흐름(CFO). account_id가 표준이라 실측상 전 종목(금융 포함)
    #                100% 매칭. 이름 폴백은 정확한 명칭 우선 → 최후에 '영업활동' 부분일치
    #                (CF 구간 내 검색이라 대분류가 하위항목보다 먼저 나와 오추출 위험 낮음).
    cfo = _first(by_id(cf_rows, 'ifrs-full_CashFlowsFromUsedInOperatingActivities'),
                 by_name(cf_rows, '영업활동현금흐름'),
                 by_name(cf_rows, '영업활동으로인한현금흐름'),
                 by_name(cf_rows, '영업활동'))

    return {
        'revenue': revenue,
        'operating_income': operating_income,
        'net_income': net_income,
        'net_income_owners': net_income_owners,
        'total_assets': total_assets,
        'total_liabilities': total_liabilities,
        'total_equity': total_equity,
        'equity_owners': equity_owners,
        # 확장 계정 (B-1)
        'cost_of_sales': cost_of_sales,
        'gross_profit': gross_profit,
        'cash_and_equiv': cash_and_equiv,
        'current_assets': current_assets,
        'current_liabilities': current_liabilities,
        'cfo': cfo,
    }
