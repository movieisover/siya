"""
시야 (Siya) — DART 공시 수집 스크립트
DART OpenAPI를 통해 공시 목록을 수집하여 Supabase에 저장

실행: python src/data/collectors/collect_disclosures.py
옵션: python src/data/collectors/collect_disclosures.py --date 2026-04-09
벌크: python src/data/collectors/collect_disclosures.py --from-date 2026-01-01
"""

import os
import sys
import time
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)

import OpenDartReader
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
DART_API_KEY = os.getenv('DART_API_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
dart = OpenDartReader(DART_API_KEY)

# DART 원문 링크 포맷
DART_REPORT_URL = "https://dart.fss.or.kr/dsaf001/main.do?rcpNo={}"

# 종목명-종목코드 매핑 (1회만 로드)
_stock_map = None

def get_stock_code_map():
    global _stock_map
    if _stock_map is not None:
        return _stock_map
    mapping = {}
    offset = 0
    while True:
        res = supabase.table('stocks').select(
            'stock_code, stock_name'
        ).range(offset, offset + 999).execute()
        for r in res.data:
            mapping[r['stock_name']] = r['stock_code']
        if len(res.data) < 1000:
            break
        offset += 1000
    _stock_map = mapping
    print(f"  종목 매핑: {len(mapping)}개 로드")
    return mapping


def collect_disclosures(target_date: str):
    print(f"\n{'=' * 60}")
    print(f"  DART 공시 수집: {target_date}")
    print(f"{'=' * 60}\n")

    stock_map = get_stock_code_map()

    try:
        df = dart.list(start=target_date, end=target_date)
    except Exception as e:
        print(f"  ❌ DART API 오류: {e}")
        return 0

    if df is None or (hasattr(df, 'empty') and df.empty):
        print(f"  ℹ️ {target_date} 공시 없음")
        return 0

    # DataFrame → rows 변환 + rcept_no 중복 제거
    seen = set()
    rows = []
    for _, row in df.iterrows():
        rcept_no = str(row.get('rcept_no', '')).strip()
        if not rcept_no or rcept_no in seen:
            continue
        seen.add(rcept_no)

        corp_name = str(row.get('corp_name', '')).strip()
        report_name = str(row.get('report_nm', '')).strip()
        corp_code = str(row.get('corp_code', '')).strip() if row.get('corp_code') else None
        rcept_date = str(row.get('rcept_dt', '')).strip()
        flr_name = str(row.get('flr_nm', '')).strip() if row.get('flr_nm') else None
        report_type = str(row.get('pblntf_ty', '')).strip() if row.get('pblntf_ty') else None

        if len(rcept_date) == 8:
            rcept_date = f"{rcept_date[:4]}-{rcept_date[4:6]}-{rcept_date[6:8]}"
        elif len(rcept_date) != 10:
            rcept_date = target_date

        stock_code = stock_map.get(corp_name, None)

        rows.append({
            'rcept_no': rcept_no,
            'corp_code': corp_code,
            'stock_code': stock_code,
            'corp_name': corp_name,
            'report_name': report_name,
            'rcept_date': rcept_date,
            'report_type': report_type,
            'flr_name': flr_name,
            'dart_url': DART_REPORT_URL.format(rcept_no),
        })

    if not rows:
        print(f"  ℹ️ 유효한 공시 없음")
        return 0

    # Supabase upsert (rcept_no 기준 중복 방지)
    success = 0
    errors = 0
    batch_size = 200

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        try:
            supabase.table('disclosures').upsert(
                batch, on_conflict='rcept_no'
            ).execute()
            success += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"  ⚠️ 배치 upsert 오류: {e}")

    print(f"  ✅ 공시 수집 완료: {success}건 저장 (오류: {errors}건)")
    return success


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='DART 공시 수집')
    parser.add_argument('--date', type=str, default=None,
                        help='수집 날짜 (YYYY-MM-DD), 기본값: 오늘')
    parser.add_argument('--days', type=int, default=1,
                        help='오늘부터 며칠 전까지 수집 (기본: 1 = 오늘만)')
    parser.add_argument('--from-date', type=str, default=None,
                        help='시작일 (YYYY-MM-DD) — 이 날짜부터 오늘까지 일괄 수집')
    args = parser.parse_args()

    start_time = time.time()

    if args.from_date:
        from_dt = datetime.strptime(args.from_date, '%Y-%m-%d')
        to_dt = datetime.today()
        current = from_dt
        total_days = 0
        while current <= to_dt:
            if current.weekday() < 5:
                collect_disclosures(current.strftime('%Y-%m-%d'))
                total_days += 1
                time.sleep(0.5)
            current += timedelta(days=1)
        print(f"\n  벌크 수집 완료: {total_days}일")
    elif args.date:
        collect_disclosures(args.date)
    else:
        for d in range(args.days):
            target = datetime.today() - timedelta(days=d)
            if target.weekday() >= 5:
                continue
            collect_disclosures(target.strftime('%Y-%m-%d'))
            if d < args.days - 1:
                time.sleep(1)

    elapsed = time.time() - start_time
    print(f"\n  전체 소요: {elapsed:.1f}초")
