"""
시야 (Siya) — 배당 일정 수집 (한국투자증권 API)

날짜별 일괄 조회 방식: SHT_CD 빈값으로 하루씩 순회하며 전체 종목 배당 일정 수집.
→ 전 종목 순회 없이 API 호출 수 = 조회 일수 (3년 ≈ 750회, ~5분)

엔드포인트: /uapi/domestic-stock/v1/ksdinfo/dividend (HHKDB669102C0)
저장 테이블: dividend_schedule

실행:
  python src/data/collectors/collect_dividend_schedule.py                  # 최근 7일 (주간 갱신)
  python src/data/collectors/collect_dividend_schedule.py --days 30        # 최근 30일
  python src/data/collectors/collect_dividend_schedule.py --years 3        # 최근 3년 (초기 수집)
  python src/data/collectors/collect_dividend_schedule.py --stock 005930   # 단일 종목 테스트
"""

import argparse
import time
from datetime import datetime, timedelta

from kis_api import kis_get
from utils import get_supabase, batch_upsert

ENDPOINT = "/uapi/domestic-stock/v1/ksdinfo/dividend"
TR_ID = "HHKDB669102C0"


def fetch_dividends_by_date(date_str):
    """
    특정 날짜의 전체 종목 배당 일정 조회.
    date_str: YYYYMMDD
    반환: output1 리스트 (최대 100건, 하루 기준 충분)
    """
    data = kis_get(ENDPOINT, TR_ID, {
        'CTS': '',
        'GB1': '0',
        'F_DT': date_str,
        'T_DT': date_str,
        'SHT_CD': '',
        'HIGH_GB': '',
    })
    if not data:
        return []
    return data.get('output1', []) or []


def fetch_dividends_by_stock(stock_code, from_date, to_date):
    """
    특정 종목의 기간 내 배당 일정 조회.
    stock_code: 6자리 종목코드
    from_date/to_date: YYYYMMDD
    """
    data = kis_get(ENDPOINT, TR_ID, {
        'CTS': '',
        'GB1': '0',
        'F_DT': from_date,
        'T_DT': to_date,
        'SHT_CD': stock_code,
        'HIGH_GB': '',
    })
    if not data:
        return []
    return data.get('output1', []) or []


def parse_date_yyyymmdd(s):
    """YYYYMMDD → YYYY-MM-DD 또는 None."""
    s = (s or '').strip()
    if len(s) != 8:
        return None
    try:
        datetime.strptime(s, '%Y%m%d')
        return f"{s[:4]}-{s[4:6]}-{s[6:8]}"
    except ValueError:
        return None


def parse_date_slash(s):
    """YYYY/MM/DD → YYYY-MM-DD 또는 None."""
    s = (s or '').strip()
    if len(s) != 10 or '/' not in s:
        return None
    try:
        parts = s.split('/')
        datetime.strptime(f"{parts[0]}{parts[1]}{parts[2]}", '%Y%m%d')
        return f"{parts[0]}-{parts[1]}-{parts[2]}"
    except (ValueError, IndexError):
        return None


def parse_rows(items):
    """API 응답을 dividend_schedule 테이블 행으로 변환."""
    rows = []
    for item in items:
        record_date = parse_date_yyyymmdd(item.get('record_date', ''))
        if not record_date:
            continue

        stock_code = (item.get('sht_cd') or '').strip()
        if not stock_code or len(stock_code) != 6:
            continue

        # 주당배당금
        amt_str = (item.get('per_sto_divi_amt') or '').strip()
        try:
            dps = float(amt_str) if amt_str else 0
        except ValueError:
            dps = 0

        payment_date = parse_date_slash(item.get('divi_pay_dt', ''))
        dividend_type = (item.get('divi_kind') or '').strip() or None
        stock_kind = (item.get('stk_kind') or '').strip() or '보통'

        rows.append({
            'stock_code': stock_code,
            'record_date': record_date,
            'payment_date': payment_date,
            'dividend_per_share': dps,
            'dividend_type': dividend_type,
            'stock_kind': stock_kind,
            'source': 'kis_api',
        })
    return rows


