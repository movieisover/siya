# 시야 (Siya) — 한국 주식 가치/퀄리티 분석 PC 앱

한국 주식시장 전 종목(KOSPI+KOSDAQ ~2,773개)의 재무·밸류에이션·수급·기술지표를 수집해, 테마 분석(Top-down)과 스크리너(Bottom-up)로 장기 가치/퀄리티 종목을 찾는 웹앱. 라이브: **stocksiya.com** (Vercel). 데이터는 Python 수집기가 GitHub Actions·로컬 스케줄로 Supabase에 적재한다.

## 문서 위치
- **작업 로그·의사결정 기록**: `docs/progress.md` — 과거 결정의 "왜"가 궁금하거나 비슷한 작업을 반복하기 전에 관련 항목을 읽는다. 세션에서 중요한 결정·수정이 생기면 **맨 위에 날짜 역순으로 추가**한다. (대부분의 불변 규칙은 아래 "핵심 규칙"에 승격돼 있어, 일상 작업엔 이 파일을 열 필요가 없다.)
- **화면별 로직·점수 계산식**: `docs/로직.md` — 프론트엔드 로직·점수 작업 전에 읽는다.
- **DB 스키마**: `docs/schema.sql` — 테이블·RLS 구조.
- **모바일 레이아웃**: `docs/CLAUDE_MOBILE.md` — 모바일 관련 세션 시작 시 먼저 읽는다.
- **향후 로드맵·보류 작업**: `docs/roadmap.md` — 실시간 데이터 3단계 로드맵, 미착수 최적화.
- **시야트레이더 연계**: `docs/핸드오프_*.md` / `docs/회신_*.md` — 별도 자동매매 프로젝트에 재무 데이터를 공급하는 작업의 요구·회신 기록.

## 시야에 대하여 (AI 어시스턴트)
- 이름 **시야** — 시장을 보는 넓은 눈. 대화 시작 시 "시야야"로 불린다.
- 사용자 **동철님**께는 존댓말로 응대한다.

## 작업 진행 원칙 (자율성)
**기본값은 묻지 말고 진행.** 판단이 서면 실행하고 결과를 보고한다. 중간에 "이렇게 할까요?"로 끊지 않고, 작업 단위가 끝났을 때 한 번에 보고한다.

**멈추고 물어봐야 하는 경우(이때만):**
1. 되돌릴 수 없는 파괴적 작업 — 데이터 삭제, 테이블 드롭, 대량 행 영구 변경.
2. 돈이 드는 작업 — API 크레딧 대량 소모, 유료 전환.
3. 설계가 갈리는 분기점 — 둘 이상 합리적 선택지가 있고 이후 작업이 크게 달라질 때.
4. 사전 가정이 틀렸다고 판명될 때 — 임의 우회 말고 보고.

그 외(구현 방식·변수명·파일 구조·라이브러리, 사소한 버그 수정, 검증·테스트)는 전부 재량으로 진행 후 보고.

## 핵심 방향
- **Top-down(테마 분석)**: 거래량 급증·기관/외국인 매집·동반 상승으로 뜨는 테마 감지 → 관련 종목.
- **Bottom-up(스크리너)**: ROE·PER·PBR·부채비율 필터 → 종합점수 정렬.
- 둘 다 **종목 상세**(재무 차트·동종업계 비교·시야 AI)로 수렴. 투자 스타일은 장기(6개월~) 가치/퀄리티.
- 종합점수 = 품질50 + 밸류20 + 개선30, 테마 신뢰도 = 거래량30 + 수급50 + 동반상승20. 계산식 상세는 `docs/로직.md`.

## 기술 스택 & 데이터 소스
- **프론트**: Tauri + React + TypeScript. 배포 Vercel(stocksiya.com). **AI**: Claude API(시야 AI 화면).
- **DB**: Supabase(PostgreSQL + Auth + Edge Functions). 금액은 **백만원** 단위 저장.
- **수집**: Python(`src/data/collectors/`), GitHub Actions·로컬 스케줄.
- **데이터원**: FinanceDataReader(종목·발행주식수·결산월), 한국투자증권 **KIS API**(시세·수급·배당·종목상태), **OpenDartReader**(재무/DART), **ECOS** 한국은행(환율), TradingView-Screener(기술지표 보조).
- **KIS API**: `https://openapi.koreainvestment.com:9443`, 토큰 24h(DB 공유 `kis_tokens`), **초당 3건 제한**(`kis_api.py`가 0.4s 간격 + 토큰 캐싱). DART: 일 10,000건.

