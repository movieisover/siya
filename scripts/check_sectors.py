"""
시야 (Siya) — 업종 데이터 확인 스크립트
stocks 테이블에 어떤 업종(sector) 데이터가 있는지 확인

실행: conda activate siya && cd C:\projects\stock-analyzer && python scripts/check_sectors.py
"""

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 1. 전체 종목 수
result = supabase.table('stocks').select('stock_code', count='exact').execute()
print(f"전체 종목 수: {result.count}")

# 2. sector가 있는 종목 수
result = supabase.table('stocks').select('stock_code', count='exact').not_.is_('sector', 'null').execute()
print(f"sector 있는 종목: {result.count}")

# 3. sector 없는 종목 수
result = supabase.table('stocks').select('stock_code', count='exact').is_('sector', 'null').execute()
print(f"sector 없는 종목: {result.count}")

# 4. 고유 sector 목록 (상위 30개)
result = supabase.table('stocks').select('sector').not_.is_('sector', 'null').execute()
sectors = set()
for row in result.data:
    if row['sector']:
        sectors.add(row['sector'])

print(f"\n고유 업종 수: {len(sectors)}")
print("\n--- 전체 업종 목록 ---")
for s in sorted(sectors):
    print(f"  {s}")
