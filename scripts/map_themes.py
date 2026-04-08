"""
시야 (Siya) — 업종 데이터 수집 + 테마 매핑
pykrx의 업종별 종목 분류를 이용하여 stocks 테이블 업데이트 + stock_themes 매핑

실행: python scripts/map_themes.py
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from pykrx import stock
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 최근 거래일 찾기 (오늘이 휴장이면 이전 거래일)
def get_recent_trading_date():
    today = datetime.today()
    for i in range(7):
        d = (today - timedelta(days=i)).strftime('%Y%m%d')
        try:
            tickers = stock.get_market_ticker_list(d, market='KOSPI')
            if len(tickers) > 0:
                return d
        except:
            continue
    return today.strftime('%Y%m%d')

date = get_recent_trading_date()
print(f"기준일: {date}")

# ============================================================
# Step 1: pykrx에서 업종별 종목 분류 가져오기
# ============================================================
print("\n" + "=" * 60)
print("Step 1: 업종별 종목 분류 수집")
print("=" * 60)

sector_map = {}  # stock_code -> sector_name

for market in ['KOSPI', 'KOSDAQ']:
    print(f"\n📊 {market} 업종 수집 중...")
    try:
        # 업종별 시세 가져오기 — 여기서 업종 정보 추출
        df = stock.get_market_ohlcv_by_ticker(date, market=market)
        tickers = df.index.tolist()
        
        # 각 종목의 업종 확인 (pykrx 기본 제공)
        for ticker in tickers:
            try:
                name = stock.get_market_ticker_name(ticker)
                sector_map[ticker] = {'name': name}
            except:
                pass
    except Exception as e:
        print(f"  오류: {e}")

# 업종 인덱스에서 종목 구성 가져오기
print("\n📋 KRX 업종 인덱스에서 종목 분류 수집 중...")
for market_code in ['KOSPI', 'KOSDAQ']:
    try:
        # 업종 인덱스 목록
        indices = stock.get_index_ticker_list(date, market=market_code)
        print(f"\n  {market_code} 업종 인덱스: {len(indices)}개")
        
        for idx_ticker in indices:
            idx_name = stock.get_index_ticker_name(idx_ticker)
            
            # 해당 업종에 속한 종목들
            try:
                components = stock.get_index_portfolio_deposit_file(idx_ticker, date)
                for stock_code in components:
                    if stock_code in sector_map:
                        sector_map[stock_code]['sector'] = idx_name
                    else:
                        sector_map[stock_code] = {'sector': idx_name}
                
                if len(components) > 0:
                    print(f"    {idx_name}: {len(components)}개 종목")
            except:
                pass
    except Exception as e:
        print(f"  {market_code} 인덱스 오류: {e}")

# 업종 데이터가 있는 종목 수 확인
stocks_with_sector = {k: v for k, v in sector_map.items() if 'sector' in v}
print(f"\n✅ 업종 데이터가 있는 종목: {len(stocks_with_sector)}개")

# 고유 업종 목록
unique_sectors = set(v['sector'] for v in stocks_with_sector.values())
print(f"고유 업종 수: {len(unique_sectors)}")
print("\n--- 업종 목록 ---")
for s in sorted(unique_sectors):
    count = sum(1 for v in stocks_with_sector.values() if v['sector'] == s)
    print(f"  {s}: {count}개")

# ============================================================
# Step 2: stocks 테이블에 sector 업데이트
# ============================================================
print("\n" + "=" * 60)
print("Step 2: stocks 테이블 sector 업데이트")
print("=" * 60)

update_count = 0
for stock_code, info in stocks_with_sector.items():
    try:
        supabase.table('stocks').update({
            'sector': info['sector']
        }).eq('stock_code', stock_code).execute()
        update_count += 1
    except Exception as e:
        pass

print(f"✅ {update_count}개 종목 sector 업데이트 완료")

# ============================================================
# Step 3: 업종 → 테마 매핑 규칙
# ============================================================
print("\n" + "=" * 60)
print("Step 3: 업종 → 테마 매핑")
print("=" * 60)

# KRX 업종 → 시야 테마 매핑 규칙
# 하나의 업종이 여러 테마에 매핑될 수 있음
SECTOR_TO_THEME = {
    # 첨단기술
    '반도체': ['AI/반도체'],
    '전기전자': ['AI/반도체'],
    'IT부품': ['AI/반도체'],
    'IT하드웨어': ['AI/반도체'],
    '소프트웨어': ['AI/반도체'],
    'IT': ['AI/반도체'],
    '기계': ['로봇/자동화'],
    '기계·장비': ['로봇/자동화'],
    '운송장비·부품': ['우주항공'],
    
    # 에너지/소재
    '전기장비': ['2차전지', '신재생에너지'],
    '에너지장비·서비스': ['신재생에너지', '수소경제'],
    '화학': ['2차전지', '희토류'],
    '비금속': ['희토류'],
    '철강': ['희토류'],
    '철강·금속': ['희토류'],
    
    # 바이오/헬스
    '의약품': ['바이오/제약'],
    '의료·정밀기기': ['의료기기', '디지털헬스'],
    '의료정밀': ['의료기기'],
    '제약': ['바이오/제약'],
    '바이오': ['바이오/제약', '디지털헬스'],
    
    # 산업/방산
    '조선': ['조선/해운'],
    '해운': ['조선/해운'],
    '운수창고': ['조선/해운'],
    '운송': ['조선/해운'],
    '건설': ['건설/인프라'],
    '건설업': ['건설/인프라'],
    '전기·가스': ['원자력', '신재생에너지'],
    '전기가스': ['원자력', '신재생에너지'],
    '유틸리티': ['원자력', '신재생에너지'],
    
    # 금융/소비
    '금융': ['금융/핀테크'],
    '은행': ['금융/핀테크'],
    '보험': ['금융/핀테크'],
    '증권': ['금융/핀테크'],
    '기타금융': ['금융/핀테크'],
    '디지털콘텐츠': ['게임/엔터'],
    '오락·문화': ['게임/엔터'],
    '서비스업': ['게임/엔터'],
    '부동산': ['리츠/부동산'],
    '화장품': ['화장품/K뷰티'],
    '생활용품': ['화장품/K뷰티'],
}

# 테마 ID 조회
themes_result = supabase.table('themes').select('theme_id, theme_name').execute()
theme_name_to_id = {t['theme_name']: t['theme_id'] for t in themes_result.data}
print(f"등록된 테마: {len(theme_name_to_id)}개")

# 매핑 실행
mapping_count = 0
mapped_stocks = set()

for stock_code, info in stocks_with_sector.items():
    sector = info['sector']
    
    # 매핑 규칙에서 테마 찾기
    if sector in SECTOR_TO_THEME:
        theme_names = SECTOR_TO_THEME[sector]
        for theme_name in theme_names:
            if theme_name in theme_name_to_id:
                theme_id = theme_name_to_id[theme_name]
                try:
                    supabase.table('stock_themes').upsert({
                        'stock_code': stock_code,
                        'theme_id': theme_id,
                        'mapped_by': 'auto'
                    }, on_conflict='stock_code,theme_id').execute()
                    mapping_count += 1
                    mapped_stocks.add(stock_code)
                except Exception as e:
                    pass

print(f"\n✅ 매핑 완료: {mapping_count}건 (중복 포함)")
print(f"✅ 매핑된 고유 종목 수: {len(mapped_stocks)}개")

# 테마별 종목 수 확인
print("\n--- 테마별 종목 수 ---")
for theme_name, theme_id in sorted(theme_name_to_id.items()):
    result = supabase.table('stock_themes').select('stock_code', count='exact').eq('theme_id', theme_id).execute()
    count = result.count if result.count else 0
    print(f"  {theme_name}: {count}개")

print(f"\n💡 자동 매핑되지 않은 테마(방위산업, 양자컴퓨팅, 고령화/실버 등)는")
print(f"   수동으로 종목을 추가해야 합니다.")
print(f"   → 다음 단계에서 수동 매핑 진행 예정")
