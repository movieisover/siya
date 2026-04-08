"""
FinanceDataReader가 제공하는 컬럼 확인 + pykrx로 업종 데이터 가져오기
"""
import FinanceDataReader as fdr
from pykrx import stock
import datetime

# 1. FDR 컬럼 확인
print("=" * 60)
print("1. FinanceDataReader 컬럼 확인")
print("=" * 60)
for market in ['KOSPI', 'KOSDAQ']:
    df = fdr.StockListing(market)
    print(f"\n{market} 컬럼: {list(df.columns)}")
    print(f"행 수: {len(df)}")
    print(df.head(3).to_string())

# 2. pykrx 업종 데이터 확인
print("\n" + "=" * 60)
print("2. pykrx 업종 데이터 확인")
print("=" * 60)
today = datetime.date.today().strftime('%Y%m%d')

# KOSPI 업종 목록
print("\nKOSPI 업종 목록:")
sectors = stock.get_market_ticker_list(today, market='KOSPI')
# 몇 개 종목의 업종 확인
for ticker in sectors[:10]:
    name = stock.get_market_ticker_name(ticker)
    # 업종 정보 가져오기 시도
    print(f"  {ticker}: {name}")

# KRX 업종 분류 확인
print("\nKRX 업종 분류:")
try:
    sector_list = stock.get_index_ticker_list(market='KOSPI')
    print(f"  업종 인덱스 수: {len(sector_list)}")
    for idx in sector_list[:20]:
        name = stock.get_index_ticker_name(idx)
        print(f"  {idx}: {name}")
except Exception as e:
    print(f"  오류: {e}")