## 데이터 파이프라인
- **매일 16:00** `daily-update.yml` → `daily_update.py` 6단계: ①시세(KIS 일봉) ②PER/PBR 재계산 ②b 우선주 재무 복사 ③RSI/MACD ④수급(KIS) ⑤~~환율~~(제거 — 핵심규칙 9) ⑥종목상태(KIS). 전종목 순차 호출이라 ~3h20m, `timeout-minutes: 330`.
- **공시** `collect-disclosures.yml` 3시간 간격 → `collect_disclosures.py`.
- **배당** `collect-dividends.yml` 주1회 → `collect_dividend_schedule.py`(+`collect_dividends_kis.py`).
- **환율** 로컬 `run_fx.bat`(Windows 작업 스케줄러) → `collect_fx.py`. (GitHub 아님 — 핵심규칙 9)
- **재무(수동·시즌별)**: `collect_financials.py`(연간 FY) · `collect_quarterly.py`(분기 누적) · `compute_ttm.py`(TTM) · `backfill_settle_month.py`(결산월). 공용 추출 `financials_common.py`.
- **공용**: `kis_api.py`(토큰·호출·재시도), `utils.py`(Supabase 클라이언트).
- ⚠️ daily_update는 매일 자동 실행 → **수집 로직 변경은 반드시 git push**해야 다음 실행에 반영된다.

## DB 주요 테이블 (Supabase)
`stocks`(종목 마스터·sector·settle_month) · `price_daily`(일봉 3년) · `valuation`(PER/PBR/EPS/BPS/배당, eps_basis) · `financials`(연간FY+분기 재무, 지배주주·확장6컬럼) · `ttm_earnings`(TTM 이익) · `investor_trading`(기관/외국인 수급) · `technical`(RSI/MACD) · `fx_daily`(원/달러) · `stock_status`(관리종목·거래정지 스냅샷) · `dividend_schedule` · `disclosures` · `themes`/`stock_themes`/`user_themes`/`user_stock_themes` · `watchlist` · `users` · `kis_tokens`.

## 코드 구조 (프론트 `app/src`)
- `lib/`: supabase · scoring(점수 계산) · ai(Claude 호출). `types/`: database · stock.
- `hooks/`: `use*` — 테마/스크리너/종목상세/차트/관심종목/수급/FX 민감도 데이터 fetch.
- `components/`: `layout`(Header·Left·Center·Right 3단) · `stock-detail`(CandleChart·SupplyChart·FxScatterChart 등) · `mobile`(모바일 전용 — `CLAUDE_MOBILE.md`) · `common`(Tooltip·HelpPage·SplashModal·EpsBasisBadge) · `auth`.

