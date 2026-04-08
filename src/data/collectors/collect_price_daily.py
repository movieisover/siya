"""
시야 (Siya) — 일별 시세 수집 (price_daily)
pykrx로 전 종목 3년치 일별 시세를 Supabase에 저장

실행: python src/data/collectors/collect_price_daily.py
"""

import os
import sys
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

from pykrx import stock
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 기간 설정: 3년
END_DATE = datetime.today()
START_DATE = END_DATE - timedelta(days=365 * 3)

START_STR = START_DATE.strftime('%Y%m%d')
END_STR = END_DATE.strftime('%Y%m%d')


def collect_price_daily():
    print("=" * 60)
    print(f"일별 시세 수집 시작")
    print(f"기간: {START_STR} ~ {END_STR} (약 3년)")
    print("=" * 60)

    # 종목 리스트 가져오기 (Supabase 기본 1000행 제한 → 페이지네이션)
    stocks_list = []
    page_size = 1000
    offset = 0
    while True:
        result = supabase.table('stocks').select('stock_code, stock_name, market').range(offset, offset + page_size - 1).execute()
        stocks_list.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size
    total = len(stocks_list)
    print(f"전체 종목: {total}개")

    # 이미 수집된 종목 확인 (건너뛰기)
    collected = set()
    check_offset = 0
    while True:
        res = supabase.table('price_daily').select('stock_code').range(check_offset, check_offset + 999).execute()
        for r in res.data:
            collected.add(r['stock_code'])
        if len(res.data) < 1000:
            break
        check_offset += 1000
    
    remaining = [s for s in stocks_list if s['stock_code'] not in collected]
    print(f"이미 수집: {len(collected)}개 / 미수집: {len(remaining)}개\n")
    
    if not remaining:
        print("✅ 모든 종목 수집 완료!")
        return

    success_count = 0
    skip_count = 0
    error_count = 0
    total_remaining = len(remaining)

    for i, s in enumerate(remaining):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 50 == 0 or i == 0:
            print(f"[{i+1}/{total_remaining}] {name}({code}) 수집 중...")

        try:
            # pykrx로 일별 시세 조회
            df = stock.get_market_ohlcv(START_STR, END_STR, code)

            if df.empty:
                skip_count += 1
                continue

            # 데이터 변환
            rows = []
            for date_idx, row in df.iterrows():
                trade_date = date_idx.strftime('%Y-%m-%d')
                
                # 컬럼명 확인 (pykrx 버전에 따라 다를 수 있음)
                cols = df.columns.tolist()
                
                if '시가' in cols:
                    open_val = int(row['시가']) if row['시가'] > 0 else None
                    high_val = int(row['고가']) if row['고가'] > 0 else None
                    low_val = int(row['저가']) if row['저가'] > 0 else None
                    close_val = int(row['종가'])
                    volume_val = int(row['거래량'])
                    change_pct = float(row['등락률']) if '등락률' in cols else None
                elif 'Open' in cols:
                    open_val = int(row['Open']) if row['Open'] > 0 else None
                    high_val = int(row['High']) if row['High'] > 0 else None
                    low_val = int(row['Low']) if row['Low'] > 0 else None
                    close_val = int(row['Close'])
                    volume_val = int(row['Volume'])
                    change_pct = float(row['Change']) * 100 if 'Change' in cols else None
                else:
                    # 첫 번째 종목에서 컬럼 확인
                    if i == 0:
                        print(f"  ⚠️ 알 수 없는 컬럼: {cols}")
                    continue

                if close_val <= 0:
                    continue

                rows.append({
                    'stock_code': code,
                    'trade_date': trade_date,
                    'open': open_val,
                    'high': high_val,
                    'low': low_val,
                    'close': close_val,
                    'volume': volume_val,
                    'change_pct': round(change_pct, 4) if change_pct is not None else None,
                    'source': 'pykrx'
                })

            if rows:
                # 배치 upsert (200개씩)
                batch_size = 200
                for j in range(0, len(rows), batch_size):
                    batch = rows[j:j + batch_size]
                    try:
                        supabase.table('price_daily').upsert(
                            batch,
                            on_conflict='stock_code,trade_date'
                        ).execute()
                    except Exception as e:
                        if i < 5:  # 처음 몇 개만 에러 출력
                            print(f"  ❌ {name} 배치 저장 오류: {e}")
                        error_count += 1

                success_count += 1
            else:
                skip_count += 1

        except Exception as e:
            if i < 5:
                print(f"  ❌ {name}({code}) 수집 오류: {e}")
            error_count += 1

        # API 부하 방지 (100개마다 1초 대기)
        if (i + 1) % 100 == 0:
            print(f"  ⏳ {i+1}/{total_remaining} 완료 ({success_count}개 성공)")
            time.sleep(1)

    print(f"\n{'=' * 60}")
    print(f"일별 시세 수집 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개 (데이터 없음)")
    print(f"  ❌ 오류: {error_count}개")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    collect_price_daily()
