"""
한국 주식 데이터 탐색 스크립트
========================================
Phase 1: 데이터 현실 파악

실행: python scripts/exploration/01_data_exploration.py

작성: 시야 (2025-02-04)
========================================
"""

import sys
from datetime import datetime, timedelta

print("=" * 70)
print("한국 주식 데이터 탐색 리포트")
print(f"실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# ============================================================================
# 라이브러리 체크
# ============================================================================
print("\n[라이브러리 로드]")

try:
    import FinanceDataReader as fdr
    print("  ✓ FinanceDataReader")
except ImportError:
    print("  ✗ FinanceDataReader 필요: pip install finance-datareader")
    sys.exit(1)

try:
    from pykrx import stock as pykrx_stock
    print("  ✓ pykrx")
except ImportError:
    print("  ✗ pykrx 필요: pip install pykrx")
    pykrx_stock = None

import pandas as pd
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 200)
pd.set_option('display.max_rows', 30)

# ============================================================================
# 1. 상장 종목 리스트
# ============================================================================
print("\n" + "=" * 70)
print("섹션 1: 상장 종목 리스트")
print("=" * 70)

print("\n[1-1] KOSPI 종목")
try:
    kospi = fdr.StockListing('KOSPI')
    print(f"  총 종목 수: {len(kospi)}")
    print(f"  컬럼: {kospi.columns.tolist()}")
    print(f"\n  데이터 타입:")
    for col, dtype in kospi.dtypes.items():
        print(f"    {col}: {dtype}")
    print(f"\n  샘플 (상위 5개):")
    print(kospi.head().to_string(index=False))
except Exception as e:
    print(f"  ✗ 오류: {e}")
    kospi = None

print("\n[1-2] KOSDAQ 종목")
try:
    kosdaq = fdr.StockListing('KOSDAQ')
    print(f"  총 종목 수: {len(kosdaq)}")
    print(f"\n  샘플 (상위 5개):")
    print(kosdaq.head().to_string(index=False))
except Exception as e:
    print(f"  ✗ 오류: {e}")
    kosdaq = None

if kospi is not None and kosdaq is not None:
    print(f"\n[1-3] 전체 상장 종목: {len(kospi) + len(kosdaq)}개")

# 시가총액 상위
print("\n[1-4] 시가총액 상위 10개")
if kospi is not None:
    marcap_col = next((c for c in ['Marcap', 'MarCap', 'marcap'] if c in kospi.columns), None)
    if marcap_col:
        top10 = kospi.nlargest(10, marcap_col).copy()
        top10['시가총액(조)'] = (top10[marcap_col] / 1e12).round(2)
        cols = ['Code', 'Name', '시가총액(조)']
        if 'Sector' in top10.columns:
            cols.append('Sector')
        print(top10[cols].to_string(index=False))
    else:
        print(f"  시가총액 컬럼 없음. 컬럼: {kospi.columns.tolist()}")

# ============================================================================
# 2. 주가 데이터 (일봉)
# ============================================================================
print("\n" + "=" * 70)
print("섹션 2: 주가 데이터")
print("=" * 70)

end_date = datetime.now()
start_date = end_date - timedelta(days=365)

test_stocks = [
    ('005930', '삼성전자'),
    ('000660', 'SK하이닉스'),
    ('035420', 'NAVER'),
]

print(f"\n기간: {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')}")

for i, (code, name) in enumerate(test_stocks, 1):
    print(f"\n[2-{i}] {name} ({code})")
    try:
        df = fdr.DataReader(code, start_date, end_date)
        print(f"  데이터: {len(df)}일")
        print(f"  컬럼: {df.columns.tolist()}")
        print(f"  결측치: {df.isnull().sum().to_dict()}")
        print(f"\n  최근 5일:")
        print(df.tail(5).to_string())
    except Exception as e:
        print(f"  ✗ 오류: {e}")

# ============================================================================
# 3. pykrx - 밸류에이션 데이터
# ============================================================================
print("\n" + "=" * 70)
print("섹션 3: 밸류에이션 데이터 (pykrx)")
print("=" * 70)

