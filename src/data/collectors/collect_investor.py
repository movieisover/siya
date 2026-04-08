"""
시야 (Siya) — 기관/외국인 수급 수집 (investor_trading)
pykrx로 전 종목 30일치 기관/외국인 순매수 데이터를 Supabase에 저장
금액 단위: 원(₩)

실행: python src/data/collectors/collect_investor.py
"""

import time
from datetime import datetime, timedelta
from pykrx import stock
from utils import get_supabase, get_all_stocks, batch_upsert

supabase = get_supabase()

# 기간 설정: 30일
END_DATE = datetime.today()
START_DATE = END_DATE - timedelta(days=45)  # 영업일 기준 30일 확보를 위해 45일
START_STR = START_DATE.strftime('%Y%m%d')
END_STR = END_DATE.strftime('%Y%m%d')


def collect_investor_trading():
    print("=" * 60)
    print(f"기관/외국인 수급 수집 시작")
    print(f"기간: {START_STR} ~ {END_STR} (약 30영업일)")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)
    total = len(stocks_list)
    print(f"대상 종목: {total}개\n")

    success_count = 0
    skip_count = 0
    error_count = 0

    for i, s in enumerate(stocks_list):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 50 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 수집 중...")

        try:
            # pykrx로 투자자별 순매수 금액 조회
            df = stock.get_market_trading_value_by_date(
                START_STR, END_STR, code,
                detail=True
            )

            if df.empty:
                skip_count += 1
                continue

            rows = []
            cols = df.columns.tolist()

            for date_idx, row in df.iterrows():
                trade_date = date_idx.strftime('%Y-%m-%d')

                # 기관 순매수 (금융투자 + 보험 + 투신 + 사모 + 은행 + 기타금융 + 연기금)
                inst_cols = ['금융투자', '보험', '투신', '사모', '은행', '기타금융', '연기금등']
                inst_net = 0
                for col in inst_cols:
                    if col in cols:
                        val = row.get(col, 0)
                        inst_net += int(val) if val else 0

                # 외국인 순매수
                foreign_net = 0
                for col in ['외국인', '외국인합계']:
                    if col in cols:
                        foreign_net = int(row.get(col, 0)) if row.get(col, 0) else 0
                        break

                rows.append({
                    'stock_code': code,
                    'trade_date': trade_date,
                    'inst_net_buy': inst_net,
                    'foreign_net_buy': foreign_net,
                    'source': 'pykrx'
                })

            if rows:
                batch_upsert(supabase, 'investor_trading', rows, 'stock_code,trade_date')
                success_count += 1
            else:
                skip_count += 1

        except Exception as e:
            if i < 5:
                print(f"  ❌ {name}({code}) 오류: {e}")
            error_count += 1

        if (i + 1) % 100 == 0:
            print(f"  ⏳ {i+1}/{total} 완료 ({success_count}개 성공)")
            time.sleep(1)

    print(f"\n{'=' * 60}")
    print(f"기관/외국인 수급 수집 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개")
    print(f"  ❌ 오류: {error_count}개")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    collect_investor_trading()
