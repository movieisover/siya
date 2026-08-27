"""
시야 (Siya) — 종목 상태(관리종목·거래정지 등) 일별 스냅샷 수집

배제 게이트 B-2 ①단계. KIS 주식현재가(FHKST01010100) 응답의 상태 플래그를
매일 한 번 훑어 stock_status 테이블에 (stock_code, snapshot_date)로 업서트한다.

수집 필드 — 전부 **KIS 원값 그대로**(해석/판정 금지, 답변서 §6):
  · iscd_stat_cls_code : 00그외 51관리 52투자위험 53투자경고 54투자주의
                         55신용가능 57증거금100% 58거래정지 59단기과열
  · mang_issu_cls_code : 관리종목 Y/N
  · mrkt_warn_cls_code : 00없음 01주의 02경고 03위험
  · sltr_yn            : 정리매매 Y/N
  · short_over_yn      : 단기과열 Y/N

⚠️ 이 엔드포인트는 daily_update의 기존 호출(일봉 FHKST03010100 / 수급 FHKST01010900)과
   **다른 엔드포인트다.** 두 응답 모두 상태 플래그를 담고 있지 않아(2026-08-27 실측)
   종목당 1콜을 별도로 써야 한다. 전종목 기준 약 19분.

핵심 로직은 update_stock_status()에 있으며 daily_update.py에서도 재사용한다
(단일 출처 유지). 이 파일을 직접 실행하면 CLI로 동작한다.

옵션:
  (기본)          : 전 종목 수집
  --limit N       : 앞에서 N종목만 (스모크 테스트)
  --codes A,B,C   : 특정 종목코드만
  --flagged       : 수집 후 플래그가 선 종목 상세 출력

실행: python src/data/collectors/collect_stock_status.py [옵션]
"""

import os
import argparse
from datetime import datetime

from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)

from kis_api import kis_get

# 상태 코드 → 사람이 읽는 이름. **저장하지 않는다** — 로그 출력 전용.
# (DB에는 원값만 들어간다. 해석은 소비자 몫)
_STAT_LABEL = {
    '00': '그외', '51': '관리종목', '52': '투자위험', '53': '투자경고', '54': '투자주의',
    '55': '신용가능', '57': '증거금100%', '58': '거래정지', '59': '단기과열',
}
_WARN_LABEL = {'01': '시장경고:주의', '02': '시장경고:경고', '03': '시장경고:위험'}

# 로그에 눈에 띄게 찍을 값들 ('배제 판정'이 아니라 '눈에 띄는 상태'의 표시)
_NOTABLE_STAT = {'51', '52', '53', '58'}
_NOTABLE_WARN = {'01', '02', '03'}


def _default_executor(query):
    return query.execute()


def _fetch_all_stocks(sb, executor):
    """전 종목 코드/이름 (페이지네이션)"""
    rows = []
    offset = 0
    while True:
        res = executor(sb.table('stocks')
                         .select('stock_code, stock_name')
                         .range(offset, offset + 999))
        rows.extend(res.data)
        if len(res.data) < 1000:
            break
        offset += 1000
    return rows


def is_notable(row):
    """로그로 드러낼 만한 상태인지. **배제 판정 아님** — 출력용 헬퍼."""
    return (row.get('mang_issu_cls_code') == 'Y'
            or row.get('sltr_yn') == 'Y'
            or row.get('iscd_stat_cls_code') in _NOTABLE_STAT
            or row.get('mrkt_warn_cls_code') in _NOTABLE_WARN)


def describe(row):
    """플래그 요약 문자열 (로그 전용)"""
    parts = []
    stat = row.get('iscd_stat_cls_code')
    if stat in _NOTABLE_STAT:
        parts.append(_STAT_LABEL.get(stat, stat))
    if row.get('mang_issu_cls_code') == 'Y' and stat != '51':
        parts.append('관리종목')
    if row.get('sltr_yn') == 'Y':
        parts.append('정리매매')
    warn = row.get('mrkt_warn_cls_code')
    if warn in _NOTABLE_WARN:
        parts.append(_WARN_LABEL[warn])
    return ' · '.join(parts) or '-'