def collect_by_date_range(from_date, to_date):
    """날짜별 일괄 조회 방식으로 수집."""
    supabase = get_supabase()

    current = from_date
    total_days = (to_date - from_date).days + 1
    all_rows = []
    total_records = 0
    day_count = 0
    api_calls = 0

    print("=" * 60)
    print(f"배당 일정 수집 (날짜별 일괄 조회)")
    print(f"기간: {from_date.strftime('%Y-%m-%d')} ~ {to_date.strftime('%Y-%m-%d')} ({total_days}일)")
    print("=" * 60)

    while current <= to_date:
        date_str = current.strftime('%Y%m%d')
        day_count += 1

        try:
            items = fetch_dividends_by_date(date_str)
            api_calls += 1

            if items:
                rows = parse_rows(items)
                all_rows.extend(rows)
                total_records += len(rows)

        except Exception as e:
            print(f"  ❌ {date_str} 오류: {e}")

        # 500건마다 배치 저장
        if len(all_rows) >= 500:
            ok, err = batch_upsert(
                supabase, 'dividend_schedule', all_rows,
                'stock_code,record_date,dividend_type'
            )
            print(f"  ⏳ {day_count}/{total_days}일 처리, {total_records}건 수집, {ok}행 저장")
            all_rows = []

        # 50일마다 진행률
        if day_count % 50 == 0:
            print(f"  📅 {day_count}/{total_days}일 완료 (누적 {total_records}건, API {api_calls}회)")

        current += timedelta(days=1)

    # 잔여 행 저장
    if all_rows:
        ok, err = batch_upsert(
            supabase, 'dividend_schedule', all_rows,
            'stock_code,record_date,dividend_type'
        )

    print(f"\n{'=' * 60}")
    print(f"배당 일정 수집 완료!")
    print(f"  📅 조회 기간: {total_days}일")
    print(f"  📡 API 호출: {api_calls}회")
    print(f"  ✅ 수집 건수: {total_records}건")
    print(f"{'=' * 60}")


def collect_by_stock(stock_code, from_date, to_date):
    """단일 종목 테스트용."""
    supabase = get_supabase()

    print("=" * 60)
    print(f"배당 일정 수집 (단일 종목: {stock_code})")
    print(f"기간: {from_date.strftime('%Y-%m-%d')} ~ {to_date.strftime('%Y-%m-%d')}")
    print("=" * 60)

    items = fetch_dividends_by_stock(
        stock_code,
        from_date.strftime('%Y%m%d'),
        to_date.strftime('%Y%m%d'),
    )

    if not items:
        print("  결과 없음")
        return

    rows = parse_rows(items)
    print(f"  조회 결과: {len(items)}건 → 파싱 {len(rows)}건")

    for r in rows:
        print(f"  📌 기준일:{r['record_date']}  지급일:{r['payment_date'] or '-'}  "
              f"DPS:{r['dividend_per_share']}원  종류:{r['dividend_type'] or '-'}  "
              f"주식:{r['stock_kind']}")

    if rows:
        # 단일 종목 테스트 시 에러 상세 출력
        saved = 0
        failed = 0
        for r in rows:
            try:
                supabase.table('dividend_schedule').upsert(
                    r, on_conflict='stock_code,record_date,dividend_type'
                ).execute()
                saved += 1
            except Exception as e:
                failed += 1
                print(f"  ❌ 저장 실패 (기준일:{r['record_date']} 종류:{r['dividend_type']}): {e}")
        print(f"\n  ✅ DB 저장: {saved}건 성공, {failed}건 실패")


def main():
    parser = argparse.ArgumentParser(description='KIS API 배당 일정 수집')
    parser.add_argument('--stock', type=str, help='단일 종목 테스트 (종목코드 6자리)')
    parser.add_argument('--days', type=int, default=7, help='최근 N일 수집 (기본: 7)')
    parser.add_argument('--years', type=int, help='최근 N년 수집 (초기 수집용)')
    parser.add_argument('--from', dest='from_date', type=str, help='시작일 (YYYY-MM-DD)')
    parser.add_argument('--to', dest='to_date', type=str, help='종료일 (YYYY-MM-DD)')
    args = parser.parse_args()

    today = datetime.today()

    if args.from_date:
        from_date = datetime.strptime(args.from_date, '%Y-%m-%d')
    elif args.years:
        from_date = today - timedelta(days=365 * args.years)
    else:
        from_date = today - timedelta(days=args.days)

    to_date = datetime.strptime(args.to_date, '%Y-%m-%d') if args.to_date else today

    start = time.time()
    print(f"\n{'#' * 60}")
    print(f"  시야 배당 일정 수집")
    print(f"  실행 시각: {today.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#' * 60}\n")

    if args.stock:
        collect_by_stock(args.stock, from_date, to_date)
    else:
        collect_by_date_range(from_date, to_date)

    elapsed = time.time() - start
    print(f"\n소요 시간: {elapsed/60:.1f}분")


if __name__ == '__main__':
    main()
