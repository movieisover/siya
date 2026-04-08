"""
재무제표 데이터 탐색 스크립트
========================================
Phase 1: OpenDartReader로 재무제표 확인

실행: python -X utf8 scripts/exploration/02_financial_statements.py

작성: 시야 (2026-02-04)
========================================
"""

import os
import sys
from datetime import datetime

# 환경변수 로드
from dotenv import load_dotenv
load_dotenv()

print("=" * 70)
print("재무제표 데이터 탐색 리포트")
print(f"실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

# ============================================================================
# API 키 확인
# ============================================================================
DART_API_KEY = os.getenv('DART_API_KEY')
if not DART_API_KEY:
    print("\n[오류] DART_API_KEY가 .env 파일에 없습니다.")
    sys.exit(1)

print(f"\n[API 키 확인] {DART_API_KEY[:8]}...{DART_API_KEY[-4:]}")

# ============================================================================
# OpenDartReader 로드
# ============================================================================
print("\n[라이브러리 로드]")
try:
    import OpenDartReader
    dart = OpenDartReader(DART_API_KEY)
    print("  ✓ OpenDartReader 연결 성공")
except ImportError:
    print("  ✗ OpenDartReader 필요: pip install opendartreader")
    sys.exit(1)
except Exception as e:
    print(f"  ✗ 연결 오류: {e}")
    sys.exit(1)

import pandas as pd
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 200)
pd.set_option('display.max_rows', 50)

# ============================================================================
# 테스트 종목
# ============================================================================
test_stocks = [
    ('005930', '삼성전자'),
    ('000660', 'SK하이닉스'),
    ('035420', 'NAVER'),
]

# ============================================================================
# 1. 기업 개황 정보
# ============================================================================
print("\n" + "=" * 70)
print("섹션 1: 기업 개황 정보")
print("=" * 70)

for code, name in test_stocks[:1]:  # 삼성전자만
    print(f"\n[{name} ({code})]")
    try:
        company = dart.company(code)
        print(f"  타입: {type(company)}")
        if isinstance(company, dict):
            for k, v in company.items():
                print(f"  {k}: {v}")
        else:
            print(company)
    except Exception as e:
        print(f"  ✗ 오류: {e}")

# ============================================================================
# 2. 재무제표 - 단일 기업, 단일 연도
# ============================================================================
print("\n" + "=" * 70)
print("섹션 2: 재무제표 (단일 기업)")
print("=" * 70)

for code, name in test_stocks[:1]:  # 삼성전자만
    print(f"\n[{name} ({code}) - 2024년 재무제표]")
    try:
        fs = dart.finstate(code, 2024)
        if fs is not None and len(fs) > 0:
            print(f"  데이터 수: {len(fs)}행")
            print(f"  컬럼: {fs.columns.tolist()}")
            print(f"\n  샘플 데이터:")
            # 주요 항목만 필터링
            key_items = ['자산총계', '부채총계', '자본총계', '매출액', '영업이익', '당기순이익']
            for item in key_items:
                row = fs[fs['account_nm'].str.contains(item, na=False)]
                if len(row) > 0:
                    print(f"    {item}: {row.iloc[0].get('thstrm_amount', 'N/A')}")
        else:
            print("  데이터 없음 (2024년 미공시일 수 있음)")

            # 2023년 시도
            print(f"\n[{name} ({code}) - 2023년 재무제표]")
            fs = dart.finstate(code, 2023)
            if fs is not None and len(fs) > 0:
                print(f"  데이터 수: {len(fs)}행")
                print(f"  컬럼: {fs.columns.tolist()}")
    except Exception as e:
        print(f"  ✗ 오류: {e}")

# ============================================================================
# 3. 재무제표 상세 구조
# ============================================================================
print("\n" + "=" * 70)
print("섹션 3: 재무제표 상세 구조")
print("=" * 70)

code, name = '005930', '삼성전자'
try:
    fs = dart.finstate(code, 2023)
    if fs is not None and len(fs) > 0:
        print(f"\n[전체 컬럼 설명]")
        for col in fs.columns:
            print(f"  - {col}")

        print(f"\n[sj_div (재무제표 구분) 값들]")
        if 'sj_div' in fs.columns:
            print(fs['sj_div'].unique())

        print(f"\n[fs_div (개별/연결) 값들]")
        if 'fs_div' in fs.columns:
            print(fs['fs_div'].unique())

        print(f"\n[연결재무제표 - 손익계산서 항목]")
        if 'sj_div' in fs.columns and 'fs_div' in fs.columns:
            is_df = fs[(fs['sj_div'] == 'IS') & (fs['fs_div'] == 'CFS')]
            if len(is_df) > 0:
                print(is_df[['account_nm', 'thstrm_amount']].head(15).to_string(index=False))

        print(f"\n[연결재무제표 - 재무상태표 항목]")
        if 'sj_div' in fs.columns and 'fs_div' in fs.columns:
            bs_df = fs[(fs['sj_div'] == 'BS') & (fs['fs_div'] == 'CFS')]
            if len(bs_df) > 0:
                print(bs_df[['account_nm', 'thstrm_amount']].head(15).to_string(index=False))
