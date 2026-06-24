"""
시야 (Siya) — 결산월(settle_month) 백필 (TTM 로드맵 ②단계)

FDR StockListing('KRX-DESC').SettleMonth → stocks.settle_month 에 정규화 저장.
  · DART 0콜 (FDR만 사용).
  · 값 형식: 월 2자리 숫자 문자열 ('12월' → '12', '3월' → '03').
    compute_ttm.py 게이트(settle_month='12')와 형식 일치 — 여기 어긋나면 게이트가
    전부 false 나서 TTM이 0종목 되는 함정. 저장 직전 정규화로 통일한다.

선행: docs/migrate_stocks_settle_month.sql 을 Supabase SQL 에디터에서 적용(컬럼 추가).

실행:
    conda activate siya
    set PYTHONIOENCODING=utf-8
    python src/data/collectors/backfill_settle_month.py
"""

import os
import re
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

import FinanceDataReader as fdr
from utils import get_supabase, get_all_stocks

supabase = get_supabase()


def normalize_settle_month(raw):
    """FDR SettleMonth → 월 2자리 문자열. 게이트 비교값('12')과 통일.
    '12월'/'12'/'3월'/'03' 등 다양한 입력을 '12','03'으로. 미상 → None."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s or s.lower() == 'nan':
        return None
    m = re.search(r'(\d{1,2})', s)   # 숫자만 추출 ('월' 등 제거)
    if not m:
        return None
    month = int(m.group(1))
    if not (1 <= month <= 12):
        return None
    return f"{month:02d}"


def load_fdr_settle_months():
    """code -> 정규화 결산월. KRX-DESC의 SettleMonth 사용."""
    df = fdr.StockListing('KRX-DESC')
    out = {}
    for row in df.itertuples():
        code = str(getattr(row, 'Code', '')).strip()
        if len(code) != 6:
            continue
        out[code] = normalize_settle_month(getattr(row, 'SettleMonth', None))
    return out


def backfill():
    print("=" * 60)
    print("결산월(settle_month) 백필 시작 — FDR KRX-DESC (DART 0콜)")
    print("=" * 60)

    fdr_map = load_fdr_settle_months()
    nonnull = {c: m for c, m in fdr_map.items() if m}
    print(f"FDR 결산월 확보: {len(fdr_map)}종목 (유효 {len(nonnull)})")

    stocks_list = get_all_stocks(supabase)
    print(f"stocks 대상: {len(stocks_list)}종목\n")

    updated = 0
    missing = 0
    failed = 0
    dist = {}

    for s in stocks_list:
        code = s['stock_code']
        month = fdr_map.get(code)
        if month is None:
            missing += 1
        dist[month] = dist.get(month, 0) + 1
        try:
            supabase.table('stocks').update({'settle_month': month})\
                .eq('stock_code', code).execute()
            updated += 1
        except Exception as e:
            failed += 1
            if failed <= 5:
                print(f"  ❌ {s.get('stock_name')}({code}): {e}")

    print(f"\n{'=' * 60}")
    print(f"백필 완료")
    print(f"  ✅ 업데이트: {updated}종목")
    print(f"  ⚠️ FDR 결산월 미상(NULL 저장): {missing}종목")
    print(f"  ❌ 오류: {failed}종목")
    print(f"\n  결산월 분포(저장값 기준):")
    for k in sorted(dist, key=lambda x: (x is None, x)):
        label = k if k is not None else 'NULL(미상)'
        print(f"    {label}: {dist[k]}종목")
    nondec = sum(v for k, v in dist.items() if k not in ('12', None))
    print(f"\n  12월: {dist.get('12', 0)} / 비12월(NULL 제외): {nondec} / NULL: {dist.get(None, 0)}")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    backfill()
