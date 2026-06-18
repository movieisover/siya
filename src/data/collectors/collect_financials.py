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


# DART 전체 재무제표(finstate_all)는 회사마다 계정 한글명이 다르므로
# XBRL 표준 account_id로 매칭한다(이름은 fallback). (2026-06-18 지배주주 기준 전환)
def extract_financials(df):
    """
    finstate_all 결과(단일 fs_div로 필터링됨) → 주요 계정 dict (원 단위).
    손익 항목은 sj_div IS/CIS에서, 재무상태표 항목은 BS에서만 찾는다
    (자본변동표 SCE 등에 같은 계정이 중복 등장하므로 구간 제한 필수).
    """
    is_rows = df[df['sj_div'].isin(['IS', 'CIS'])]
    bs_rows = df[df['sj_div'] == 'BS']

    def by_id(rows, account_id):
        m = rows[rows['account_id'] == account_id]
        if not m.empty:
            return parse_amount(m.iloc[0].get('thstrm_amount'))
        return None

    def by_name(rows, keyword):
        # 계정명에 괄호 등 정규식 특수문자가 있어 regex=False(리터럴 부분일치) 사용
        m = rows[rows['account_nm'].str.contains(keyword, na=False, regex=False)]
        if not m.empty:
            return parse_amount(m.iloc[0].get('thstrm_amount'))
        return None

    revenue = (by_id(is_rows, 'ifrs-full_Revenue')
               or by_name(is_rows, '매출액') or by_name(is_rows, '수익'))
    operating_income = (by_id(is_rows, 'dart_OperatingIncomeLoss')
                        or by_id(is_rows, 'ifrs-full_ProfitLossFromOperatingActivities')
                        or by_name(is_rows, '영업이익'))
    net_income = (by_id(is_rows, 'ifrs-full_ProfitLoss')
                  or by_name(is_rows, '당기순이익') or by_name(is_rows, '당기순손익'))
    net_income_owners = by_id(is_rows, 'ifrs-full_ProfitLossAttributableToOwnersOfParent')

    total_assets = by_id(bs_rows, 'ifrs-full_Assets') or by_name(bs_rows, '자산총계')
    total_liabilities = by_id(bs_rows, 'ifrs-full_Liabilities') or by_name(bs_rows, '부채총계')
    total_equity = by_id(bs_rows, 'ifrs-full_Equity') or by_name(bs_rows, '자본총계')
    equity_owners = by_id(bs_rows, 'ifrs-full_EquityAttributableToOwnersOfParent')

    # 개별재무제표(OFS) 등 지배/비지배 분리가 없으면 전체값으로 대체
    if net_income_owners is None:
        net_income_owners = net_income
    if equity_owners is None:
        equity_owners = total_equity

    return {
        'revenue': revenue,
        'operating_income': operating_income,
        'net_income': net_income,
        'net_income_owners': net_income_owners,
        'total_assets': total_assets,
        'total_liabilities': total_liabilities,
        'total_equity': total_equity,
        'equity_owners': equity_owners,
    }


def get_codes_with_owners(supabase):
    """net_income_owners(지배주주 순이익)가 이미 채워진 종목 코드 집합 (재수집 재개용)."""
    codes = set()
    offset = 0
    while True:
        res = supabase.table('financials').select('stock_code')\
            .not_.is_('net_income_owners', 'null').range(offset, offset + 999).execute()
        for r in res.data:
            codes.add(r['stock_code'])
        if len(res.data) < 1000:
            break
        offset += 1000
    return codes


def collect_financials(remigrate=False):
    print("=" * 60)
    print(f"재무제표 수집 시작" + ("  [재수집: 지배주주 컬럼]" if remigrate else ""))
    print(f"대상 연도: {YEARS}")
    print("=" * 60)

    stocks_list = get_all_stocks(supabase)
    if remigrate:
        # 지배주주 컬럼이 아직 없는 종목만 (중단/재개 가능)
        done = get_codes_with_owners(supabase)
        remaining = [s for s in stocks_list if s['stock_code'] not in done]
        print(f"전체: {len(stocks_list)}개 / 지배주주 완료: {len(done)}개 / 남음: {len(remaining)}개\n")
    else:
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
                # 연결재무제표(CFS) 우선, 없으면 개별(OFS).
                # finstate_all(전체 재무제표)을 써야 지배주주 순이익/지분이 포함됨.
                df_filtered = None
                for fs_div in ('CFS', 'OFS'):
                    old_stdout = sys.stdout
                    sys.stdout = open(os.devnull, 'w')
                    try:
                        df = dart.finstate_all(code, year, reprt_code='11011', fs_div=fs_div)
                    finally:
                        sys.stdout.close()
                        sys.stdout = old_stdout
                    api_calls += 1

                    if df is None or isinstance(df, dict) or (hasattr(df, 'empty') and df.empty):
                        continue
                    df_filtered = df
                    break  # 사용 가능한 fs_div 확보

                if df_filtered is None or df_filtered.empty:
                    continue

                # 주요 항목 추출 (account_id 기반, 지배주주 분 포함)
                acc = extract_financials(df_filtered)
                revenue = acc['revenue']
                operating_income = acc['operating_income']
                net_income = acc['net_income']
                net_income_owners = acc['net_income_owners']
                total_assets = acc['total_assets']
                total_liabilities = acc['total_liabilities']
                total_equity = acc['total_equity']
                equity_owners = acc['equity_owners']

                # 하나도 없으면 건너뛰기
                if not any([revenue, operating_income, net_income, total_assets]):
                    continue

                # 비율 계산 (지배주주 기준 — 네이버/증권사 표준)
                roe = None
                roa = None
                debt_ratio = None
                op_margin = None

                # ROE = 지배주주 순이익 / 지배주주지분
                if net_income_owners and equity_owners and equity_owners != 0:
                    roe = round(net_income_owners / equity_owners * 100, 2)
                # ROA = 전체 순이익 / 전체 자산 (총자산수익률은 전체 기준 유지)
                if net_income and total_assets and total_assets != 0:
                    roa = round(net_income / total_assets * 100, 2)
                # 부채비율 = 부채총계 / 자본총계(전체) — 전체 자본 기준 유지
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
                    'net_income_owners': to_million(net_income_owners),
                    'total_assets': to_million(total_assets),
                    'total_liabilities': to_million(total_liabilities),
                    'total_equity': to_million(total_equity),
                    'equity_owners': to_million(equity_owners),
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
    import argparse
    parser = argparse.ArgumentParser(description='재무제표 수집')
    parser.add_argument('--remigrate', action='store_true',
                        help='지배주주 컬럼(net_income_owners) 미수집 종목만 재수집 (재개 가능)')
    args = parser.parse_args()
    collect_financials(remigrate=args.remigrate)
