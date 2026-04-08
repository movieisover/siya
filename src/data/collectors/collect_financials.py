"""
시야 (Siya) — 재무제표 수집 (financials)
OpenDartReader로 전 종목 3년치 재무제표를 Supabase에 저장
금액 단위: 백만원으로 변환 저장

실행: python src/data/collectors/collect_financials.py

참고: DART API 일 10,000건 제한 있음
"""

import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import OpenDartReader
from utils import get_supabase, get_all_stocks, get_collected_codes

supabase = get_supabase()
DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)

# 2025년 사업보고서 공시 완료 (2026년 4월 기준) → 3개년 2023~2025
YEARS = [2025, 2024, 2023]


def parse_amount(value):
    """문자열 금액 → 정수 변환"""
    if value is None or value == '' or value == '-':
        return None
    try:
        return int(str(value).replace(',', ''))
    except (ValueError, TypeError):
        return None


def to_million(value):
    """원 단위 → 백만원 단위 변환"""
    if value is None or value == 0:
        return None
    return int(value / 1_000_000)


def collect_financials():
    print("=" * 60)
    print(f"재무제표 수집 시작")
    print(f"대상 연도: {YEARS}")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)
    collected = get_collected_codes(supabase, 'financials')
    remaining = [s for s in stocks_list if s['stock_code'] not in collected]

    print(f"전체: {len(stocks_list)}개 / 이미 수집: {len(collected)}개 / 미수집: {len(remaining)}개\n")

    if not remaining:
        print("✅ 모든 종목 수집 완료!")
        return

    success_count = 0
    skip_count = 0
    error_count = 0
    api_calls = 0
    total = len(remaining)

    for i, s in enumerate(remaining):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 50 == 0 or i == 0:
            print(f"[{i+1}/{total}] {name}({code}) 수집 중...")

        stock_rows = []

        for year in YEARS:
            try:
                # DART API 출력 억제
                old_stdout = sys.stdout
                sys.stdout = open(os.devnull, 'w')
                try:
                    df = dart.finstate(code, year, reprt_code='11011')
                finally:
                    sys.stdout.close()
                    sys.stdout = old_stdout
                
                api_calls += 1

                # None 또는 빈 DataFrame 체크
                if df is None or (hasattr(df, 'empty') and df.empty):
                    continue

                # dict 반환 시 (에러 응답) 건너뛰기
                if isinstance(df, dict):
                    continue

                # 연결재무제표(CFS) 우선, 없으면 개별(OFS)
                fs_div = 'CFS' if 'CFS' in df['fs_div'].values else 'OFS'
                df_filtered = df[df['fs_div'] == fs_div]

                if df_filtered.empty:
                    continue

                # 주요 항목 추출
                def get_amount(keyword):
                    matches = df_filtered[df_filtered['account_nm'].str.contains(keyword, na=False)]
                    if not matches.empty:
                        raw = matches.iloc[0].get('thstrm_amount', None)
                        return parse_amount(raw)
                    return None

                revenue = get_amount('매출액') or get_amount('수익')
                operating_income = get_amount('영업이익')
                net_income = get_amount('당기순이익') or get_amount('당기순손익')
                total_assets = get_amount('자산총계')
                total_liabilities = get_amount('부채총계')
                total_equity = get_amount('자본총계')

                # 하나도 없으면 건너뛰기
                if not any([revenue, operating_income, net_income, total_assets]):
                    continue

                # 비율 계산
                roe = None
                roa = None
                debt_ratio = None
                op_margin = None

                if net_income and total_equity and total_equity != 0:
                    roe = round(net_income / total_equity * 100, 2)
                if net_income and total_assets and total_assets != 0:
                    roa = round(net_income / total_assets * 100, 2)
                if total_liabilities and total_equity and total_equity != 0:
                    debt_ratio = round(total_liabilities / total_equity * 100, 2)
                if operating_income and revenue and revenue != 0:
                    op_margin = round(operating_income / revenue * 100, 2)

                stock_rows.append({
                    'stock_code': code,
                    'fiscal_year': year,
                    'fiscal_quarter': 'FY',
                    'revenue': to_million(revenue),
                    'operating_income': to_million(operating_income),
                    'net_income': to_million(net_income),
                    'total_assets': to_million(total_assets),
                    'total_liabilities': to_million(total_liabilities),
                    'total_equity': to_million(total_equity),
                    'roe': roe,
                    'roa': roa,
                    'debt_ratio': debt_ratio,
                    'operating_margin': op_margin,
                    'source': 'dart'
                })

            except Exception as e:
                pass  # 우선주, SPAC 등은 조용히 건너뛰기

        if stock_rows:
            try:
                supabase.table('financials').upsert(
                    stock_rows,
                    on_conflict='stock_code,fiscal_year,fiscal_quarter'
                ).execute()
                success_count += 1
            except Exception as e:
                error_count += 1
        else:
            skip_count += 1

        # API 부하 방지
        if (i + 1) % 100 == 0:
            print(f"  ⏳ {i+1}/{total} 완료 (성공:{success_count} 건너뜀:{skip_count} API:{api_calls}건)")
            time.sleep(2)

        # DART API 일일 한도 체크
        if api_calls >= 9000:
            print(f"\n⚠️ DART API 일일 한도 근접 ({api_calls}건). 중단합니다.")
            print(f"   내일 다시 실행하면 이어서 수집합니다.")
            break

    print(f"\n{'=' * 60}")
    print(f"재무제표 수집 완료!")
    print(f"  ✅ 성공: {success_count}개 종목")
    print(f"  ⏭️ 건너뜀: {skip_count}개 (우선주/SPAC/데이터없음)")
    print(f"  ❌ 오류: {error_count}개")
    print(f"  📡 API 호출: {api_calls}건")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    collect_financials()
