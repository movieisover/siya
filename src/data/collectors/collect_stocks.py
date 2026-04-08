"""
시야 (Siya) — 종목 마스터 수집 스크립트
FinanceDataReader로 KOSPI + KOSDAQ 종목을 가져와서 Supabase에 저장

실행 방법:
  cd C:\projects\stock-analyzer
  pip install FinanceDataReader supabase python-dotenv
  python src/data/collectors/collect_stocks.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# 프로젝트 루트의 .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import FinanceDataReader as fdr
from supabase import create_client

# Supabase 연결 (service_role 키 사용 — RLS 바이패스)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ .env 파일에 SUPABASE_URL, SUPABASE_SERVICE_KEY를 설정하세요.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def collect_stocks():
    """KOSPI + KOSDAQ 종목 마스터 수집"""
    print("=" * 60)
    print(f"종목 마스터 수집 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    all_stocks = []

    for market in ['KOSPI', 'KOSDAQ']:
        print(f"\n📊 {market} 종목 수집 중...")
        df = fdr.StockListing(market)

        count = 0
        for _, row in df.iterrows():
            stock_code = str(row.get('Code', '')).strip()
            stock_name = str(row.get('Name', '')).strip()
            sector = str(row.get('Sector', '')).strip() if 'Sector' in row else None
            sector_code = str(row.get('Industry', '')).strip() if 'Industry' in row else None

            # 빈 코드/이름 건너뛰기
            if not stock_code or not stock_name:
                continue

            # 종목코드 6자리 확인
            if len(stock_code) != 6:
                continue

            all_stocks.append({
                'stock_code': stock_code,
                'stock_name': stock_name,
                'market': market,
                'sector': sector if sector and sector != 'nan' else None,
                'sector_code': sector_code if sector_code and sector_code != 'nan' else None,
                'is_active': True,
                'source': 'fdr',
            })
            count += 1

        print(f"  ✅ {market}: {count}개 종목")

    print(f"\n📦 총 {len(all_stocks)}개 종목 → Supabase 저장 중...")

    # 배치 단위로 upsert (500개씩)
    batch_size = 500
    success_count = 0
    error_count = 0

    for i in range(0, len(all_stocks), batch_size):
        batch = all_stocks[i:i + batch_size]
        try:
            result = supabase.table('stocks').upsert(
                batch,
                on_conflict='stock_code'
            ).execute()
            success_count += len(batch)
            print(f"  📤 {i + 1}~{i + len(batch)} 저장 완료")
        except Exception as e:
            error_count += len(batch)
            print(f"  ❌ {i + 1}~{i + len(batch)} 오류: {e}")

    print(f"\n{'=' * 60}")
    print(f"종목 마스터 수집 완료!")
    print(f"  ✅ 성공: {success_count}개")
    if error_count > 0:
        print(f"  ❌ 실패: {error_count}개")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    collect_stocks()
