"""
pykrx 투자자별 매매 함수 테스트
"""
from datetime import datetime, timedelta
from pykrx import stock

end = datetime.today().strftime('%Y%m%d')
start = (datetime.today() - timedelta(days=7)).strftime('%Y%m%d')

print(f"기간: {start} ~ {end}")

# 방법 1: get_market_trading_value_by_date (종목별)
print("\n=== 방법 1: get_market_trading_value_by_date ===")
try:
    df = stock.get_market_trading_value_by_date(start, end, '005930', detail=True)
    print(f"컬럼: {list(df.columns)}")
    print(f"행 수: {len(df)}")
    if not df.empty:
        print(df.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")

# 방법 2: detail=False
print("\n=== 방법 2: detail=False ===")
try:
    df2 = stock.get_market_trading_value_by_date(start, end, '005930', detail=False)
    print(f"컬럼: {list(df2.columns)}")
    print(f"행 수: {len(df2)}")
    if not df2.empty:
        print(df2.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")

# 방법 3: get_market_trading_value_by_investor
print("\n=== 방법 3: get_market_trading_value_by_investor ===")
try:
    df3 = stock.get_market_trading_value_by_investor(start, end, '005930')
    print(f"컬럼: {list(df3.columns)}")
    print(f"행 수: {len(df3)}")
    if not df3.empty:
        print(df3.to_string())
except Exception as e:
    print(f"오류: {e}")

# 방법 4: get_market_trading_volume_by_date
print("\n=== 방법 4: get_market_trading_volume_by_date ===")
try:
    df4 = stock.get_market_trading_volume_by_date(start, end, '005930')
    print(f"컬럼: {list(df4.columns)}")
    print(f"행 수: {len(df4)}")
    if not df4.empty:
        print(df4.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")
