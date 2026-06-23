"""
시야 (Siya) — 분기 수집기 검증 (일회성, 샘플 5종목)
collect_quarterly.py 본 실행(전종목, 이틀) 전에 동작을 확인하는 스크립트.
DB 기록 없이(read-only) 콘솔에만 출력한다.

확인 항목:
  (a) 분기 finstate_all 조회 + 누적값(thstrm_add_amount) 추출이 되는가
  (b) 누적값이 상식적인가 (삼성전자 2025 반기 매출이 ~150조대로 찍히면 OK)
  (c) OFS-only 종목(한양증권)이 net_income_owners에 전체값으로 폴백되는가
  (d) SPAC/분기 미제출 종목이 조용히 건너뛰어지는가

실행:
  conda activate siya
  set PYTHONIOENCODING=utf-8   (Windows)
  python src/data/collectors/verify_quarterly.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import OpenDartReader
from financials_common import extract_financials, to_million

DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)

_NOW = datetime.today()
QUARTER_YEARS = [_NOW.year, _NOW.year - 1]
REPRT_MAP = {'11013': 'Q1', '11012': 'Q2', '11014': 'Q3'}

# 검증 샘플: 점검에서 분류된 대표 케이스들
SAMPLES = [
    ('005930', '삼성전자',   '대형/정상 CFS'),
    ('001750', '한양증권',   'OFS-only 구제 대상'),
    ('068270', '셀트리온',   '대형/정상 (교차확인)'),
    ('000990', 'DB하이텍',   '중형 (교차확인)'),
    ('438700', '스팩(예시)', 'SPAC/분기 미제출 예상'),  # 종목코드는 실제 스팩으로 교체 가능
]


def fetch_quarter(code, year, reprt_code):
    for fs_div in ('CFS', 'OFS'):
        old_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        try:
            df = dart.finstate_all(code, year, reprt_code=reprt_code, fs_div=fs_div)
        finally:
            sys.stdout.close()
            sys.stdout = old_stdout
        if df is None or isinstance(df, dict) or (hasattr(df, 'empty') and df.empty):
            continue
        return df, fs_div
    return None, None


def fmt(v):
    """백만원 → 조/억 읽기 쉬운 문자열."""
    if v is None:
        return '   —   '
    jo = v / 1_000_000  # 백만원 → 조원
    if abs(jo) >= 1:
        return f"{jo:>8.2f}조"
    eok = v / 100  # 백만원 → 억원
    return f"{eok:>8.0f}억"


def verify():
    print("=" * 78)
    print(f"분기 수집기 검증 (샘플 {len(SAMPLES)}종목) — 대상 연도: {QUARTER_YEARS}")
    print("※ DB 기록 없음(read-only). 누적값/폴백/건너뜀만 확인.")
    print("=" * 78)

    for code, name, note in SAMPLES:
        print(f"\n■ {name}({code}) — {note}")
        print(f"  {'연도/분기':<10}{'fs_div':<8}{'매출(누적)':>12}"
              f"{'순이익(누적)':>14}{'지배주주(누적)':>16}")
        print(f"  {'-'*60}")
        any_row = False
        for year in QUARTER_YEARS:
            for reprt_code, q in REPRT_MAP.items():
                df, fs_div = fetch_quarter(code, year, reprt_code)
                if df is None:
                    continue
                acc = extract_financials(df, cumulative=True)
                if not any([acc['revenue'], acc['net_income'], acc['total_assets']]):
                    continue
                any_row = True
                rev = to_million(acc['revenue'])
                ni = to_million(acc['net_income'])
                nio = to_million(acc['net_income_owners'])
                # 지배주주가 전체와 같으면 폴백된 것 → 표시
                fb = '  (=전체:폴백)' if (nio is not None and nio == ni) else ''
                print(f"  {str(year)+' '+q:<10}{fs_div:<8}"
                      f"{fmt(rev):>12}{fmt(ni):>14}{fmt(nio):>16}{fb}")
        if not any_row:
            print(f"  → 분기 데이터 없음 (SPAC/신규/미제출 — 본 수집 시 조용히 건너뜀)")

    print("\n" + "=" * 78)
    print("검증 체크리스트:")
    print("  [ ] 삼성전자 2025 Q2(반기) 매출이 ~150조대 → 누적값 정상")
    print("      (만약 ~75조대로 나오면 3개월값을 읽은 것 = thstrm_amount 오류)")
    print("  [ ] 한양증권 등 OFS 종목의 지배주주에 '(=전체:폴백)' 표기 → 구제 정상")
    print("  [ ] SPAC 종목이 '분기 데이터 없음'으로 처리 → 건너뜀 정상")
    print("=" * 78)


if __name__ == '__main__':
    verify()
