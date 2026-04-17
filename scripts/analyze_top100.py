"""
시야 (Siya) — 시총 TOP 100 테마 매핑 현황 분석

목적:
  1. FDR에서 시가총액 상위 100개 종목 추출 (KOSPI + KOSDAQ 통합)
  2. Supabase에서 stock_themes 매핑 현황 확인
  3. 미매핑 종목을 업종별로 그룹화하여 출력
  4. 결과를 scripts/top100_analysis.md 파일로 저장

실행:
  python scripts/analyze_top100.py

환경:
  Anaconda Prompt → conda activate siya
"""

import os
import sys
from collections import defaultdict
from datetime import datetime

# 경로 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'src', 'data', 'collectors'))

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

import FinanceDataReader as fdr
from utils import get_supabase


def get_top_market_cap(n=100):
    """FDR에서 KOSPI + KOSDAQ 시총 상위 N개 추출"""
    print(f"📊 FDR에서 시장 전체 종목 로딩 중...")

    all_stocks = []
    for market in ['KOSPI', 'KOSDAQ']:
        df = fdr.StockListing(market)
        print(f"  {market}: {len(df)}개")
        for _, row in df.iterrows():
            code = str(row.get('Code', '')).strip()
            if len(code) != 6:
                continue
            marcap = row.get('Marcap', None)
            if not marcap or int(marcap) <= 0:
                continue
            all_stocks.append({
                'stock_code': code,
                'stock_name': row.get('Name', ''),
                'market': market,
                'marcap': int(marcap),
                'sector': row.get('Industry', '') or row.get('Sector', ''),
                'stocks': int(row.get('Stocks', 0)) if row.get('Stocks') else 0,
            })

    # 시총 내림차순 정렬
    all_stocks.sort(key=lambda x: x['marcap'], reverse=True)
    top_n = all_stocks[:n]

    print(f"  ✅ 시총 TOP {n} 추출 완료")
    print(f"  → 1위: {top_n[0]['stock_name']} ({top_n[0]['marcap']/1e12:.1f}조원)")
    print(f"  → {n}위: {top_n[-1]['stock_name']} ({top_n[-1]['marcap']/1e12:.1f}조원)")
    return top_n


def get_theme_mappings(supabase, stock_codes):
    """지정된 종목들의 테마 매핑 정보 조회"""
    print(f"\n📊 Supabase에서 테마 매핑 조회 중...")

    # 테마 이름 조회
    themes_result = supabase.table('themes').select('theme_id, theme_name, category').execute()
    theme_map = {t['theme_id']: t for t in themes_result.data}

    # stock_themes 조회 (종목 코드로 필터)
    mappings = defaultdict(list)  # stock_code -> [theme_name, ...]
    codes_list = list(stock_codes)

    # Supabase in 쿼리 한계(1000) 회피 - 100개씩 배치
    for i in range(0, len(codes_list), 100):
        batch = codes_list[i:i+100]
        result = supabase.table('stock_themes').select(
            'stock_code, theme_id'
        ).in_('stock_code', batch).execute()
        for row in result.data:
            theme_info = theme_map.get(row['theme_id'])
            if theme_info:
                mappings[row['stock_code']].append(theme_info['theme_name'])

    mapped_count = len(mappings)
    print(f"  ✅ 매핑 조회 완료: {mapped_count}/{len(stock_codes)} 매핑됨")
    return mappings, theme_map


def get_stock_sectors(supabase, stock_codes):
    """Supabase stocks 테이블에서 업종 정보 조회 (fdr보다 정확)"""
    print(f"\n📊 Supabase에서 업종 정보 조회 중...")
    sectors = {}
    codes_list = list(stock_codes)
    for i in range(0, len(codes_list), 100):
        batch = codes_list[i:i+100]
        result = supabase.table('stocks').select(
            'stock_code, stock_name, sector, market'
        ).in_('stock_code', batch).execute()
        for row in result.data:
            sectors[row['stock_code']] = row.get('sector') or ''
    return sectors


