"""
시야 (Siya) — 분기 재무제표 수집 (financials, 분기 누적)
TTM(최근 4분기) 계산용 분기 누적 재무를 Supabase financials 테이블에 저장한다.
  - fiscal_quarter ∈ {'Q1','Q2','Q3'}, 금액은 '누적(thstrm_add_amount)' 기준
    (Q1=3개월, Q2=6개월 누적, Q3=9개월 누적)
  - 연간(FY) 수집은 collect_financials.py가 담당. 이 파일은 분기 전용.
  - 계정 추출 로직은 financials_common.extract_financials를 공유(연간과 동일,
    cumulative=True로 호출해 누적 컬럼을 읽는 점만 다름).

실행:
  python src/data/collectors/collect_quarterly.py            # 처음부터
  python src/data/collectors/collect_quarterly.py --resume   # 분기 행 있는 종목 건너뛰고 이어서

참고: DART API 일 10,000건 제한(공시 수집과 한도 풀 공유). 미제출 분기는 제출기한
      컷오프(REPRT_FILING_CUTOFF)로 조회 자체를 건너뛴다 → 헛콜 제거.
      조회 대상은 날짜에 따라 3~6개 (연도,분기) 조합으로 가변:
        · ~5/15  : 3조합(작년 Q1~Q3)      · 5/15~8/15 : 4조합(+올해 Q1)
        · 8/15~11/15: 5조합(+올해 Q2)      · 11/15~   : 6조합(+올해 Q3)
      예) 6월 기준 4조합 → 전종목(약 2,773) ~15,000콜(현실, CFS 1콜/OFS 재시도 2콜 혼합;
          최선 ~11,000 / 최악 ~22,000). 한도 가드(DART_DAILY_LIMIT=8,500) 근접 시
          자동 중단 → 다음날 --resume 으로 이어서(현재 시즌 ~2일, 최악 3일).

※ 실행 환경: Anaconda Prompt에서 `conda activate siya`, PYTHONIOENCODING=utf-8 권장.
"""

import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import OpenDartReader
from utils import get_supabase, get_all_stocks
from financials_common import extract_financials, to_million

supabase = get_supabase()
DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)

# 최근 2개 연도 (올해 최신 분기 + 작년 동기). TTM 공식에 필요한 최소 범위.
#   TTM = 직전 FY − 작년 동기 누적 + 올해 동기 누적
_NOW = datetime.today()
QUARTER_YEARS = [_NOW.year, _NOW.year - 1]

# DART 분기 보고서 코드 → fiscal_quarter 라벨
REPRT_MAP = {
    '11013': 'Q1',  # 1분기보고서 (3개월)
    '11012': 'Q2',  # 반기보고서   (6개월 누적)
    '11014': 'Q3',  # 3분기보고서 (9개월 누적)
}

# 분기 보고서 제출기한 컷오프 (월, 일).
#   '분기 종료'가 아니라 '제출 시작'을 기준으로 한다. 종료~제출 사이 시차가 있어
#   종료월만 보면 아직 제출 안 된 분기를 조회해 헛콜이 난다. 빠른 종목도 놓치지
#   않도록 보수적 마진(법정 제출기한보다 앞)을 둔다. 이 (월,일) 이후라야 조회.
REPRT_FILING_CUTOFF = {
    '11013': (5, 15),   # Q1  (분기 종료 3/31 → 제출 ~5/15)
    '11012': (8, 15),   # Q2 반기 (종료 6/30 → 제출 ~8/15)
    '11014': (11, 15),  # Q3  (종료 9/30 → 제출 ~11/15)
}

# 공시 수집(collect_disclosures, 하루 ~40~100콜)과 DART 한도 풀을 공유하므로
# 9,000 → 8,500으로 낮춰 마진 확보.
DART_DAILY_LIMIT = 8500  # 안전 마진 (실제 한도 10,000, 공시 수집분 여유 포함)


