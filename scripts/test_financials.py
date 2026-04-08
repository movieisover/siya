"""
DART 재무제표 수집 테스트 — 삼성전자 1종목
"""
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import OpenDartReader

DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)

print(f"DART API 키: {DART_API_KEY[:10]}...")

# 삼성전자 2024년 사업보고서
print("\n=== 삼성전자 2024년 재무제표 ===")
try:
    df = dart.finstate('005930', 2024, reprt_code='11011')
    if df is not None and not df.empty:
        print(f"컬럼: {list(df.columns)}")
        print(f"행 수: {len(df)}")
        print(f"\nfs_div 값: {df['fs_div'].unique()}")
        print(f"\naccount_nm 목록:")
        for _, row in df.iterrows():
            print(f"  [{row['fs_div']}] {row['account_nm']}: {row.get('thstrm_amount', 'N/A')}")
    else:
        print("데이터 없음")
except Exception as e:
    print(f"오류: {e}")

# 2023년도 시도
print("\n=== 삼성전자 2023년 재무제표 ===")
try:
    df2 = dart.finstate('005930', 2023, reprt_code='11011')
    if df2 is not None and not df2.empty:
        print(f"행 수: {len(df2)}")
        print(f"fs_div 값: {df2['fs_div'].unique()}")
    else:
        print("데이터 없음")
except Exception as e:
    print(f"오류: {e}")
