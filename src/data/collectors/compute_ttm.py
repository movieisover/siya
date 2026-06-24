"""
시야 (Siya) — TTM(최근 4분기) 이익 계산 (TTM 로드맵 ③단계)

게이트 통과 종목의 TTM 지배주주순이익/전체순이익을 계산해 ttm_earnings에 적재한다.
  · TTM = 직전 FY + 올해 동기 누적 − 작년 동기 누적
          (현재 기준 = FY2025 + 2026Q1누적 − 2025Q1누적)
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

from utils import get_supabase, batch_upsert

supabase = get_supabase()

# 기준 분기 구성 (2026-06-24 기준). 분기 갱신 시 여기만 조정.
BASE_FY = 2025          # 직전 사업연도
Q_CURR = (2026, 'Q1')   # 올해 동기 누적
Q_PRIOR = (2025, 'Q1')  # 작년 동기 누적
AS_OF_TTM = '2026Q1'    # 최신 분기 라벨


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


def compute():
    print("=" * 60)
    print("TTM 이익 계산 시작")
    print(f"  공식: FY{BASE_FY} + {Q_CURR[0]}{Q_CURR[1]}누적 − {Q_PRIOR[0]}{Q_PRIOR[1]}누적")
    print("=" * 60)

    meta = load_stocks_meta()
    all_codes = list(meta.keys())
    fy = load_financial_point(BASE_FY, 'FY')                       # 연간(source 무관)
    q_curr = load_financial_point(Q_CURR[0], Q_CURR[1], 'dart_q')  # 올해 동기
    q_prior = load_financial_point(Q_PRIOR[0], Q_PRIOR[1], 'dart_q')  # 작년 동기
    print(f"종목 {len(all_codes)} / FY{BASE_FY} {len(fy)} / "
          f"{Q_CURR[0]}{Q_CURR[1]} {len(q_curr)} / {Q_PRIOR[0]}{Q_PRIOR[1]} {len(q_prior)}\n")

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
                'as_of': AS_OF_TTM,
                'components': {
                    'fy': BASE_FY, 'q_curr': f"{Q_CURR[0]}{Q_CURR[1]}",
                    'q_prior': f"{Q_PRIOR[0]}{Q_PRIOR[1]}",
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
                'as_of': f"FY{BASE_FY}" if f else None,
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
