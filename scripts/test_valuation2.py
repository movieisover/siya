"""
pykrx 밸류에이션 — 실제 컬럼명 확인
"""
from datetime import datetime, timedelta
from pykrx import stock
import pandas as pd

end = datetime.today().strftime('%Y%m%d')
start = (datetime.today() - timedelta(days=7)).strftime('%Y%m%d')

# 방법 2의 내부 동작을 직접 확인
print("=== pykrx 내부 raw 데이터 확인 ===")
try:
    # 날짜 하나로 전종목 시세 가져오기
    from pykrx.website.krx.market import wrap
    df_raw = wrap.get_market_fundamental_by_ticker(end, 'ALL')
    print(f"컬럼: {list(df_raw.columns)}")
    print(f"행 수: {len(df_raw)}")
    print(df_raw.head(5).to_string())
except Exception as e:
    print(f"wrap 오류: {e}")

# 직접 ohlcv_by_ticker로 시도
print("\n=== get_market_ohlcv_by_ticker raw ===")
try:
    from pykrx.website.krx.market import wrap as w2
    df2 = w2.get_market_ohlcv_by_ticker(end, 'ALL')
    print(f"컬럼: {list(df2.columns)}")
    print(df2.head(3).to_string())
except Exception as e:
    print(f"오류: {e}")

# pykrx 버전 확인
print(f"\npykrx 버전: ", end='')
try:
    import pykrx
    print(pykrx.__version__)
except:
    print("확인 불가")