def eligible_combos(today=None):
    """오늘 기준 '제출기한이 지나 조회 가치가 있는' (year, reprt_code, q_label) 목록.

    미래/미제출 분기는 여기서 빠지므로 fetch_quarter 호출 자체가 안 나가 콜을 절약한다.
    예) today=2026-06-23 → 2026 Q1 O / 2026 Q2·Q3 X / 2025 Q1·Q2·Q3 O = 4조합.
    """
    today = today or datetime.today()
    combos = []
    for year in QUARTER_YEARS:
        for reprt_code, q_label in REPRT_MAP.items():
            month, day = REPRT_FILING_CUTOFF[reprt_code]
            if today >= datetime(year, month, day):
                combos.append((year, reprt_code, q_label))
    return combos


def get_codes_with_quarterly(supabase):
    """분기 행(fiscal_quarter in Q1/Q2/Q3)이 이미 있는 종목 코드 집합 (이틀 분할 재개용).

    종목별로 모든 분기를 모은 뒤 끝에서 일괄 upsert하므로(부분 저장 없음),
    '분기 행이 하나라도 있으면 그 종목은 수집 완료'로 안전하게 간주할 수 있다.
    """
    codes = set()
    offset = 0
    while True:
        res = supabase.table('financials').select('stock_code')\
            .in_('fiscal_quarter', ['Q1', 'Q2', 'Q3'])\
            .range(offset, offset + 999).execute()
        for r in res.data:
            codes.add(r['stock_code'])
        if len(res.data) < 1000:
            break
        offset += 1000
    return codes


def fetch_quarter(code, year, reprt_code):
    """단일 (종목, 연도, 분기) finstate_all 조회. CFS 우선, 없으면 OFS.
    반환: (df 또는 None, 소비한 API 콜 수)."""
    api_calls = 0
    for fs_div in ('CFS', 'OFS'):
        old_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        try:
            df = dart.finstate_all(code, year, reprt_code=reprt_code, fs_div=fs_div)
        finally:
            sys.stdout.close()
            sys.stdout = old_stdout
        api_calls += 1

        if df is None or isinstance(df, dict) or (hasattr(df, 'empty') and df.empty):
            continue
        return df, api_calls
    return None, api_calls