def update_stock_status(sb, codes=None, limit=None, executor=None, snapshot_date=None,
                        verbose=True):
    """
    KIS 주식현재가로 전 종목 상태 플래그를 훑어 stock_status에 업서트.

    Args:
        sb           : Supabase 클라이언트 (service_role)
        codes        : 특정 종목코드 리스트 (None이면 전 종목)
        limit        : 앞에서 N종목만
        executor     : Supabase 쿼리 실행 래퍼 (daily_update의 execute_with_retry 등)
        snapshot_date: 관측일 (기본 오늘). 하루에 여러 번 돌려도 같은 날짜 행을 갱신한다.
        verbose      : 진행 로그 출력

    Returns:
        dict(total, success, errors, saved, flagged, snapshot_date)
        — flagged는 상태 플래그가 선 행 리스트(로그/검증용)
    """
    executor = executor or _default_executor
    snapshot_date = snapshot_date or datetime.today().strftime('%Y-%m-%d')

    if codes:
        stocks = [{'stock_code': c, 'stock_name': c} for c in codes]
    else:
        stocks = _fetch_all_stocks(sb, executor)
    if limit:
        stocks = stocks[:limit]

    total = len(stocks)
    success = errors = skipped = saved = 0
    rows = []
    flagged = []

    def _flush(buf):
        n = 0
        for j in range(0, len(buf), 200):
            batch = buf[j:j + 200]
            executor(sb.table('stock_status').upsert(
                batch, on_conflict='stock_code,snapshot_date'
            ))
            n += len(batch)
        return n

    for i, s in enumerate(stocks):
        code = s['stock_code']
        name = s.get('stock_name') or code
        try:
            data = kis_get(
                '/uapi/domestic-stock/v1/quotations/inquire-price',
                'FHKST01010100',
                {'FID_COND_MRKT_DIV_CODE': 'J', 'FID_INPUT_ISCD': code}
            )
            out = (data or {}).get('output') or {}
            if not out:
                # 응답은 왔으나 본문이 빔(상폐/미상장 등) — 오류가 아니라 건너뜀
                skipped += 1
                continue

            row = {
                'stock_code': code,
                'snapshot_date': snapshot_date,
                'iscd_stat_cls_code': (out.get('iscd_stat_cls_code') or '').strip() or None,
                'mang_issu_cls_code': (out.get('mang_issu_cls_code') or '').strip() or None,
                'mrkt_warn_cls_code': (out.get('mrkt_warn_cls_code') or '').strip() or None,
                'sltr_yn': (out.get('sltr_yn') or '').strip() or None,
                'short_over_yn': (out.get('short_over_yn') or '').strip() or None,
                'source': 'kis_api',
            }
            rows.append(row)
            if is_notable(row):
                flagged.append({**row, 'stock_name': name})
            success += 1

        except Exception as e:
            if verbose and errors < 5:
                print(f"  ❌ {name}({code}): {e}")
            errors += 1

        if len(rows) >= 1000:
            saved += _flush(rows)
            rows = []

        if verbose and (i + 1) % 500 == 0:
            print(f"  ⏳ {i+1}/{total} ({success} 성공, 플래그 {len(flagged)})", flush=True)

    if rows:
        saved += _flush(rows)

    return {'total': total, 'success': success, 'errors': errors, 'skipped': skipped,
            'saved': saved, 'flagged': flagged, 'snapshot_date': snapshot_date}


def main():
    ap = argparse.ArgumentParser(description='종목 상태(관리종목·거래정지 등) 스냅샷 수집')
    ap.add_argument('--limit', type=int, help='앞에서 N종목만 (스모크)')
    ap.add_argument('--codes', help='특정 종목코드 (쉼표 구분)')
    ap.add_argument('--flagged', action='store_true', help='플래그 선 종목 상세 출력')
    args = ap.parse_args()

    from utils import get_supabase
    sb = get_supabase()

    codes = [c.strip() for c in args.codes.split(',')] if args.codes else None

    print('=' * 60)
    print('시야 — 종목 상태 스냅샷 수집 (KIS FHKST01010100)')
    print('=' * 60)

    res = update_stock_status(sb, codes=codes, limit=args.limit)

    print(f"\n✅ 완료 ({res['snapshot_date']} 스냅샷): "
          f"{res['success']}/{res['total']} 성공, "
          f"{res['skipped']}개 건너뜀, {res['errors']}개 오류, {res['saved']}행 저장")
    print(f"   상태 플래그가 선 종목: {len(res['flagged'])}개")

    if args.flagged or len(res['flagged']) <= 40:
        for r in res['flagged']:
            print(f"   · {r['stock_code']} {r['stock_name']:16s} "
                  f"stat={r['iscd_stat_cls_code']} mang={r['mang_issu_cls_code']} "
                  f"warn={r['mrkt_warn_cls_code']}  → {describe(r)}")


if __name__ == '__main__':
    main()