if pykrx_stock:
    # 최근 영업일 찾기
    print("\n[3-1] KOSPI 종목별 OHLCV")
    for i in range(7):
        check_date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
        try:
            df_ohlcv = pykrx_stock.get_market_ohlcv_by_ticker(check_date, market="KOSPI")
            if len(df_ohlcv) > 0:
                print(f"  기준일: {check_date}")
                print(f"  종목 수: {len(df_ohlcv)}")
                print(f"  컬럼: {df_ohlcv.columns.tolist()}")
                print(f"\n  샘플 (상위 5개):")
                print(df_ohlcv.head().to_string())
                break
        except:
            continue

    print("\n[3-2] PER, PBR, 배당수익률")
    for i in range(7):
        check_date = (datetime.now() - timedelta(days=i)).strftime('%Y%m%d')
        try:
            df_fund = pykrx_stock.get_market_fundamental_by_ticker(check_date, market="KOSPI")
            if len(df_fund) > 0:
                print(f"  기준일: {check_date}")
                print(f"  컬럼: {df_fund.columns.tolist()}")
                print(f"\n  샘플 (상위 10개):")
                print(df_fund.head(10).to_string())
                
                # 통계
                print(f"\n  PER 통계:")
                print(f"    - 평균: {df_fund['PER'].mean():.2f}")
                print(f"    - 중앙값: {df_fund['PER'].median():.2f}")
                print(f"    - 최소: {df_fund['PER'].min():.2f}")
                print(f"    - 최대: {df_fund['PER'].max():.2f}")
                break
        except:
            continue
else:
    print("\npykrx 미설치로 건너뜀")

# ============================================================================
# 4. 재무제표 데이터 확인
# ============================================================================
print("\n" + "=" * 70)
print("섹션 4: 재무제표 데이터")
print("=" * 70)

print("""
[현황]
  - FinanceDataReader: 재무제표 미포함
  - pykrx: 기본 밸류에이션만 (PER, PBR, 배당)
  - OpenDartReader: 상세 재무제표 가능 (API 키 필요)

[OpenDartReader 사용법]
  1. https://opendart.fss.or.kr/ 에서 API 키 발급 (무료)
  2. pip install opendartreader
  3. 코드:
     import OpenDartReader
     dart = OpenDartReader('YOUR_API_KEY')
     df = dart.finstate('005930', 2023)  # 삼성전자 2023년 재무제표
""")

# ============================================================================
# 5. 요약
# ============================================================================
print("\n" + "=" * 70)
print("섹션 5: 데이터 품질 요약")
print("=" * 70)

print("""
[데이터 소스별 제공 항목]

┌─────────────────────┬────────────┬─────────┬───────────────┐
│ 항목                │ FDR        │ pykrx   │ OpenDartReader│
├─────────────────────┼────────────┼─────────┼───────────────┤
│ 종목 리스트         │ ✓          │ ✓       │ ✓             │
│ 일봉 (OHLCV)        │ ✓          │ ✓       │ ✗             │
│ 시가총액            │ ✓          │ ✓       │ ✗             │
│ PER / PBR           │ ✗          │ ✓       │ ✗             │
│ 배당수익률          │ ✗          │ ✓       │ ✓             │
│ 재무제표 (상세)     │ ✗          │ ✗       │ ✓             │
│ 공시 정보           │ ✗          │ ✗       │ ✓             │
└─────────────────────┴────────────┴─────────┴───────────────┘

[권장 조합]
  가치투자 분석에 필요한 것:
  - 종목 리스트 + 주가: FinanceDataReader
  - PER/PBR/배당: pykrx
  - 재무제표 (ROE, 부채비율 등): OpenDartReader ← 필수!

[다음 단계]
  1. OpenDartReader API 키 발급
  2. 재무제표 데이터 탐색 스크립트 실행
  3. DB 스키마 설계
""")

print("\n" + "=" * 70)
print("탐색 완료! 이 결과를 CLAUDE.md에 기록하세요.")
print("=" * 70)
