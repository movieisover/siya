"""
시야 (Siya) — ECOS 원/달러 환율 수집

한국은행 ECOS 통계표 731Y001 / 항목 0000001
(원/미국달러 매매기준율, 주기 D)를 일별로 조회하여
fx_daily 테이블에 (trade_date, rate)로 업서트한다.

- 엔드포인트: StatisticSearch/{KEY}/json/kr/{s}/{e}/731Y001/D/{from}/{to}/0000001
- 응답에 "RESULT" 키가 있으면 에러로 처리
- list_total_count를 읽어 페이지네이션 (1회 1000건)

핵심 수집 로직은 update_fx() 함수에 있으며 daily_update.py에서도 재사용한다
(단일 출처 유지). 이 파일을 직접 실행하면 CLI로 동작한다.

옵션:
  (기본)                : 최근 3년 백필 (today-3y ~ today)
  --days N              : 최근 N일
  --from YYYYMMDD --to YYYYMMDD : 구간 지정

실행: python src/data/collectors/collect_fx.py [옵션]
"""

import os
import sys
import time
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv

import requests

_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)

from supabase import create_client

ECOS_API_KEY = os.getenv('ECOS_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

ECOS_BASE = 'https://ecos.bok.or.kr/api'
STAT_CODE = '731Y001'   # 주요국 통화의 대원화 환율
ITEM_CODE = '0000001'   # 원/미국달러(매매기준율)
CYCLE = 'D'             # 일별
PAGE_SIZE = 1000


def _years_ago(dt, years):
    """dt에서 years년 전. 윤년(2/29) 방어."""
    try:
        return dt.replace(year=dt.year - years)
    except ValueError:
        return dt.replace(month=2, day=28, year=dt.year - years)


def fetch_fx(start_yyyymmdd, end_yyyymmdd):
    """
    ECOS에서 [start, end] 구간 일별 환율을 페이지네이션으로 전부 조회.
    반환: row 리스트 (각 row는 TIME/DATA_VALUE 등 포함)
    """
    if not ECOS_API_KEY:
        raise RuntimeError("ECOS_API_KEY 가 .env 에 없습니다.")

    all_rows = []
    page_start = 1

    while True:
        page_end = page_start + PAGE_SIZE - 1
        url = (
            f"{ECOS_BASE}/StatisticSearch/{ECOS_API_KEY}/json/kr/"
            f"{page_start}/{page_end}/{STAT_CODE}/{CYCLE}/"
            f"{start_yyyymmdd}/{end_yyyymmdd}/{ITEM_CODE}"
        )
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        # ECOS 에러 응답 처리
        if isinstance(data, dict) and 'RESULT' in data:
            result = data['RESULT']
            raise RuntimeError(
                f"ECOS RESULT 에러: CODE={result.get('CODE')} "
                f"MESSAGE={result.get('MESSAGE')}"
            )

        block = data.get('StatisticSearch', {})
        rows = block.get('row', [])
        total = int(block.get('list_total_count', 0))

        all_rows.extend(rows)

        if len(all_rows) >= total or not rows:
            break
        page_start += PAGE_SIZE

    return all_rows


def parse_rows(rows):
    """
    ECOS row → fx_daily 업서트용 dict 리스트.
    TIME(YYYYMMDD)→date 문자열, DATA_VALUE→float (정수문자열 방어).
    빈값/형식오류는 건너뜀.
    """
    parsed = []
    skipped = 0

    for r in rows:
        t = (r.get('TIME') or '').strip()
        v = (r.get('DATA_VALUE') or '').strip()

        if len(t) != 8 or not v:
            skipped += 1
            continue

        try:
            trade_date = datetime.strptime(t, '%Y%m%d').strftime('%Y-%m-%d')
            rate = float(v)
        except ValueError:
            skipped += 1
            continue

        if rate <= 0:
            skipped += 1
            continue

        parsed.append({'trade_date': trade_date, 'rate': round(rate, 2)})

    return parsed, skipped


def save_batch(rows, sb, executor):
    """
    fx_daily 업서트 (ON CONFLICT(trade_date) DO UPDATE).
    executor: 쿼리 실행 래퍼. daily_update의 execute_with_retry를 주입하면
              일시적 연결 끊김 재시도가 적용된다.
    """
    if not rows:
        return
    for i in range(0, len(rows), 500):
        batch = rows[i:i + 500]
        executor(sb.table('fx_daily').upsert(batch, on_conflict='trade_date'))


def resolve_range(days=None, start=None, end=None, today=None):
    """옵션 → (start_yyyymmdd, end_yyyymmdd) 결정 (단일 출처)."""
    today = today or datetime.today()

    if start and end:
        return start, end
    if days:
        return (today - timedelta(days=days)).strftime('%Y%m%d'), today.strftime('%Y%m%d')

    # 기본: 최근 3년 백필
    return _years_ago(today, 3).strftime('%Y%m%d'), today.strftime('%Y%m%d')


def update_fx(sb, days=None, start=None, end=None, executor=None):
    """
    ECOS 환율 수집 → fx_daily 업서트. daily_update.py에서도 재사용하는 핵심 로직.

    sb       : supabase client (호출자가 자신의 클라이언트를 전달)
    days     : 최근 N일 (None이고 start/end도 없으면 기본 3년 백필)
    start/end: YYYYMMDD 구간 지정 (둘 다 있을 때만 사용)
    executor : 쿼리 실행 래퍼. 기본 q.execute(). daily_update는 execute_with_retry 전달.

    반환: 결과 요약 dict
      { start, end, fetched, saved, skipped, parsed(list) }
    """
    if executor is None:
        executor = lambda q: q.execute()

    start_str, end_str = resolve_range(days=days, start=start, end=end)

    rows = fetch_fx(start_str, end_str)
    parsed, skipped = parse_rows(rows)
    save_batch(parsed, sb, executor)

    return {
        'start': start_str,
        'end': end_str,
        'fetched': len(rows),
        'saved': len(parsed),
        'skipped': skipped,
        'parsed': parsed,
    }


def main():
    parser = argparse.ArgumentParser(description='ECOS 원/달러 환율 수집')
    parser.add_argument('--days', type=int, help='최근 N일 수집')
    parser.add_argument('--from', dest='from_date', help='시작일 YYYYMMDD')
    parser.add_argument('--to', dest='to_date', help='종료일 YYYYMMDD')
    args = parser.parse_args()

    if bool(args.from_date) != bool(args.to_date):
        print("[ERROR] --from 과 --to 는 함께 지정해야 합니다.")
        sys.exit(1)

    if not ECOS_API_KEY:
        print("[ERROR] ECOS_API_KEY 가 .env 에 없습니다.")
        sys.exit(1)

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    res = update_fx(sb, days=args.days, start=args.from_date, end=args.to_date)

    print("=" * 60)
    print(f"ECOS 원/달러 환율 수집 ({STAT_CODE}/{ITEM_CODE}, 주기 {CYCLE})")
    print(f"구간: {res['start']} ~ {res['end']}")
    print("=" * 60)
    print(f"ECOS 조회 행 수: {res['fetched']}")
    print(f"파싱 성공: {res['saved']}개 / 건너뜀: {res['skipped']}개")
    print(f"✅ fx_daily 업서트 완료: {res['saved']}건")

    if res['parsed']:
        first, last = res['parsed'][0], res['parsed'][-1]
        print(f"  범위: {first['trade_date']} ({first['rate']}) "
              f"~ {last['trade_date']} ({last['rate']})")


if __name__ == '__main__':
    start = time.time()
    print(f"\n{'#' * 60}")
    print(f"  시야 ECOS 환율 수집")
    print(f"  실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#' * 60}\n")

    main()

    elapsed = time.time() - start
    print(f"\n소요 시간: {elapsed:.1f}초")
