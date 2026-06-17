"""
ECOS(한국은행) 원/달러 환율 데이터 확인 스크립트
========================================
Phase: 데이터 확인 (테이블/수집기 도입 전 사전 점검)

목적:
  - 통계표 731Y001("주요국 통화의 대원화 환율") 항목목록 조회
  - "미국달러" 항목코드 탐색
  - 주기 D(일별) 최근 데이터 조회 (TIME / DATA_VALUE / UNIT_NAME)

ECOS REST 형식:
  - 항목목록: https://ecos.bok.or.kr/api/StatisticItemList/{KEY}/json/kr/1/200/731Y001
  - 데이터:   https://ecos.bok.or.kr/api/StatisticSearch/{KEY}/json/kr/1/10/731Y001/D/{시작}/{종료}/{항목코드}

실행: python -X utf8 scripts/exploration/check_ecos.py

작성: 시야 (2026-06-17)
========================================
"""

import os
import sys
import requests

# 환경변수 로드 — 기존 수집기들과 동일하게 루트 .env 사용
from dotenv import load_dotenv

# scripts/exploration/ 기준 루트 .env 명시 경로 (CWD 무관하게 동작)
_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(_env_path)

ECOS_API_KEY = os.getenv('ECOS_API_KEY')

STAT_CODE = '731Y001'   # 주요국 통화의 대원화 환율
CYCLE = 'D'             # 일별
START = '20260601'
END = '20260617'

BASE = 'https://ecos.bok.or.kr/api'


def check_result(data, where):
    """ECOS 응답에 RESULT 키가 있으면 에러로 출력 후 종료."""
    if isinstance(data, dict) and 'RESULT' in data:
        result = data['RESULT']
        print(f"[ERROR] {where}: ECOS RESULT 응답")
        print(f"  CODE: {result.get('CODE')}")
        print(f"  MESSAGE: {result.get('MESSAGE')}")
        sys.exit(1)


def main():
    print("=" * 70)
    print("ECOS 원/달러 환율 데이터 확인")
    print("=" * 70)

    if not ECOS_API_KEY:
        print("[ERROR] ECOS_API_KEY 가 .env 에 설정되지 않았습니다.")
        print("        루트 .env 의 ECOS_API_KEY 값을 채운 뒤 다시 실행하세요.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # 1) 항목목록 조회 → 미국달러 항목코드 탐색
    # ------------------------------------------------------------------
    item_url = f"{BASE}/StatisticItemList/{ECOS_API_KEY}/json/kr/1/200/{STAT_CODE}"
    print(f"\n[1] 항목목록 조회: {STAT_CODE}")
    resp = requests.get(item_url, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    check_result(data, "StatisticItemList")

    rows = data.get('StatisticItemList', {}).get('row', [])
    print(f"    항목 수: {len(rows)}\n")
    print(f"    {'ITEM_CODE':<12} | {'ITEM_NAME':<24} | CYCLE")
    print(f"    {'-' * 12}-+-{'-' * 24}-+------")

    usd_code = None
    for r in rows:
        code = r.get('ITEM_CODE', '')
        name = r.get('ITEM_NAME', '')
        cycle = r.get('CYCLE', '')
        print(f"    {code:<12} | {name:<24} | {cycle}")
        if usd_code is None and ('미국달러' in name or '미국 달러' in name):
            usd_code = code

    if not usd_code:
        print("\n[ERROR] '미국달러' 항목을 항목목록에서 찾지 못했습니다.")
        sys.exit(1)

    print(f"\n[2] 찾은 USD 항목코드: {usd_code}")

    # ------------------------------------------------------------------
    # 2) 일별 데이터 조회
    # ------------------------------------------------------------------
    data_url = (
        f"{BASE}/StatisticSearch/{ECOS_API_KEY}/json/kr/1/10/"
        f"{STAT_CODE}/{CYCLE}/{START}/{END}/{usd_code}"
    )
    print(f"\n[3] 일별 데이터 조회: {CYCLE} {START}~{END}")
    resp = requests.get(data_url, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    check_result(data, "StatisticSearch")

    rows = data.get('StatisticSearch', {}).get('row', [])
    total = data.get('StatisticSearch', {}).get('list_total_count', len(rows))
    print(f"    조회 행 수: {len(rows)} (전체 {total})\n")
    print(f"    {'TIME':<10} | {'DATA_VALUE':>12} | UNIT_NAME")
    print(f"    {'-' * 10}-+-{'-' * 12}-+----------")
    for r in rows:
        t = r.get('TIME', '')
        v = r.get('DATA_VALUE', '')
        u = r.get('UNIT_NAME', '')
        print(f"    {t:<10} | {v:>12} | {u}")

    print("\n" + "=" * 70)
    print("확인 완료")
    print("=" * 70)


if __name__ == '__main__':
    main()
