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
    resp = requests.post(url, json=body)
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
    resp = requests.get(url, headers=headers, params=params)
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
