"""
시야 (Siya) — TTM(최근 4분기) 이익 계산 (TTM 로드맵 ③단계)

게이트 통과 종목의 TTM 지배주주순이익/전체순이익을 계산해 ttm_earnings에 적재한다.
  · TTM = 직전 FY + 올해 동기 누적 − 작년 동기 누적
          기준 분기는 detect_ttm_period()가 수집된 분기행에서 자동 감지한다
          (2026-06 현재 FY2025 + 2026Q1누적 − 2025Q1누적. 8월 반기 수집 시 자동으로
           FY2025 + 2026Q2누적 − 2025Q2누적으로 전환 — 코드 수정 불필요).
  · 누적은 분기행(source='dart_q', thstrm_add_amount 기반, 백만원 단위)
  · 지배주주 기준(net_income_owners) — 2026-06-19 전환. 전체(net_income)도 병행 저장.

게이트 (2026-06-22/24 확정):
  settle_month = '12'  AND  TTM 3값(FY / 올해동기 / 작년동기)의 지배주주순이익이 전부 NOT NULL
  → basis='ttm'.  그 외(비12월/NULL결산/3값 미비) → basis='annual' (폴백).

설계:
  · 전종목 행 생성 — basis로 'ttm'/'annual' 구분 (행 없음=폴백 아님, 디버깅 지옥 회피).
  · 폴백 행의 ttm_* 컬럼엔 직전 FY값을 넣어 ④ valuation 복사를 단순화(basis가 해석 주체).
    FY도 없으면 NULL.
  · NULL=게이트 탈락(폴백), 0=유효값(계산 수행), 음수 TTM=그대로 저장(적자 신호).
  · components(jsonb)에 계산 근거/폴백 사유 기록 — 추적·검증용.

단위: 백만원 (financials 저장 단위 그대로).

실행:
    conda activate siya
    set PYTHONIOENCODING=utf-8
    python src/data/collectors/compute_ttm.py
"""

import os
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

from collections import Counter

from utils import get_supabase, batch_upsert

supabase = get_supabase()

# 분기 라벨 시간순 (작년 동기 매칭 + 최신 분기 선택용)
_Q_ORDER = ('Q1', 'Q2', 'Q3')

# 충분히 제출된 분기로 인정할 비율 — 일찍 제출한 소수 종목의 분기를 '최신'으로
# 오인하지 않도록, 올해 분기 중 최다 제출 분기의 이 비율 이상인 분기만 후보.
_QUARTER_SUBMIT_RATIO = 0.7


def fetch_all(query_builder):
    rows, off = [], 0
    while True:
        r = query_builder(off).execute()
        rows += r.data
        if len(r.data) < 1000:
            break
        off += 1000
    return rows


def load_stocks_meta():
    """{code: (settle_month, stock_name)}."""
    rows = fetch_all(lambda o: supabase.table('stocks')
                     .select('stock_code, settle_month, stock_name').range(o, o + 999))
    return {r['stock_code']: (r['settle_month'], r['stock_name'] or '') for r in rows}


def load_financial_point(fiscal_year, fiscal_quarter, source=None):
    """(fiscal_year, fiscal_quarter) 행 → {code: {net_income, net_income_owners}}."""
    def qb(o):
        q = supabase.table('financials')\
            .select('stock_code, net_income, net_income_owners')\
            .eq('fiscal_year', fiscal_year).eq('fiscal_quarter', fiscal_quarter)
        if source:
            q = q.eq('source', source)
        return q.range(o, o + 999)
    rows = fetch_all(qb)
    return {r['stock_code']: r for r in rows}


def detect_ttm_period():
    """수집된 분기행(source='dart_q')에서 최신 TTM 기준 분기를 자동 감지한다.

    하드코딩 대신 데이터 기반으로 굴러가게 함 — 8월에 2026 반기(Q2)를 수집하면
    별도 수정 없이 TTM이 FY2025 + 2026Q2누적 − 2025Q2누적으로 자동 전환된다.

    반환: (base_fy, q_curr=(year,Q), q_prior=(year,Q), as_of)
      · q_curr = 가장 최신 연도에서 '충분히 제출된'(최다 분기의 70%+) 최신 분기.
        일찍 제출한 소수 종목의 분기를 최신으로 오인하지 않게 비율 게이트를 둠 →
        해당 분기가 아직 덜 수집됐으면 자동으로 직전 분기를 유지(안전한 보수).
      · q_prior = 1년 전 같은 분기, base_fy = 그 연도의 직전 사업연도.
    """
    rows = fetch_all(lambda o: supabase.table('financials')
                     .select('fiscal_year, fiscal_quarter')
                     .eq('source', 'dart_q').range(o, o + 999))
    cnt = Counter((r['fiscal_year'], r['fiscal_quarter']) for r in rows)
    if not cnt:
        raise RuntimeError("분기행(source='dart_q')이 없습니다 — collect_quarterly.py 먼저 실행 필요")

    max_year = max(y for (y, _) in cnt)
    year_counts = {q: cnt.get((max_year, q), 0) for q in _Q_ORDER}
    peak = max(year_counts.values())
    q_label = None
    for q in reversed(_Q_ORDER):  # Q3→Q2→Q1, 충분히 제출된 최신 분기
        if year_counts[q] > 0 and year_counts[q] >= peak * _QUARTER_SUBMIT_RATIO:
            q_label = q
            break
    if q_label is None:  # 최신 연도에 분기 자체가 없으면 직전 연도로
        max_year = max(y for (y, q) in cnt if q in _Q_ORDER)
        year_counts = {q: cnt.get((max_year, q), 0) for q in _Q_ORDER}
        peak = max(year_counts.values())
        for q in reversed(_Q_ORDER):
            if year_counts[q] > 0 and year_counts[q] >= peak * _QUARTER_SUBMIT_RATIO:
                q_label = q
                break

    return (max_year - 1, (max_year, q_label), (max_year - 1, q_label), f"{max_year}{q_label}")


