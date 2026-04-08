"""
시야 (Siya) — 밸류에이션 수집 (valuation)
pykrx로 전 종목 3년치 PER/PBR/EPS/BPS/배당 데이터를 Supabase에 저장

실행: python src/data/collectors/collect_valuation.py
"""

import time
from datetime import datetime, timedelta
from pykrx import stock
from utils import get_supabase, get_all_stocks, get_collected_codes, batch_upsert

supabase = get_supabase()

# 기간 설정: 3년
END_DATE = datetime.today()
START_DATE = END_DATE - timedelta(days=365 * 3)
START_STR = START_DATE.strftime('%Y%m%d')
END_STR = END_DATE.strftime('%Y%m%d')


def collect_valuation():
    print("=" * 60)
    print(f"밸류에이션 수집 시작")
    print(f"기간: {START_STR} ~ {END_STR} (약 3년)")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)
    collected = get_collected_codes(supabase, 'valuation')
    remaining = [s for s in stocks_list if s['stock_code'] not in collected]

    print(f"전체: {len(stocks_list)}개 / 이미 수집: {len(collected)}개 / 미수집: {len(remaining)}개\n")

    if not remaining:
        print("✅ 모든 종목 수집 완료!")
        return

    success_count = 0
    skip_count = 0
    error_count = 0
    total = len(remaining)

    for i, s in enumerate(remaining):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 50 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 수집 중...")

        try:
            # pykrx로 PER/PBR/배당 조회
            df = stock.get_market_fundamental(START_STR, END_STR, code)

            if df.empty:
                skip_count += 1
                continue

            rows = []
            cols = df.columns.tolist()

            for date_idx, row in df.iterrows():
                trade_date = date_idx.strftime('%Y-%m-%d')

                # 컬럼명 확인 (한글/영문 대응)
                per_val = float(row.get('PER', row.get('per', 0))) if 'PER' in cols or 'per' in cols else None
                pbr_val = float(row.get('PBR', row.get('pbr', 0))) if 'PBR' in cols or 'pbr' in cols else None
                eps_val = float(row.get('EPS', row.get('eps', 0))) if 'EPS' in cols or 'eps' in cols else None
                bps_val = float(row.get('BPS', row.get('bps', 0))) if 'BPS' in cols or 'bps' in cols else None
                div_val = float(row.get('DIV', row.get('div', 0))) if 'DIV' in cols or 'div' in cols else None
                dps_val = float(row.get('DPS', row.get('dps', 0))) if 'DPS' in cols or 'dps' in cols else None

                rows.append({
                    'stock_code': code,
                    'trade_date': trade_date,
                    'per': round(per_val, 2) if per_val else None,
                    'pbr': round(pbr_val, 2) if pbr_val else None,
                    'eps': round(eps_val, 2) if eps_val else None,
                    'bps': round(bps_val, 2) if bps_val else None,
                    'div_yield': round(div_val, 2) if div_val else None,
                    'dps': round(dps_val, 2) if dps_val else None,
                    'source': 'pykrx'
                })

            if rows:
                batch_upsert(supabase, 'valuation', rows, 'stock_code,trade_date')
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
    print(f"밸류에이션 수집 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개")
    print(f"  ❌ 오류: {error_count}개")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    collect_valuation()