## 핵심 규칙 (불변 — 어기면 과거 사고 재발)
1. **금액 단위 = 백만원**. 수집 시 원→백만원 변환 저장.
2. **지배주주 기준**: EPS/PER·BPS/PBR·ROE는 지배주주(`net_income_owners`/`equity_owners`), **ROA·부채비율은 전체**. 개별재무(OFS)는 분리 없어 전체값 폴백.
3. **TTM**: EPS 분자 = `ttm_earnings.ttm_net_income_owners`. 게이트 = `settle_month='12' AND TTM 3값(직전FY·작년동기·올해동기)`. 비12월·SPAC·분기미비는 연간 폴백(`valuation.eps_basis`). 음수 TTM은 그대로(적자 신호). 최신 분기 자동 감지(`compute_ttm.detect_ttm_period`).
4. **분기 누적**: 분기 재무는 `thstrm_add_amount`(누적) 기준 — Q1=3개월, Q2=6개월, Q3=9개월. 연간·1Q는 `thstrm_amount`.
5. **재무는 원자료만 저장**(매출총이익·CFO·현금성 등 확장 6컬럼), 비율·팩터 산출은 소비자(시야트레이더)가. 추출 시 **0과 None을 구분**한다(`_first` 헬퍼 — SPAC `Revenue=0`이 falsy라 금융수익을 매출로 오추출한 버그 교훈).
6. **누적형 테이블(`valuation`·`price_daily`) 조회에 DB `ORDER BY` 금물** → 전부 받아 Python에서 최신 선택. 대용량 정렬은 Supabase **statement timeout(57014)**로 daily_update를 즉사시킨다(`execute_with_retry`는 네트워크 오류만 재시도, 57014는 재시도 안 됨).
7. **`collect_quarterly` 재개 = '대상 조합 전부 채움' 기준.** **새 분기 시즌은 `--quarters YYYYQn` 증분 수집**(새 분기 1개만, ~3,700콜·1일). 첫 실행에 `--resume` 금지, `--resume`은 한도 분할 이어받기(같은 대상셋, 예: `--quarters 2026Q3 --resume`)에만 쓴다. 인자 없는 전체 재실행은 과거 분기 재수집이 필요할 때만(컬럼 추가 백필 등). (2026 Q2 절반 누락 사고 교훈.)
8. **로컬 Python 실행**: `conda activate siya`(`C:\Users\easte\.conda\envs\siya`) + `set PYTHONIOENCODING=utf-8`. 안 하면 진행 이모지(⏳✅)가 cp949로 크래시.
9. **환율(ECOS)은 GitHub에서 못 받는다** — 클라우드(Azure) IP를 ECOS가 유해 IP로 차단(INFO-100). 로컬(한국 IP) `run_fx.bat`로만 수집. daily_update Step 5는 제거됨.
10. **KIS 실시간/현재가는 클라우드에서 차단** — Edge Function·해외 IP라 KIS가 막는다. 배치(REST)만 가능. 실시간은 한국 서버 필요(`docs/roadmap.md`).
11. **`stock_status`는 판정하지 않고 KIS 원값만 저장**. `iscd_stat_cls_code=51`(관리) ≠ `mang_issu_cls_code=Y` — 거래정지(58)면 51이 덮이니 **두 필드를 따로** 봐야 관리종목을 안 놓친다.
12. **점수·UI 문자열은 DB에 저장 안 함** — 원본값만 저장하고 점수는 앱에서 계산.
13. **`range()` 페이지네이션엔 반드시 PK 정렬(`.order('id')` 등)**. 정렬 없는 range()는 페이지마다 순서가 달라져 행이 **중복·누락**된다(2026-11-19 compute_ttm이 2025Q3 2,582행 중 2,147만 로드 → TTM 420종목 오폴백). PK 정렬은 인덱스라 가볍다 — 규칙 6(대용량 `trade_date` 정렬 금지)과 별개.

## 로컬 명령어
- (전제) `conda activate siya` + `set PYTHONIOENCODING=utf-8`
- 재무 연간: `python src/data/collectors/collect_financials.py` (`--expand` 확장컬럼 / `--remigrate` 지배주주)
- 재무 분기: `python src/data/collectors/collect_quarterly.py --quarters 2026Q3` (시즌 증분 — 기본) / 인자 없음=최근 2년 전체 / `--years 2023 2024` 백필 / `--resume` 한도분할만 / `--dry-run` 대상 조합만 확인
- TTM: `python src/data/collectors/compute_ttm.py`
- 환율 수동: `python src/data/collectors/collect_fx.py --days 10`

## 현재 상태 (2026-11)
- 앱 라이브(stocksiya.com), 데이터 파이프라인 자동 운영 중.
- 최근 작업: 재무 확장 **B-1**(총이익성·Piotroski F-score 원자료 6컬럼) + **B-3**(2023~24 분기 백필), 배제게이트 **B-2**(종목상태 스냅샷), daily_update 안정화(타임아웃 330분·57014 수정·ECOS 로컬화).
- 연계: **시야트레이더**(별도 자동매매 프로젝트)에 재무 원자료 공급 — `docs/핸드오프_*`/`docs/회신_*`.
- 미착수: daily_update 병렬화(3h20m 단축, KIS 앱키 정지 위험으로 신중히), `update_valuation` 종목별 개별 쿼리 일괄화 → `docs/roadmap.md`.

## 문서 관리 규칙
- **이 파일은 ~15KB 이하로 유지**한다. 작업 이력·상세 결정은 `docs/progress.md`에 쓴다.
- 새 불변 규칙이 생기면 "핵심 규칙"에 한 줄 승격 + 상세는 progress.md에.
- 요구사항·로직이 바뀌면 `docs/로직.md`를, 스키마가 바뀌면 `docs/schema.sql`을 함께 갱신한다.
