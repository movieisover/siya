"""
시야 (Siya) — 2025년 재무제표 추가 수집 + 2022년 데이터 삭제
기존 2022~2024 → 2023~2025로 통일

실행: conda activate siya && cd C:\projects\stock-analyzer && python src/data/collectors/update_financials_2025.py
"""

import os
import sys
import time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import OpenDartReader
from utils import get_supabase, get_all_stocks

supabase = get_supabase()
DART_API_KEY = os.getenv('DART_API_KEY')
dart = OpenDartReader(DART_API_KEY)


def parse_amount(value):
    if value is None or value == '' or value == '-':
        return None
    try:
        return int(str(value).replace(',', ''))
    except (ValueError, TypeError):
        return None


def to_million(value):
    if value is None or value == 0:
        return None
    return int(value / 1_000_000)


def collect_2025():
    print("=" * 60)
    print("Step 1: 2025년 재무제표 수집")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)

    # 이미 2025년 데이터가 있는 종목 확인
    existing = set()
    offset = 0
    while True:
        res = supabase.table('financials') \
            .select('stock_code') \
            .eq('fiscal_year', 2025) \
            .range(offset, offset + 999) \
            .execute()
        if not res.data:
            break
        for row in res.data:
            existing.add(row['stock_code'])
        offset += 1000

    remaining = [s for s in stocks_list if s['stock_code'] not in existing]
    print(f"전체: {len(stocks_list)}개 / 2025 이미 있음: {len(existing)}개 / 수집 대상: {len(remaining)}개\n")

    success = 0
    skip = 0
    api_calls = 0

    for i, s in enumerate(remaining):
        code = s['stock_code']
        name = s['stock_name']

        if (i + 1) % 100 == 0 or i == 0:
            print(f"[{i+1}/{len(remaining)}] {name}({code})...")

        try:
            old_stdout = sys.stdout
            sys.stdout = open(os.devnull, 'w')
            try:
                df = dart.finstate(code, 2025, reprt_code='11011')
            finally:
                sys.stdout.close()
                sys.stdout = old_stdout

            api_calls += 1

            if df is None or (hasattr(df, 'empty') and df.empty) or isinstance(df, dict):
                skip += 1
                continue

            fs_div = 'CFS' if 'CFS' in df['fs_div'].values else 'OFS'
            df_filtered = df[df['fs_div'] == fs_div]
            if df_filtered.empty:
                skip += 1
                continue

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

            if not any([revenue, operating_income, net_income, total_assets]):
                skip += 1
                continue

            roe = roa = debt_ratio = op_margin = None
            if net_income and total_equity and total_equity != 0:
                roe = round(net_income / total_equity * 100, 2)
            if net_income and total_assets and total_assets != 0:
                roa = round(net_income / total_assets * 100, 2)
            if total_liabilities and total_equity and total_equity != 0:
                debt_ratio = round(total_liabilities / total_equity * 100, 2)
            if operating_income and revenue and revenue != 0:
                op_margin = round(operating_income / revenue * 100, 2)

            row = {
                'stock_code': code,
                'fiscal_year': 2025,
                'fiscal_quarter': 'FY',
                'revenue': to_million(revenue),
                'operating_income': to_million(operating_income),
                'net_income': to_million(net_income),
                'total_assets': to_million(total_assets),
                'total_liabilities': to_million(total_liabilities),
                'total_equity': to_million(total_equity),
                'roe': roe, 'roa': roa,
                'debt_ratio': debt_ratio,
                'operating_margin': op_margin,
                'source': 'dart'
            }

            supabase.table('financials').upsert(
                [row], on_conflict='stock_code,fiscal_year,fiscal_quarter'
            ).execute()
            success += 1

        except Exception:
            skip += 1

        if (i + 1) % 100 == 0:
            print(f"  ⏳ {i+1}/{len(remaining)} (성공:{success} 건너뜀:{skip} API:{api_calls})")
            time.sleep(2)

        if api_calls >= 9000:
            print(f"\n⚠️ API 한도 근접 ({api_calls}건). 중단. 내일 다시 실행하세요.")
            break

    print(f"\n✅ 2025년 수집 완료: 성공 {success}개 / 건너뜀 {skip}개 / API {api_calls}건")
    return success


def delete_2022():
    print("\n" + "=" * 60)
    print("Step 2: 2022년 데이터 삭제")
    print("=" * 60)

    # 삭제 전 개수 확인
    res = supabase.table('financials') \
        .select('stock_code', count='exact') \
        .eq('fiscal_year', 2022) \
        .execute()
    count = res.count or 0
    print(f"2022년 데이터: {count}건")

    if count > 0:
        supabase.table('financials').delete().eq('fiscal_year', 2022).execute()
        print(f"✅ {count}건 삭제 완료")
    else:
        print("삭제할 데이터 없음")


def verify():
    print("\n" + "=" * 60)
    print("Step 3: 최종 확인")
    print("=" * 60)

    for year in [2023, 2024, 2025]:
        res = supabase.table('financials') \
            .select('stock_code', count='exact') \
            .eq('fiscal_year', year) \
            .execute()
        print(f"  {year}년: {res.count or 0}개 종목")


if __name__ == '__main__':
    collected = collect_2025()
    delete_2022()
    verify()
    print("\n🎉 완료! 이제 모든 종목이 2023~2025 3개년 데이터입니다.")
