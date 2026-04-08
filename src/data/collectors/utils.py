"""
시야 (Siya) — 공통 유틸리티
Supabase 연결 + 페이지네이션 헬퍼
"""

import os
from dotenv import load_dotenv

# 프로젝트 루트 .env 로드
_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(_env_path)

from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')


def get_supabase():
    """Supabase 클라이언트 반환 (service_role)"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_all_stocks(supabase):
    """전체 종목 리스트 가져오기 (페이지네이션 포함)"""
    stocks_list = []
    page_size = 1000
    offset = 0
    while True:
        result = supabase.table('stocks').select(
            'stock_code, stock_name, market'
        ).range(offset, offset + page_size - 1).execute()
        stocks_list.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size
    return stocks_list


def get_collected_codes(supabase, table_name):
    """특정 테이블에서 이미 수집된 종목코드 set 반환"""
    collected = set()
    offset = 0
    while True:
        res = supabase.table(table_name).select('stock_code').range(offset, offset + 999).execute()
        for r in res.data:
            collected.add(r['stock_code'])
        if len(res.data) < 1000:
            break
        offset += 1000
    return collected


def batch_upsert(supabase, table_name, rows, conflict_columns, batch_size=200):
    """배치 단위로 upsert 실행"""
    success = 0
    errors = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        try:
            supabase.table(table_name).upsert(
                batch, on_conflict=conflict_columns
            ).execute()
            success += len(batch)
        except Exception as e:
            errors += len(batch)
    return success, errors
