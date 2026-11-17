# 시야 (Siya) — 향후 로드맵 · 보류 작업

> 실시간 데이터 3단계 로드맵, 미착수 최적화, 아직 안 끝난 TODO. `CLAUDE.md` "현재 상태"가 여기를 가리킨다.

---

## 미착수 최적화 (성능)

- **daily_update 병렬화**: 시세·수급·종목상태가 전종목 KIS 순차 호출(~8,300콜)이라 ~3h20m. `kis_api.py`의 rate limiter를 스레드 안전하게 고쳐 동시 5~8개로 병렬화하면 30~40분대로 단축 가능. **단 KIS 초당 제한 초과 시 앱키 일시 정지 위험** — 로컬 소량 테스트 먼저, 신중히. (현재는 `timeout-minutes: 330`으로 안정.)
- **`update_valuation` 종목별 개별 쿼리 일괄화**: PER/PBR 재계산이 종목마다 `price_daily`를 1건씩 조회(~2,700회). 일괄 조회로 리팩터하면 연결 수·시간 절감. 57014(핵심규칙 6)의 사촌 격 병목 — 병렬화와 함께.

---

## 실시간 데이터 로드맵

### 현재 (MVP): REST API + 배치 수집
```
장 마감 후 16:00 → GitHub Actions → KIS REST API → 전 종목 일괄 수집 → DB
```
- 장점: 비용 제로, 구현 간단, API 호출량 최소
- 한계: 장중 실시간 데이터 없음 (16:00 갱신 전까지 전일 종가)

> ⚠️ **Edge Function 해외 IP 제한**: Supabase Edge Function은 해외 서버에서 실행되어 KIS API가 IP를 차단함 (2026-04-15 확인)
> → Edge Function으로 KIS API 직접 호출 불가. 한국 서버 프록시 필요.

### 2단계 (상용화 초기): GitHub Actions 장중 주기적 수집
```
장중 매시 정각 → GitHub Actions → 테마/관심종목만 시세 갱신 (~1분)
```
- 대상: 테마 매핑 종목(~148개) + 관심종목 → 약 160개, ~1분 소요
- 구현: 별도 워크플로 추가 (09:00~15:30 매시 정각)
- GitHub Actions는 해외 서버이지만 KIS API는 REST 호출 시 IP 제한 없음 (토큰만 IP 바인딩)

### 3단계 (상용화 확장): 한국 서버 + 웹소켓 실시간
```
한국 서버 (AWS Seoul / NCP 등)
  └── KIS 웹소켓 연결 (H0STCNT0: 실시간 체결가)
  └── 관심종목/선택 종목만 구독 등록
  └── 체결 데이터 수신 → Supabase Realtime으로 프론트엔드 푸시
```
- **핵심: 한국 내 서버 필수** (KIS API IP 제한 때문)
- 장점: 초단위 실시간, API 호출 제한 없음
- 필요 인프라: 상시 연결 유지할 한국 서버 (비용 발생)
- 시기: 사용자 수 증가 + 실시간 수요 확인 후
- 참고: 한투 API 웹소켓 연결 예제는 [open-trading-api GitHub](https://github.com/koreainvestment/open-trading-api) 참고

---

## TODO: 보류 작업

### pykrx API — 완전 대체 완료 (KIS API)
- **상태**: 2026-04-01 기준 pykrx 고장 → KIS API로 전면 대체 완료
- **시세**: KIS API 일봉 조회 ✅
- **수급**: KIS API 투자자별 매매동향 ✅
- **PER/PBR**: FDR 발행주식수 + 자체계산 ✅
- **RSI/MACD**: 자체계산 ✅
- **결론**: pykrx import 제거, GitHub Actions에서도 제거 (2026-05-13)
- **세션 시작 시 pykrx 복구 확인 불필요**

### Claude API 크레딧 충전 필요
- **상태**: API 키 발급 및 `app/.env` 입력 완료 (2026-04-07)
- **문제**: Evaluation access(무료) 플랜 크레딧 소진 → "Your credit balance is too low" 에러
- **해결**: console.anthropic.com → Plans & Billing → 크레딧 구매 (최소 $5)
- **영향**: 키 없이도 앱 정상 실행, 시야 AI 탭에서 질문 시에만 에러 발생

### 시야 AI: 직접 호출 → Edge Function 프록시 전환
- **현재 방식**: 프론트에서 Claude API 직접 호출 (`lib/ai.ts`)
- **문제**: API 키가 클라이언트(앱)에 포함됨 — 배포 시 보안 이슈
- **전환 계획**: Supabase Edge Function으로 프록시 생성, `lib/ai.ts`의 엔드포인트만 변경
- **전환 시점**: MVP 완료 후 배포 준비 단계에서 실행

### 데이터 자동 수집 설정 (UI 마무리 후 진행)
- **방법**: GitHub Actions (기존 Python 스크립트 재활용, 무료)
- **스케줄**: 매일 장 마감 후 (KST 16:30 = UTC 07:30)
- **수집 항목**:
  - 매일 16:00: 일별 시세(KIS API), PER/PBR(자체계산), RSI/MACD(자체계산), 기관/외국인 수급(KIS API)
  - 매주 월요일 17:00: 배당 DPS/수익률 + 배당 일정(KIS API ksdinfo/dividend)
  - 매시 정각 (09~18시): DART 공시 목록
  - 월 1회: 종목 마스터 (신규 상장/상폐 반영)
  - 연 1회: 재무제표 (4~5월 사업보고서 공시 후)
- **순서**: UI 마무리 → 자동화 설정 → 배포

### 2025년 사업보고서 수집 ✅ 완료 (2026-04-07)
- `update_financials_2025.py` 실행 완료 — 2025년 2,356개 수집 + 2022년 2,036건 삭제
- 최종 상태: 2023년 2,427개 / 2024년 2,560개 / 2025년 2,591개
- `collect_financials.py`의 YEARS도 [2025, 2024, 2023]으로 변경 완료

---

## 참고 링크

- [FinanceDataReader GitHub](https://github.com/financedata-org/FinanceDataReader)
- [pykrx GitHub](https://github.com/sharebook-kr/pykrx)
- [OpenDartReader GitHub](https://github.com/FinanceData/OpenDartReader)
- [TradingView-Screener GitHub](https://github.com/shner-elmo/TradingView-Screener)
- [DART API 키 발급](https://opendart.fss.or.kr/)
- [Tauri 공식 문서](https://tauri.app/)
