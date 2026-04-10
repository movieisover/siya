"""
시야 (Siya) — 기관/외국인 수급 수집 (한국투자증권 API)
투자자별 매매동향 → investor_trading 테이블 upsert
금액 단위: 백만원 (API 응답 단위 변환)

실행:
  python src/data/collectors/collect_investor_kis.py                # 최근 30일
  python src/data/collectors/collect_investor_kis.py --date 20260410  # 특정일만
  python src/data/collectors/collect_investor_kis.py --days 5        # 최근 5일
"""

import argparse
import time
from datetime import datetime, timedelta

from kis_api import kis_get
from utils import get_supabase, get_all_stocks, batch_upsert

ENDPOINT = "/uapi/domestic-stock/v1/quotations/inquire-investor"
TR_ID = "FHKST01010900"


def fetch_investor_data(stock_code):
    """종목 1개의 투자자별 매매동향 조회 (최근 30영업일)."""
    data = kis_get(ENDPOINT, TR_ID, {
        'FID_COND_MRKT_DIV_CODE': 'J',
        'FID_INPUT_ISCD': stock_code,
    })
    if not data:
        return []
    return data.get('output', [])


def parse_investor_rows(stock_code, items, target_dates=None):
    """API 응답을 investor_trading 테이블 행으로 변환."""
    rows = []
    for item in items:
        date_str = item.get('stck_bsop_date', '')
        if not date_str:
            continue

        # 데이터가 비어있으면 건너뜀 (장중 당일 등)
        frgn_val = item.get('frgn_ntby_tr_pbmn', '').strip()
        orgn_val = item.get('orgn_ntby_tr_pbmn', '').strip()
        if not frgn_val and not orgn_val:
            continue

        # 특정 날짜만 필터링
        if target_dates and date_str not in target_dates:
            continue

        trade_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

        # API 금액 단위: 백만원
        foreign_net = int(frgn_val) if frgn_val else 0
        inst_net = int(orgn_val) if orgn_val else 0

        rows.append({
            'stock_code': stock_code,
            'trade_date': trade_date,
            'inst_net_buy': inst_net,
            'foreign_net_buy': foreign_net,
            'source': 'kis_api',
        })
    return rows


def collect_investor(target_dates=None):
    supabase = get_supabase()
    stocks_list = get_all_stocks(supabase)
    total = len(stocks_list)

    date_desc = ', '.join(target_dates) if target_dates else '최근 30영업일'
    print("=" * 60)
    print(f"기관/외국인 수급 수집 (KIS API)")
    print(f"대상: {total}개 종목 / 기간: {date_desc}")
    print("=" * 60)

    all_rows = []
    success_count = 0
    skip_count = 0
    error_count = 0

    for i, s in enumerate(stocks_list):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 500 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 수집 중...")

        try:
            items = fetch_investor_data(code)
            rows = parse_investor_rows(code, items, target_dates)

            if rows:
                all_rows.extend(rows)
                success_count += 1
            else:
                skip_count += 1

        except Exception as e:
            if error_count < 5:
                print(f"  ❌ {name}({code}) 오류: {e}")
            error_count += 1

        # 1000건마다 배치 upsert + 진행률
        if len(all_rows) >= 1000:
            ok, err = batch_upsert(supabase, 'investor_trading', all_rows, 'stock_code,trade_date')
            print(f"  ⏳ {i+1}/{total} 처리 ({success_count} 성공, {ok}행 저장)")
            all_rows = []

    # 잔여 행 저장
    if all_rows:
        batch_upsert(supabase, 'investor_trading', all_rows, 'stock_code,trade_date')

    print(f"\n{'=' * 60}")
    print(f"수급 수집 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개")
    print(f"  ❌ 오류: {error_count}개")
    print(f"{'=' * 60}")


def main():
    parser = argparse.ArgumentParser(description='KIS API 기관/외국인 수급 수집')
    parser.add_argument('--date', type=str, help='특정일 수집 (YYYYMMDD)')
    parser.add_argument('--days', type=int, default=30, help='최근 N일 수집 (기본: 30)')
    args = parser.parse_args()

    if args.date:
        target_dates = [args.date]
    else:
        # 최근 N일의 날짜 목록 생성 (영업일 확보를 위해 여유 포함)
        target_dates = None  # None이면 API가 반환하는 전체 30일 사용

    collect_investor(target_dates)


if __name__ == '__main__':
    main()
