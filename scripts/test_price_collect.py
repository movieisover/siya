"""
시야 (Siya) — 시세 수집 테스트 (삼성전자 1종목만)
정상 동작 확인 후 전체 수집 실행

실행: python scripts/test_price_collect.py
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from pykrx import stock
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 최근 30일만 테스트
END_DATE = datetime.today()
START_DATE = END_DATE - timedelta(days=30)
START_STR = START_DATE.strftime('%Y%m%d')
END_STR = END_DATE.strftime('%Y%m%d')

print(f"테스트: 삼성전자(005930) 최근 30일 시세 수집")
print(f"기간: {START_STR} ~ {END_STR}")

# 1. pykrx에서 시세 가져오기
df = stock.get_market_ohlcv(START_STR, END_STR, '005930')
print(f"\n컬럼: {list(df.columns)}")
print(f"행 수: {len(df)}")
print(df.head(5).to_string())

# 2. Supabase에 저장
rows = []
for date_idx, row in df.iterrows():
    cols = df.columns.tolist()
    
    if '시가' in cols:
        rows.append({
            'stock_code': '005930',
            'trade_date': date_idx.strftime('%Y-%m-%d'),
            'open': int(row['시가']),
            'high': int(row['고가']),
            'low': int(row['저가']),
            'close': int(row['종가']),
            'volume': int(row['거래량']),
            'change_pct': round(float(row['등락률']), 4) if '등락률' in cols else None,
            'source': 'pykrx'
        })
    elif 'Open' in cols:
        rows.append({
            'stock_code': '005930',
            'trade_date': date_idx.strftime('%Y-%m-%d'),
            'open': int(row['Open']),
            'high': int(row['High']),
            'low': int(row['Low']),
            'close': int(row['Close']),
            'volume': int(row['Volume']),
            'change_pct': round(float(row['Change']) * 100, 4) if 'Change' in cols else None,
            'source': 'pykrx'
        })

print(f"\n저장할 행 수: {len(rows)}")
if rows:
    print(f"첫 행 예시: {rows[0]}")
    
    result = supabase.table('price_daily').upsert(
        rows, on_conflict='stock_code,trade_date'
    ).execute()
    print(f"\n✅ Supabase 저장 성공! {len(rows)}행")
    
    # 확인 조회
    check = supabase.table('price_daily').select('*').eq('stock_code', '005930').order('trade_date', desc=True).limit(5).execute()
    print(f"\n--- DB 확인 (최근 5일) ---")
    for r in check.data:
        print(f"  {r['trade_date']}: 종가 {r['close']:,}원, 거래량 {r['volume']:,}")
