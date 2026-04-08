"""
시야 (Siya) — 종목 업종(sector) 데이터 업데이트 스크립트 v2
KRX 업종분류 데이터를 가져와 stocks 테이블 업데이트

실행 방법:
  Anaconda Prompt에서:
  conda activate siya
  cd C:\projects\stock-analyzer
  python src/data/collectors/update_sector.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import requests
from io import BytesIO

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import pandas as pd
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ .env 파일에 SUPABASE_URL, SUPABASE_SERVICE_KEY를 설정하세요.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def fetch_krx_sector(market_id):
    """KRX에서 업종분류 데이터 직접 조회"""
    url = 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd'
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd',
    }
    params = {
        'bld': 'dbms/MDC/STAT/standard/MDCSTAT03901',
        'locale': 'ko_KR',
        'mktId': market_id,  # 'STK' = KOSPI, 'KSQ' = KOSDAQ
        'trdDd': datetime.now().strftime('%Y%m%d'),
        'money': '1',
        'csvxls_is498': 'false',
        'share': '1',
    }
    
    try:
        resp = requests.post(url, data=params, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        if 'OutBlock_1' in data:
            return data['OutBlock_1']
        elif 'output' in data:
            return data['output']
        else:
            # 키 확인
            print(f"    응답 키: {list(data.keys())}")
            # 첫 번째 리스트 형태 값 반환
            for key, val in data.items():
                if isinstance(val, list) and len(val) > 0:
                    return val
            return []
    except Exception as e:
        print(f"    ❌ KRX 조회 실패: {e}")
        return []


def try_krx_direct():
    """방법 1: KRX 직접 조회"""
    print("\n🔍 방법 1: KRX 업종분류 직접 조회...")
    
    sector_map = {}
    
    for market_name, market_id in [('KOSPI', 'STK'), ('KOSDAQ', 'KSQ')]:
        print(f"\n  📊 {market_name} 업종 조회 중...")
        items = fetch_krx_sector(market_id)
        
        if items:
            print(f"    {len(items)}개 종목")
            if len(items) > 0:
                print(f"    필드: {list(items[0].keys())}")
                # 업종명 필드 찾기
                sample = items[0]
                for key, val in sample.items():
                    print(f"      {key}: {val}")
                
                # 종목코드와 업종 매핑
                for item in items:
                    code = None
                    sector = None
                    
                    # 종목코드 필드 탐색
                    for code_key in ['ISU_SRT_CD', 'TKR_ISIN', 'ISU_CD', 'SHOTN_ISIN', 'trdDd']:
                        if code_key in item and item[code_key]:
                            val = str(item[code_key]).strip()
                            if len(val) == 6 and val.isdigit():
                                code = val
                                break
                    
                    # 업종명 필드 탐색
                    for sector_key in ['IDX_IND_NM', 'SECT_TP_NM', 'IDX_NM', 'INDUSTRY_NM', 'IND_NM']:
                        if sector_key in item and item[sector_key]:
                            sector = str(item[sector_key]).strip()
                            if sector and sector != 'nan':
                                break
                    
                    if code and sector:
                        sector_map[code] = sector
        else:
            print(f"    ⚠️ 데이터 없음")
    
    return sector_map


def try_fdr_detail():
    """방법 2: FinanceDataReader 상세 리스팅"""
    import FinanceDataReader as fdr
    
    print("\n🔍 방법 2: FinanceDataReader 다양한 리스팅 시도...")
    
    sector_map = {}
    
    # 여러 리스팅 타입 시도
    for listing_type in ['KRX-DESC', 'KRX-MARCAP', 'KOSPI', 'KOSDAQ']:
        try:
            print(f"\n  📊 fdr.StockListing('{listing_type}') 시도...")
            df = fdr.StockListing(listing_type)
            print(f"    {len(df)}행, 컬럼: {list(df.columns)}")
            
            # Sector/Industry 관련 컬럼 찾기
            for col in df.columns:
                unique = df[col].nunique()
                if 10 < unique < 200:
                    sample = df[col].dropna().unique()[:3]
                    # 한글이 포함된 경우 업종 후보
                    has_korean = any(any('\uac00' <= c <= '\ud7a3' for c in str(v)) for v in sample)
                    if has_korean:
                        print(f"    ✅ 업종 후보 발견! '{col}' ({unique}개): {sample.tolist()}")
                        
                        # Code 컬럼 찾기
                        code_col = None
                        for cc in ['Code', 'Symbol', 'code']:
                            if cc in df.columns:
                                code_col = cc
                                break
                        
                        if code_col:
                            for _, row in df.iterrows():
                                code = str(row.get(code_col, '')).strip()
                                sector = str(row.get(col, '')).strip()
                                if code and sector and sector != 'nan' and len(code) == 6:
                                    sector_map[code] = sector
                            
                            if sector_map:
                                print(f"    ✅ {len(sector_map)}개 매핑 완료!")
                                return sector_map
        except Exception as e:
            print(f"    ⚠️ {listing_type} 실패: {e}")
    
    return sector_map


def try_pykrx_sector():
    """방법 3: pykrx 업종 조회 (기본 함수는 정상일 수 있음)"""
    print("\n🔍 방법 3: pykrx 업종 조회 시도...")
    
    try:
        from pykrx import stock
        
        # get_market_ticker_list는 정상 작동할 수 있음
        tickers = stock.get_market_ticker_list(market='ALL')
        print(f"  pykrx 티커 수: {len(tickers)}")
        
        sector_map = {}
        count = 0
        for ticker in tickers[:5]:  # 먼저 5개만 테스트
            try:
                name = stock.get_market_ticker_name(ticker)
                # pykrx에서 업종 정보 가져오기 시도
                # get_stock_info는 없을 수 있음
                print(f"  {ticker}: {name}")
                count += 1
            except Exception as e:
                print(f"  {ticker}: 오류 - {e}")
                break
        
        if count == 0:
            print("  ⚠️ pykrx 업종 조회 불가")
            return {}
            
    except ImportError:
        print("  ⚠️ pykrx 미설치")
        return {}
    except Exception as e:
        print(f"  ⚠️ pykrx 오류: {e}")
        return {}
    
    return {}


def update_db(sector_map):
    """Supabase stocks 테이블 업데이트"""
    if not sector_map:
        print("\n❌ 업종 데이터가 없어서 업데이트할 수 없습니다.")
        return
    
    print(f"\n🔄 Supabase 업데이트: {len(sector_map)}개 종목...")
    
    # 샘플 출력
    samples = list(sector_map.items())[:5]
    for code, sector in samples:
        print(f"  {code}: {sector}")
    
    updated = 0
    errors = 0
    
    items = list(sector_map.items())
    for i, (code, sector) in enumerate(items):
        try:
            supabase.table('stocks').update(
                {'sector': sector}
            ).eq('stock_code', code).execute()
            updated += 1
            
            if (i + 1) % 200 == 0:
                print(f"  ✅ {updated}/{len(items)} 업데이트 완료")
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"  ❌ {code} 오류: {e}")
    
    print(f"\n{'=' * 60}")
    print(f"업종 데이터 업데이트 완료!")
    print(f"  ✅ 성공: {updated}개")
    if errors > 0:
        print(f"  ❌ 실패: {errors}개")
    
    # 검증
    result = supabase.table('stocks').select('stock_code, stock_name, sector').eq('stock_code', '005930').execute()
    if result.data:
        print(f"  삼성전자 sector: {result.data[0].get('sector')}")
    
    print(f"{'=' * 60}")


def main():
    print("=" * 60)
    print(f"종목 업종 데이터 업데이트 v2: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 방법 1: KRX 직접
    sector_map = try_krx_direct()
    
    # 방법 2: FDR 상세
    if not sector_map:
        sector_map = try_fdr_detail()
    
    # 방법 3: pykrx
    if not sector_map:
        sector_map = try_pykrx_sector()
    
    # 업데이트
    update_db(sector_map)


if __name__ == '__main__':
    main()
