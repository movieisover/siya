# 한국투자증권 오픈API 연동 — Claude Code 프롬프트

## 배경
시야(Siya) 프로젝트에 한국투자증권(KIS) 오픈API를 연동해야 해.
기존 pykrx가 KRX API 변경으로 고장나서 기관/외국인 수급 데이터를 못 가져오고 있어.
한투 API로 수급 데이터 수집 + 종목 상세 화면에 캔들차트를 추가하는 작업이야.

## 환경
- 프로젝트 경로: C:\projects\stock-analyzer\
- Python: Conda 환경 `siya` (Python 3.11) — Anaconda Prompt에서 실행
- .env에 KIS_APP_KEY, KIS_APP_SECRET 이미 저장됨
- CLAUDE.md 읽어서 프로젝트 전체 컨텍스트 파악할 것
- 기존 수집 스크립트 패턴 참고: src/data/collectors/utils.py, daily_update.py

## 한투 오픈API 정보
- Base URL: https://openapi.koreainvestment.com:9443
- 인증: POST /oauth2/tokenP → access_token 발급 (appkey + appsecret)
- 토큰 유효기간: 24시간
- 신규 고객 3일간 초당 3건 제한 → time.sleep(0.4) 필요

### 사용할 엔드포인트

1. **투자자별 매매동향 (수급)**
   - GET /uapi/domestic-stock/v1/quotations/inquire-investor
   - tr_id: FHKST01010900
   - params: FID_COND_MRKT_DIV_CODE=J, FID_INPUT_ISCD={종목코드}
   - 응답: 외국인/기관 순매수금액 등 (당일 데이터는 장 종료 후 제공)

2. **일봉 시세 (캔들차트용)**
   - GET /uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice
   - tr_id: FHKST03010100
   - params: FID_COND_MRKT_DIV_CODE=J, FID_INPUT_ISCD={종목코드}, FID_INPUT_DATE_1={시작일}, FID_INPUT_DATE_2={종료일}, FID_PERIOD_DIV_CODE=D
   - 응답: 시가/고가/저가/종가/거래량

3. **현재가 시세**
   - GET /uapi/domestic-stock/v1/quotations/inquire-price
   - tr_id: FHKST01010100
   - params: FID_COND_MRKT_DIV_CODE=J, FID_INPUT_ISCD={종목코드}

## 작업 목록 (순서대로)

### 작업 1: KIS API 유틸리티 모듈
파일: `src/data/collectors/kis_api.py`

- .env에서 KIS_APP_KEY, KIS_APP_SECRET 로드
- access_token 발급 함수 (POST /oauth2/tokenP)
- 토큰 캐싱 (파일 저장, 24시간 유효 체크)
- 공통 GET 요청 함수 (헤더에 authorization, appkey, appsecret, tr_id 포함)
- 호출 간 time.sleep(0.4) 포함 (초당 3건 제한 대응)

### 작업 2: 기관/외국인 수급 수집 스크립트
파일: `src/data/collectors/collect_investor_kis.py`

- 전 종목(~2,773개) 순회하며 투자자별 매매동향 조회
- investor_trading 테이블에 upsert (stock_code + trade_date)
- inst_net_buy: 기관 순매수금액, foreign_net_buy: 외국인 순매수금액
- source를 'kis_api'로 설정
- 옵션: --date (특정일), --days (며칠치)
- 진행률 표시 (500개마다)
- 주의: 전 종목 순회는 API 호출이 많으므로 배치 사이에 적절한 sleep
- 주의: 종목별 조회이므로 2,773 * 0.4초 = 약 18분 소요 예상

### 작업 3: daily_update.py에 수급 수집 단계 추가
- Step 4로 collect_investor_kis.py의 로직 추가
- 기존 pykrx 의존성은 유지하되, 수급은 KIS API로

### 작업 4: GitHub Actions 워크플로 업데이트
파일: `.github/workflows/daily-update.yml`
- KIS_APP_KEY, KIS_APP_SECRET 환경변수 추가 (secrets에서)
- pip install에 requests 추가 (이미 있을 수 있음)

### 작업 5: 프론트엔드 — 캔들차트 컴포넌트
- npm install lightweight-charts (app/ 디렉토리에서)
- 파일: `app/src/hooks/useChartData.ts` — Supabase에서 price_daily 데이터 조회 (최근 N일)
- 파일: `app/src/components/stock-detail/CandleChart.tsx`
  - lightweight-charts 사용
  - 캔들스틱 차트 + 하단 거래량 바
  - 기간 선택 버튼: 1개월 / 3개월 / 6개월 / 1년 / 3년
  - 앱 다크 테마에 맞게 스타일링 (배경: var(--color-bg), 텍스트: var(--color-text))
  - 상승: var(--color-up) = #ef4444, 하락: var(--color-down) = #3b82f6
  - 한국 주식은 상승=빨강, 하락=파랑임 주의
- RightPanel.tsx 종목 상세 탭에 CandleChart 추가 (핵심 지표 카드 위에 배치)
- 캔들차트 높이: 250px 정도

### 작업 6: CLAUDE.md 업데이트
- KIS API 연동 완료 기록
- investor_trading 수집 완료 기록
- 캔들차트 추가 기록
- KIS 관련 환경변수 및 GitHub Secrets 안내 추가

## 중요 참고사항
- 한투 API 공식 GitHub 참고: https://github.com/koreainvestment/open-trading-api
- 토큰 발급 시 grant_type은 "client_credentials"
- 헤더에 custtype: "P" (개인), tr_cont: "" 포함
- API 응답의 rt_cd가 "0"이면 성공
- 실행은 반드시 Anaconda Prompt에서 `conda activate siya` 후 실행
- 작업 후 반드시 테스트: `python src/data/collectors/collect_investor_kis.py --date 2026-04-10` (최근 거래일로)
- 프론트엔드 테스트: `cd app && npm run dev`로 localhost:5173에서 확인