def compute():
    base_fy, q_curr_p, q_prior_p, as_of_ttm = detect_ttm_period()
    print("=" * 60)
    print("TTM 이익 계산 시작")
    print(f"  자동 감지 최신 분기: {as_of_ttm}")
    print(f"  공식: FY{base_fy} + {q_curr_p[0]}{q_curr_p[1]}누적 − {q_prior_p[0]}{q_prior_p[1]}누적")
    print("=" * 60)

    meta = load_stocks_meta()
    all_codes = list(meta.keys())
    fy = load_financial_point(base_fy, 'FY')                          # 연간(source 무관)
    q_curr = load_financial_point(q_curr_p[0], q_curr_p[1], 'dart_q')  # 올해 동기
    q_prior = load_financial_point(q_prior_p[0], q_prior_p[1], 'dart_q')  # 작년 동기
    print(f"종목 {len(all_codes)} / FY{base_fy} {len(fy)} / "
          f"{q_curr_p[0]}{q_curr_p[1]} {len(q_curr)} / {q_prior_p[0]}{q_prior_p[1]} {len(q_prior)}\n")

    now = datetime.now(timezone.utc).isoformat()
    rows = []
    n_ttm = 0
    n_annual = 0
    reason_tally = {}

    for code in all_codes:
        sm, name = meta.get(code, (None, ''))
        f = fy.get(code)
        qc = q_curr.get(code)
        qp = q_prior.get(code)

        # 게이트용 지배주주 순이익 (None = 탈락 사유)
        fy_o = f['net_income_owners'] if f else None
        qc_o = qc['net_income_owners'] if qc else None
        qp_o = qp['net_income_owners'] if qp else None

        # 폴백 사유 판정 (우선순위: SPAC → 결산월 → 분기 누락 → owners NULL)
        #   SPAC: 분기보고서 신탁계정 총액이 손익으로 오추출되는 사례(예: 하나34호스팩
        #   2025Q1 net_income 27.7조)가 있어 게이트에서 강제 제외. 6/22 점검 정책 코드화.
        reason = None
        if '스팩' in name:
            reason = 'spac'
        elif sm != '12':
            reason = 'non_dec_settle' if sm else 'unknown_settle'
        elif f is None:
            reason = 'missing_fy'
        elif qc is None or qp is None:
            reason = 'missing_quarter'
        elif fy_o is None or qc_o is None or qp_o is None:
            reason = 'null_owners'

        if reason is None:
            # ── 게이트 통과: TTM 계산 ──
            ttm_owners = fy_o + qc_o - qp_o
            # 전체 순이익도 동일 공식 (구성요소 None이면 None)
            fy_t = f['net_income']
            qc_t = qc['net_income']
            qp_t = qp['net_income']
            ttm_total = (fy_t + qc_t - qp_t) if None not in (fy_t, qc_t, qp_t) else None
            rows.append({
                'stock_code': code,
                'ttm_net_income': ttm_total,
                'ttm_net_income_owners': ttm_owners,
                'basis': 'ttm',
                'as_of': as_of_ttm,
                'components': {
                    'fy': base_fy, 'q_curr': f"{q_curr_p[0]}{q_curr_p[1]}",
                    'q_prior': f"{q_prior_p[0]}{q_prior_p[1]}",
                    'fy_owners': fy_o, 'q_curr_owners': qc_o, 'q_prior_owners': qp_o,
                    'fy_total': fy_t, 'q_curr_total': qc_t, 'q_prior_total': qp_t,
                },
                'updated_at': now,
            })
            n_ttm += 1
        else:
            # ── 폴백: 직전 FY값 사용 (없으면 NULL) ──
            rows.append({
                'stock_code': code,
                'ttm_net_income': f['net_income'] if f else None,
                'ttm_net_income_owners': fy_o,
                'basis': 'annual',
                'as_of': f"FY{base_fy}" if f else None,
                'components': {'reason': reason, 'settle_month': sm,
                               'has_fy': f is not None},
                'updated_at': now,
            })
            n_annual += 1
            reason_tally[reason] = reason_tally.get(reason, 0) + 1

    ok, err = batch_upsert(supabase, 'ttm_earnings', rows, 'stock_code', batch_size=200)

    print(f"{'=' * 60}")
    print(f"TTM 계산 완료 — upsert 성공 {ok} / 오류 {err}")
    print(f"  basis='ttm'   : {n_ttm}종목")
    print(f"  basis='annual': {n_annual}종목 (폴백)")
    print(f"  폴백 사유: " + ', '.join(f"{k}={v}" for k, v in sorted(reason_tally.items())))
    print(f"{'=' * 60}")


if __name__ == '__main__':
    compute()
