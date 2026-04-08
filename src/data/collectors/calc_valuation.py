"""
시야 (Siya) — PER/PBR 자체 계산 + valuation 테이블 저장
시세(price_daily) + 재무제표(financials) + 발행주식수(FDR) → PER/PBR 계산

계산식:
  EPS = 당기순이익(원) / 발행주식수
  BPS = 자본총계(원) / 발행주식수
  PER = 종가 / EPS
  PBR = 종가 / BPS

실행: python src/data/collectors/calc_valuation.py
"""

import os
import time
from datetime import datetime
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import FinanceDataReader as fdr
from utils import get_supabase, get_all_stocks, batch_upsert

supabase = get_supabase()


def collect_shares_outstanding():
    """FDR에서 발행주식수와 시가총액 가져오기"""
    print("📊 발행주식수 수집 중...")
    
    shares_map = {}  # stock_code -> {shares, marcap}
    
    for market in ['KOSPI', 'KOSDAQ']:
        df = fdr.StockListing(market)
        for _, row in df.iterrows():
            code = str(row.get('Code', '')).strip()
            if len(code) != 6:
                continue
            
            shares = row.get('Stocks', None)
            marcap = row.get('Marcap', None)
            
            if shares and int(shares) > 0:
                shares_map[code] = {
                    'shares': int(shares),
                    'marcap': int(marcap) if marcap else None
                }
    
    print(f"  ✅ 발행주식수 확보: {len(shares_map)}개 종목")
    return shares_map


def get_latest_financials():
    """재무제표에서 최신 연도 데이터 가져오기"""
    print("📊 재무제표 로딩 중...")
    
    financials_map = {}  # stock_code -> {net_income, total_equity, ...}
    offset = 0
    
    while True:
        result = supabase.table('financials').select(
            'stock_code, fiscal_year, net_income, total_equity, revenue, operating_income'
        ).order('fiscal_year', desc=True).range(offset, offset + 999).execute()
        
        for row in result.data:
            code = row['stock_code']
            # 가장 최신 연도만 사용 (이미 정렬됨)
            if code not in financials_map:
                financials_map[code] = row
        
        if len(result.data) < 1000:
            break
        offset += 1000
    
    print(f"  ✅ 재무데이터 확보: {len(financials_map)}개 종목")
    return financials_map


def get_latest_prices():
    """최근 거래일 종가 가져오기 — Supabase RPC 또는 종목별 조회"""
    print("📊 최신 종가 로딩 중...")
    
    prices_map = {}
    
    # 종목별로 최신 1건만 조회 (빠름)
    stocks_list = get_all_stocks(supabase)
    total = len(stocks_list)
    
    for i, s in enumerate(stocks_list):
        code = s['stock_code']
        try:
            result = supabase.table('price_daily').select(
                'close, trade_date'
            ).eq('stock_code', code).order('trade_date', desc=True).limit(1).execute()
            
            if result.data:
                prices_map[code] = {
                    'close': result.data[0]['close'],
                    'trade_date': result.data[0]['trade_date']
                }
        except:
            pass
        
        if (i + 1) % 500 == 0:
            print(f"  종가 로딩: {i+1}/{total}")
    
    print(f"  ✅ 최신 종가 확보: {len(prices_map)}개 종목")
    return prices_map


def calc_valuation():
    print("=" * 60)
    print("PER/PBR 자체 계산 시작")
    print("=" * 60)
    
    # 데이터 수집
    shares_map = collect_shares_outstanding()
    financials_map = get_latest_financials()
    prices_map = get_latest_prices()
    
    # 계산
    print(f"\n📊 PER/PBR 계산 중...")
    
    rows = []
    calc_count = 0
    skip_count = 0
    
    for code, shares_info in shares_map.items():
        shares = shares_info['shares']
        
        # 종가 확인
        if code not in prices_map:
            skip_count += 1
            continue
        close = prices_map[code]['close']
        trade_date = prices_map[code]['trade_date']
        
        if not close or close <= 0:
            skip_count += 1
            continue
        
        # 재무제표 확인
        fin = financials_map.get(code)
        
        per = None
        pbr = None
        eps = None
        bps = None
        div_yield = None
        
        if fin:
            # net_income은 백만원 단위 → 원 단위로 변환
            net_income_won = fin['net_income'] * 1_000_000 if fin.get('net_income') else None
            total_equity_won = fin['total_equity'] * 1_000_000 if fin.get('total_equity') else None
            
            # EPS = 당기순이익(원) / 발행주식수
            if net_income_won and shares > 0:
                eps = round(net_income_won / shares, 2)
                # PER = 종가 / EPS (EPS가 양수일 때만)
                if eps > 0:
                    per = round(close / eps, 2)
            
            # BPS = 자본총계(원) / 발행주식수
            if total_equity_won and shares > 0:
                bps = round(total_equity_won / shares, 2)
                # PBR = 종가 / BPS
                if bps > 0:
                    pbr = round(close / bps, 2)
        
        # PER 또는 PBR 중 하나라도 있으면 저장
        if per is not None or pbr is not None:
            rows.append({
                'stock_code': code,
                'trade_date': trade_date,
                'per': per,
                'pbr': pbr,
                'eps': eps,
                'bps': bps,
                'div_yield': div_yield,
                'dps': None,
                'source': 'calc'
            })
            calc_count += 1
        else:
            skip_count += 1
    
    print(f"  계산 완료: {calc_count}개 종목")
    print(f"  건너뜀: {skip_count}개 (데이터 부족)")
    
    # Supabase 저장
    if rows:
        print(f"\n📦 Supabase 저장 중...")
        success, errors = batch_upsert(supabase, 'valuation', rows, 'stock_code,trade_date')
        print(f"  ✅ 저장 완료: {success}건 성공, {errors}건 오류")
    
    # 샘플 확인
    print(f"\n--- 계산 결과 샘플 ---")
    samples = ['005930', '000660', '068270', '105560', '035420']
    for code in samples:
        match = [r for r in rows if r['stock_code'] == code]
        if match:
            r = match[0]
            name_result = supabase.table('stocks').select('stock_name').eq('stock_code', code).execute()
            name = name_result.data[0]['stock_name'] if name_result.data else code
            print(f"  {name}({code}): PER={r['per']} PBR={r['pbr']} EPS={r['eps']} BPS={r['bps']}")
    
    print(f"\n{'=' * 60}")
    print(f"PER/PBR 계산 완료!")
    print(f"  ✅ 계산: {calc_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    calc_valuation()