def write_report(top_stocks, mappings, db_sectors, out_path):
    """마크다운 리포트 작성"""
    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    lines = []
    lines.append(f"# 시총 TOP 100 테마 매핑 분석 리포트")
    lines.append(f"")
    lines.append(f"**생성 시각**: {now}")
    lines.append(f"**데이터 출처**: FDR (시가총액), Supabase (매핑 현황)")
    lines.append(f"")

    # 요약
    mapped = [s for s in top_stocks if s['stock_code'] in mappings]
    unmapped = [s for s in top_stocks if s['stock_code'] not in mappings]
    lines.append(f"## 📊 요약")
    lines.append(f"")
    lines.append(f"- **시총 TOP 100 중 테마 매핑 종목**: {len(mapped)}개 ({len(mapped)}%)")
    lines.append(f"- **시총 TOP 100 중 미매핑 종목**: {len(unmapped)}개 ({len(unmapped)}%)")
    lines.append(f"")

    # 매핑 현황 테이블
    lines.append(f"## ✅ 매핑된 종목 ({len(mapped)}개)")
    lines.append(f"")
    lines.append(f"| 순위 | 종목코드 | 종목명 | 시총(조) | 업종 | 매핑 테마 |")
    lines.append(f"|------|---------|--------|---------|------|-----------|")
    for i, s in enumerate(top_stocks):
        if s['stock_code'] not in mappings:
            continue
        rank = i + 1
        marcap_t = s['marcap'] / 1e12
        sector = db_sectors.get(s['stock_code']) or s.get('sector', '')
        themes_str = ', '.join(mappings[s['stock_code']])
        lines.append(f"| {rank} | {s['stock_code']} | {s['stock_name']} | {marcap_t:.1f} | {sector} | {themes_str} |")
    lines.append(f"")

    # 미매핑 종목 테이블
    lines.append(f"## ❌ 미매핑 종목 ({len(unmapped)}개)")
    lines.append(f"")
    lines.append(f"시총 TOP 100 중 테마에 매핑되지 않은 종목들. 신규 테마 추가 또는 기존 테마 재분류 검토 필요.")
    lines.append(f"")
    lines.append(f"| 순위 | 종목코드 | 종목명 | 시총(조) | 시장 | 업종 |")
    lines.append(f"|------|---------|--------|---------|------|------|")
    for i, s in enumerate(top_stocks):
        if s['stock_code'] in mappings:
            continue
        rank = i + 1
        marcap_t = s['marcap'] / 1e12
        sector = db_sectors.get(s['stock_code']) or s.get('sector', '')
        lines.append(f"| {rank} | {s['stock_code']} | {s['stock_name']} | {marcap_t:.1f} | {s['market']} | {sector} |")
    lines.append(f"")

    # 미매핑 종목 업종별 그룹화
    lines.append(f"## 🏷️ 미매핑 종목 — 업종별 그룹")
    lines.append(f"")
    sector_groups = defaultdict(list)
    for s in unmapped:
        sector = db_sectors.get(s['stock_code']) or s.get('sector', '') or '(업종미상)'
        sector_groups[sector].append(s)

    # 업종별로 정렬 (종목 수 내림차순)
    for sector, stocks in sorted(sector_groups.items(), key=lambda x: -len(x[1])):
        lines.append(f"### {sector} ({len(stocks)}개)")
        lines.append(f"")
        for s in stocks:
            rank = top_stocks.index(s) + 1
            marcap_t = s['marcap'] / 1e12
            lines.append(f"- **{rank}위** {s['stock_name']} ({s['stock_code']}) - {marcap_t:.1f}조 [{s['market']}]")
        lines.append(f"")

    # 파일 저장
    content = '\n'.join(lines)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n📝 리포트 저장: {out_path}")
    return content


def main():
    print("=" * 60)
    print("시총 TOP 100 테마 매핑 분석")
    print("=" * 60)

    supabase = get_supabase()

    # 1. 시총 상위 100 추출
    top_stocks = get_top_market_cap(100)

    # 2. 매핑 현황 조회
    stock_codes = {s['stock_code'] for s in top_stocks}
    mappings, theme_map = get_theme_mappings(supabase, stock_codes)

    # 3. DB 업종 정보 조회
    db_sectors = get_stock_sectors(supabase, stock_codes)

    # 4. 콘솔 요약 출력
    mapped_count = len(mappings)
    unmapped_count = len(top_stocks) - mapped_count
    print(f"\n{'='*60}")
    print(f"📊 요약")
    print(f"{'='*60}")
    print(f"  ✅ 매핑: {mapped_count}/100개")
    print(f"  ❌ 미매핑: {unmapped_count}/100개")
    print(f"")

    # 5. 미매핑 종목 빠른 리스트 (콘솔)
    print(f"❌ 미매핑 종목 (시총 순):")
    for i, s in enumerate(top_stocks):
        if s['stock_code'] in mappings:
            continue
        rank = i + 1
        marcap_t = s['marcap'] / 1e12
        sector = db_sectors.get(s['stock_code']) or s.get('sector', '') or '-'
        print(f"  {rank:3}위 | {s['stock_code']} | {s['stock_name']:20} | {marcap_t:5.1f}조 | {sector}")

    # 6. 마크다운 리포트 저장
    out_path = os.path.join(SCRIPT_DIR, 'top100_analysis.md')
    write_report(top_stocks, mappings, db_sectors, out_path)

    print(f"\n{'='*60}")
    print(f"✅ 분석 완료!")
    print(f"  상세 리포트: scripts/top100_analysis.md")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