def collect_quarterly(resume=False):
    print("=" * 60)
    print("분기 재무제표 수집 시작 (TTM용, 누적 기준)")
    print(f"대상 연도: {QUARTER_YEARS} / 분기: {list(REPRT_MAP.values())}")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)

    if resume:
        done = get_codes_with_quarterly(supabase)
        remaining = [s for s in stocks_list if s['stock_code'] not in done]
        print(f"전체: {len(stocks_list)}개 / 분기 수집 완료: {len(done)}개 / 남음: {len(remaining)}개\n")
    else:
        remaining = stocks_list
        print(f"전체: {len(stocks_list)}개 (처음부터)\n")

    if not remaining:
        print("✅ 모든 종목 분기 수집 완료!")
        return

    # 제출기한이 지난 분기만 조회 대상으로 (미래/미제출 분기 헛콜 제거)
    combos = eligible_combos()
    combo_labels = ', '.join(f"{y} {q}" for y, _, q in combos)
    print(f"조회 대상 분기({len(combos)}조합): {combo_labels}")
    est_min = len(remaining) * len(combos)            # 전부 CFS 1콜
    est_max = len(remaining) * len(combos) * 2        # 전부 OFS 재시도 2콜
    est_real = int(len(remaining) * len(combos) * 1.35)  # CFS~65%/OFS~35% 혼합
    print(f"예상 DART 콜: ~{est_min:,}(최선) / ~{est_real:,}(현실) / ~{est_max:,}(최악) "
          f"— 한도 가드 {DART_DAILY_LIMIT}에서 분할\n")

    success_count = 0
    skip_count = 0
    error_count = 0
    api_calls = 0
    total = len(remaining)

    for i, s in enumerate(remaining):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 50 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 수집 중... (API {api_calls}건)")

        # 종목별로 모았다가 끝에서 일괄 upsert (중간 중단 시 부분 저장 방지)
        stock_rows = []

        # 제출기한이 지난 (연도,분기)만 — 미래/미제출 분기는 combos에서 이미 제외됨
        for year, reprt_code, q_label in combos:
            try:
                df, calls = fetch_quarter(code, year, reprt_code)
                api_calls += calls
                if df is None:
                    continue

                # 분기는 누적값(thstrm_add_amount) 기준 — 2026-06-22 점검에서 확정
                acc = extract_financials(df, cumulative=True)

                # 핵심 항목이 하나도 없으면 건너뛰기
                if not any([acc['revenue'], acc['operating_income'],
                            acc['net_income'], acc['total_assets']]):
                    continue

                # 분기 행은 '원자료'로만 저장한다.
                #   roe/roa/debt_ratio/operating_margin은 의도적으로 NULL(미저장):
                #   분기 누적 기준 비율(예: 반기 ROE)은 연간 비율과 직접 비교 불가라
                #   혼선을 부른다. 비율은 TTM 계산 단계에서 별도 산출한다.
                stock_rows.append({
                    'stock_code': code,
                    'fiscal_year': year,
                    'fiscal_quarter': q_label,
                    'revenue': to_million(acc['revenue']),
                    'operating_income': to_million(acc['operating_income']),
                    'net_income': to_million(acc['net_income']),
                    'net_income_owners': to_million(acc['net_income_owners']),
                    'total_assets': to_million(acc['total_assets']),
                    'total_liabilities': to_million(acc['total_liabilities']),
                    'total_equity': to_million(acc['total_equity']),
                    'equity_owners': to_million(acc['equity_owners']),
                    'cost_of_sales': to_million(acc['cost_of_sales']),
                    'gross_profit': to_million(acc['gross_profit']),
                    'cash_and_equiv': to_million(acc['cash_and_equiv']),
                    'current_assets': to_million(acc['current_assets']),
                    'current_liabilities': to_million(acc['current_liabilities']),
                    'cfo': to_million(acc['cfo']),
                    'source': 'dart_q',
                })

            except Exception:
                pass  # 분기 미제출(SPAC/신규상장) 등은 조용히 건너뜀

        # 종목 단위 일괄 upsert
        if stock_rows:
            try:
                supabase.table('financials').upsert(
                    stock_rows,
                    on_conflict='stock_code,fiscal_year,fiscal_quarter'
                ).execute()
                success_count += 1
            except Exception as e:
                error_count += 1
                if error_count <= 5:
                    print(f"  ❌ {name}({code}) upsert: {e}")
        else:
            skip_count += 1

        # API 부하 방지
        if (i + 1) % 100 == 0:
            print(f"  ⏳ {i+1}/{total} (성공:{success_count} 건너뜀:{skip_count} API:{api_calls}건)")
            time.sleep(2)

        # DART API 일일 한도 체크 → 근접 시 중단(다음날 --resume)
        if api_calls >= DART_DAILY_LIMIT:
            print(f"\n⚠️ DART API 일일 한도 근접 ({api_calls}건). 중단합니다.")
            print(f"   내일 --resume 로 이어서 수집하세요.")
            break

    print(f"\n{'=' * 60}")
    print(f"분기 재무제표 수집 종료")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개 (분기 미제출/데이터없음)")
    print(f"  ❌ 오류: {error_count}개")
    print(f"  📡 API 호출: {api_calls}건")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='분기 재무제표 수집 (TTM용)')
    parser.add_argument('--resume', action='store_true',
                        help='분기 행이 이미 있는 종목은 건너뛰고 이어서 수집 (이틀 분할 재개)')
    args = parser.parse_args()
    collect_quarterly(resume=args.resume)