except Exception as e:
    print(f"  ✗ 오류: {e}")

# ============================================================================
# 4. 여러 기업 비교
# ============================================================================
print("\n" + "=" * 70)
print("섹션 4: 여러 기업 재무 비교 (2023년)")
print("=" * 70)

results = []
for code, name in test_stocks:
    print(f"\n처리 중: {name}...", end=" ")
    try:
        fs = dart.finstate(code, 2023)
        if fs is not None and len(fs) > 0:
            # 연결재무제표 기준
            cfs = fs[fs['fs_div'] == 'CFS'] if 'fs_div' in fs.columns else fs

            def get_value(df, keyword):
                row = df[df['account_nm'].str.contains(keyword, na=False)]
                if len(row) > 0:
                    val = row.iloc[0].get('thstrm_amount', None)
                    if val and val != '':
                        return int(val.replace(',', '')) if isinstance(val, str) else val
                return None

            data = {
                '종목': name,
                '자산총계': get_value(cfs, '^자산총계$'),
                '부채총계': get_value(cfs, '^부채총계$'),
                '자본총계': get_value(cfs, '^자본총계$'),
                '매출액': get_value(cfs, '매출액|수익'),
                '영업이익': get_value(cfs, '영업이익'),
                '당기순이익': get_value(cfs, '당기순이익'),
            }
            results.append(data)
            print("완료")
        else:
            print("데이터 없음")
    except Exception as e:
        print(f"오류: {e}")

if results:
    df_result = pd.DataFrame(results)

    # 단위 변환 (억원)
    numeric_cols = ['자산총계', '부채총계', '자본총계', '매출액', '영업이익', '당기순이익']
    for col in numeric_cols:
        if col in df_result.columns:
            df_result[col] = df_result[col].apply(lambda x: f"{x/1e8:,.0f}" if x else "N/A")

    print(f"\n[비교 테이블] (단위: 억원)")
    print(df_result.to_string(index=False))

# ============================================================================
# 5. 재무비율 계산 가능성
# ============================================================================
print("\n" + "=" * 70)
print("섹션 5: 재무비율 계산 예시")
print("=" * 70)

code, name = '005930', '삼성전자'
try:
    fs = dart.finstate(code, 2023)
    if fs is not None and len(fs) > 0:
        cfs = fs[fs['fs_div'] == 'CFS'] if 'fs_div' in fs.columns else fs

        def get_num(df, keyword):
            row = df[df['account_nm'].str.contains(keyword, na=False)]
            if len(row) > 0:
                val = row.iloc[0].get('thstrm_amount', None)
                if val and val != '':
                    return int(val.replace(',', '')) if isinstance(val, str) else val
            return None

        total_asset = get_num(cfs, '^자산총계$')
        total_equity = get_num(cfs, '^자본총계$')
        total_debt = get_num(cfs, '^부채총계$')
        net_income = get_num(cfs, '당기순이익')

        print(f"\n[{name} 2023년 재무비율]")

        if total_equity and net_income:
            roe = (net_income / total_equity) * 100
            print(f"  ROE (자기자본이익률): {roe:.2f}%")

        if total_asset and net_income:
            roa = (net_income / total_asset) * 100
            print(f"  ROA (총자산이익률): {roa:.2f}%")

        if total_equity and total_debt:
            debt_ratio = (total_debt / total_equity) * 100
            print(f"  부채비율: {debt_ratio:.2f}%")

        if total_asset and total_equity:
            equity_ratio = (total_equity / total_asset) * 100
            print(f"  자기자본비율: {equity_ratio:.2f}%")

except Exception as e:
    print(f"  ✗ 오류: {e}")

# ============================================================================
# 6. API 제한 및 주의사항
# ============================================================================
print("\n" + "=" * 70)
print("섹션 6: API 제한 및 주의사항")
print("=" * 70)

print("""
[OpenDartReader API 제한]
  - 일일 요청 한도: 10,000건 (무료)
  - 분당 요청 한도: 약 1,000건
  - 재무제표: 연간/반기/분기 공시 기준

[데이터 특성]
  - 공시 기준이므로 실시간 아님
  - 연결재무제표(CFS) vs 개별재무제표(OFS) 구분 필요
  - 계정과목명이 기업마다 약간 다를 수 있음

[가치투자 분석에 필요한 지표 계산 가능 여부]
  ✓ ROE = 당기순이익 / 자본총계
  ✓ ROA = 당기순이익 / 자산총계
  ✓ 부채비율 = 부채총계 / 자본총계
  ✓ 영업이익률 = 영업이익 / 매출액
  ✓ 순이익률 = 당기순이익 / 매출액
  △ PER = 시가총액 / 당기순이익 (pykrx와 조합)
  △ PBR = 시가총액 / 자본총계 (pykrx와 조합)
""")

print("\n" + "=" * 70)
print("재무제표 탐색 완료!")
print("=" * 70)
