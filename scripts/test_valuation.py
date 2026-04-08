"""
pykrx 밸류에이션 함수 테스트
"""
from datetime import datetime, timedelta
from pykrx import stock

end = datetime.today().strftime('%Y%m%d')
start = (datetime.today() - timedelta(days=30)).strftime('%Y%m%d')

print(f"기간: {start} ~ {end}")

# 방법 1: get_market_fundamental (종목별)
print("\n=== 방법 1: get_market_fundamental ===")
try:
    df = stock.get_market_fundamental(start, end, '005930')
    print(f"컬럼: {list(df.columns)}")
    print(f"행 수: {len(df)}")
    print(df.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")

# 방법 2: get_market_fundamental_by_ticker (날짜별 전종목)
print("\n=== 방법 2: get_market_fundamental_by_ticker ===")
try:
    df2 = stock.get_market_fundamental_by_ticker(end, market='KOSPI')
    print(f"컬럼: {list(df2.columns)}")
    print(f"행 수: {len(df2)}")
    print(df2.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")

# 방법 3: get_market_fundamental_by_date
print("\n=== 방법 3: get_market_fundamental_by_date ===")
try:
    df3 = stock.get_market_fundamental_by_date(start, end, '005930')
    print(f"컬럼: {list(df3.columns)}")
    print(f"행 수: {len(df3)}")
    print(df3.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")
