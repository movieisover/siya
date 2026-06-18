"""
시야 (Siya) — 한국투자증권 오픈API 유틸리티
토큰 발급/캐싱 (DB + 파일) + 공통 GET 요청 함수

토큰은 Supabase `kis_tokens` 테이블에 저장하여
Python 수집기와 Edge Function(kis-price)이 공유한다.
KIS API 1일 1회 발급 제한을 회피하기 위함.
"""

import os
import json
import time
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# 프로젝트 루트 .env 로드
_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(_env_path)

BASE_URL = "https://openapi.koreainvestment.com:9443"
APP_KEY = os.getenv('KIS_APP_KEY')
APP_SECRET = os.getenv('KIS_APP_SECRET')

# 토큰 파일 캐시 (DB 장애 대비 로컬 백업)
_TOKEN_CACHE_PATH = os.path.join(os.path.dirname(__file__), '.kis_token_cache.json')

# API 호출 간 최소 대기 시간 (초당 3건 제한 대응)
_MIN_INTERVAL = 0.4
_last_call_time = 0.0

# KIS HTTP 호출 timeout (connect 5s, read 15s)
# 정상 응답은 1초 내. timeout 부재 시 무한 hang → 5,538회/런 중 1건만 멈춰도
# 워크플로 전체가 timeout-minutes 한도까지 정지하던 문제(2026-06-17) 방지.
_HTTP_TIMEOUT = (5, 15)

# 재시도 대상: 네트워크 예외만 (응답이 온 비-200/rt_cd 오류는 재시도 무의미 → 제외)
_RETRY_NETWORK_EXC = (
    requests.exceptions.Timeout,
    requests.exceptions.ConnectionError,
)


def _get_supabase():
    """Supabase 클라이언트 (service_role). 지연 로딩으로 순환 import 회피."""
    try:
        from .utils import get_supabase
    except ImportError:
        from utils import get_supabase
    return get_supabase()


def _load_token_from_db():
    """Supabase kis_tokens에서 유효한 토큰 로드. 없거나 만료되면 None."""
    try:
        sb = _get_supabase()
        res = sb.table('kis_tokens').select('access_token, expires_at').eq('id', 1).execute()
        if not res.data:
            return None
        row = res.data[0]
        expires_at = datetime.fromisoformat(row['expires_at'].replace('Z', '+00:00'))
        # 30분 여유를 두고 판정
        if datetime.now(timezone.utc) < expires_at - timedelta(minutes=30):
            return row['access_token']
    except Exception as e:
        print(f"[KIS] DB 토큰 조회 실패: {e}")
    return None


def _save_token_to_db(access_token, expires_at_iso):
    """
    Supabase kis_tokens에 토큰 upsert (1행 유지).
    app_key/app_secret도 함께 저장 — Edge Function이 DB에서 읽어서 사용하기 위함
    (Supabase secrets는 / = 같은 특수문자에서 깨지므로 DB를 single source of truth로 사용).
    """
    try:
        sb = _get_supabase()
        sb.table('kis_tokens').upsert({
            'id': 1,
            'access_token': access_token,
            'expires_at': expires_at_iso,
            'app_key': APP_KEY,
            'app_secret': APP_SECRET,
        }, on_conflict='id').execute()
        print(f"[KIS] DB에 토큰 저장 완료")
    except Exception as e:
        print(f"[KIS] DB 토큰 저장 실패: {e}")


def _load_cached_token_file():
    """파일 캐시 토큰 로드 (DB 장애 시 fallback)."""
    if not os.path.exists(_TOKEN_CACHE_PATH):
        return None
    try:
        with open(_TOKEN_CACHE_PATH, 'r') as f:
            cache = json.load(f)
        expires_at = datetime.fromisoformat(cache['expires_at'])
        # tz-aware/naive 호환 처리
        now = datetime.now(timezone.utc) if expires_at.tzinfo else datetime.now()
        if now < expires_at - timedelta(minutes=30):
            return cache['access_token']
    except Exception:
        pass
    return None


def _save_token_cache_file(access_token, expires_at_iso):
    """토큰을 파일에도 캐싱 (DB 장애 대비)."""
    try:
        cache = {
            'access_token': access_token,
            'expires_at': expires_at_iso,
        }
        with open(_TOKEN_CACHE_PATH, 'w') as f:
            json.dump(cache, f)
    except Exception:
        pass


def _request_with_retry(method, url, retries=2, base_delay=1.0, **kwargs):
    """
    KIS HTTP 호출 공통 래퍼 (timeout + 네트워크 재시도).
    - timeout 미지정 시 _HTTP_TIMEOUT(5, 15)s 주입
    - 네트워크 예외(Timeout/ConnectionError)만 지수 백오프 재시도 (최대 retries회)
      → 백오프 1s → 2s. 이 sleep은 _MIN_INTERVAL(호출간격 제한)과 별개.
    - 최초 1회 + retries회 = 총 3회 시도. 최종 실패 시 마지막 예외를 그대로 raise.
    - HTTP 200/비-200, rt_cd 등 응답 본문 처리는 호출자 책임 (여기선 Response만 반환).
    """
    kwargs.setdefault('timeout', _HTTP_TIMEOUT)
    for attempt in range(retries + 1):
        try:
            return requests.request(method, url, **kwargs)
        except _RETRY_NETWORK_EXC as e:
            if attempt == retries:
                raise
            delay = base_delay * (2 ** attempt)  # 1s → 2s
            print(f"  ⚠️ [KIS] 네트워크 재시도 {attempt+1}/{retries} "
                  f"({type(e).__name__}) — {delay:.0f}s 대기")
            time.sleep(delay)


