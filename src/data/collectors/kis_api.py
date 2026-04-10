"""
시야 (Siya) — 한국투자증권 오픈API 유틸리티
토큰 발급/캐싱 + 공통 GET 요청 함수
"""

import os
import json
import time
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# 프로젝트 루트 .env 로드
_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(_env_path)

BASE_URL = "https://openapi.koreainvestment.com:9443"
APP_KEY = os.getenv('KIS_APP_KEY')
APP_SECRET = os.getenv('KIS_APP_SECRET')

# 토큰 캐시 파일 경로
_TOKEN_CACHE_PATH = os.path.join(os.path.dirname(__file__), '.kis_token_cache.json')

# API 호출 간 최소 대기 시간 (초당 3건 제한 대응)
_MIN_INTERVAL = 0.4
_last_call_time = 0.0


def _load_cached_token():
    """캐시된 토큰 로드. 유효하면 반환, 아니면 None."""
    if not os.path.exists(_TOKEN_CACHE_PATH):
        return None
    try:
        with open(_TOKEN_CACHE_PATH, 'r') as f:
            cache = json.load(f)
        expires_at = datetime.fromisoformat(cache['expires_at'])
        if datetime.now() < expires_at - timedelta(minutes=30):
            return cache['access_token']
    except Exception:
        pass
    return None


def _save_token_cache(access_token, expires_at):
    """토큰을 파일에 캐싱."""
    cache = {
        'access_token': access_token,
        'expires_at': expires_at,
    }
    with open(_TOKEN_CACHE_PATH, 'w') as f:
        json.dump(cache, f)


def get_access_token():
    """access_token 발급 (캐시 우선, 없으면 새로 발급)."""
    cached = _load_cached_token()
    if cached:
        return cached

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
    # 토큰 유효기간: 24시간
    expires_at = (datetime.now() + timedelta(hours=23)).isoformat()
    _save_token_cache(access_token, expires_at)

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