def get_access_token():
    """access_token 발급. 우선순위: DB → 파일 → 신규 발급."""
    # 1) DB에서 먼저 확인 (Edge Function과 공유)
    db_token = _load_token_from_db()
    if db_token:
        return db_token

    # 2) 파일 캐시 (로컬 fallback)
    file_token = _load_cached_token_file()
    if file_token:
        return file_token

    # 3) 신규 발급
    url = f"{BASE_URL}/oauth2/tokenP"
    body = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
    }
    try:
        resp = _request_with_retry('POST', url, json=body)
    except _RETRY_NETWORK_EXC as e:
        # 토큰은 모든 KIS 호출의 전제. 네트워크로 3회 실패하면 None 반환 →
        # 호출부(kis_get)가 토큰 없음을 인지하고 호출을 건너뛴다.
        print(f"[KIS] ❌ 토큰 발급 실패 (네트워크 {type(e).__name__}) — 토큰 없이 KIS 호출 불가")
        return None
    resp.raise_for_status()
    data = resp.json()

    access_token = data['access_token']
    # 토큰 유효기간: 24시간 → 23시간으로 보수적 설정
    expires_at_dt = datetime.now(timezone.utc) + timedelta(hours=23)
    expires_at_iso = expires_at_dt.isoformat()

    _save_token_to_db(access_token, expires_at_iso)
    _save_token_cache_file(access_token, expires_at_iso)

    print(f"[KIS] 새 토큰 발급 완료")
    return access_token


def kis_get(endpoint, tr_id, params):
    """
    KIS API GET 요청 공통 함수.
    - endpoint: "/uapi/domestic-stock/v1/quotations/inquire-investor" 등
    - tr_id: "FHKST01010900" 등
    - params: 쿼리 파라미터 dict
    - 반환: 응답 JSON dict (성공 시) 또는 None (실패 시)
    """
    global _last_call_time

    # 호출 간격 제한
    elapsed = time.time() - _last_call_time
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)

    token = get_access_token()
    if token is None:
        # 토큰 발급이 네트워크로 실패한 상태 → 이 호출은 건너뛴다 (None 반환).
        print(f"  ⚠️ [KIS] 토큰 없음 → 호출 건너뜀 ({params.get('FID_INPUT_ISCD', endpoint)})")
        return None

    headers = {
        "content-type": "application/json; charset=utf-8",
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": tr_id,
        "custtype": "P",
        "tr_cont": "",
    }

    url = f"{BASE_URL}{endpoint}"
    try:
        resp = _request_with_retry('GET', url, headers=headers, params=params)
    except _RETRY_NETWORK_EXC as e:
        # 네트워크 3회 실패 → 예외를 삼키고 None 반환. 이래야 호출자(종목 루프)의
        # 기존 try/except가 '그 종목만 건너뛰고 계속'을 정상 수행한다.
        # (timeout 부재 시엔 hang으로 예외 자체가 안 나 건너뛰지 못했음 — 이 변환이 핵심)
        _last_call_time = time.time()
        print(f"  ⚠️ [KIS] 네트워크 실패로 건너뜀 "
              f"({params.get('FID_INPUT_ISCD', endpoint)}, {type(e).__name__})")
        return None
    _last_call_time = time.time()

    if resp.status_code != 200:
        return None

    data = resp.json()
    if data.get('rt_cd') != '0':
        return None

    return data


def get_dividend_history(stock_code, from_date=None, to_date=None):
    """
    KIS 예탁원정보 배당일정 조회 (HHKDB669102C0).
    - stock_code: 6자리 종목코드
    - from_date/to_date: YYYYMMDD (미지정 시 최근 1년)
    - 반환: output1 배당 이력 리스트 (record_date, per_sto_divi_amt, divi_kind 등)
             실패 시 빈 리스트
    """
    if to_date is None:
        to_date = datetime.now().strftime('%Y%m%d')
    if from_date is None:
        from_date = (datetime.now() - timedelta(days=400)).strftime('%Y%m%d')

    data = kis_get(
        '/uapi/domestic-stock/v1/ksdinfo/dividend',
        'HHKDB669102C0',
        {
            'CTS': '',
            'GB1': '0',
            'F_DT': from_date,
            'T_DT': to_date,
            'SHT_CD': stock_code,
            'HIGH_GB': '',
        }
    )
    if not data:
        return []
    return data.get('output1', []) or []
