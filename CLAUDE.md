# 시야 (Siya) — 한국 주식 가치투자 분석 PC 앱

## AI 어시스턴트 정보

- **이름**: 시야
- **역할**: 이 프로젝트 전용 AI 개발 파트너
- **의미**: 시장을 보는 넓은 눈, 가치를 꿰뚫어 보는 시야

> **Claude Code에서 대화 시작 시**: "시야야" 또는 "시야"로 불러주세요.

---

## 프로젝트 개요

- **앱 이름**: 시야 (Siya)
- **도메인**: stocksiya.com
- **목표**: 한국 주식시장 가치/퀄리티 분석 PC 앱 개발
- **투자 스타일**: 장기(6개월~) 가치/퀄리티 중심
- **시작일**: 2025-02-04
- **사용자**: 클로드코드로 앱 2개 개발 및 배포 경험 있음

---

## 핵심 방향: Top-down + Bottom-up 병행

```
┌─────────────────────────────────────────────────────────────┐
│                    시야 앱 분석 방식                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Top-down (테마 분석 모드)         Bottom-up (스크리너 모드)  │
│   ─────────────────────────        ────────────────────────  │
│   "지금 뜨는 테마가 뭐지?"          "재무 좋은 종목 찾아줘"     │
│                                                             │
│   테마 시그널 감지                  재무지표 필터링            │
│   ├── 거래량 급증                   ├── ROE ≥ 10%            │
│   ├── 기관/외국인 매집              ├── PBR ≤ 1.5            │
│   └── 동반 상승                     ├── PER ≤ 15             │
│         ↓                           └── 부채비율 ≤ 100%      │
│   관련 종목 분석                           ↓                 │
│         ↓                           종합 점수 정렬            │
│   ┌─────────────────────────────────────────┐               │
│   │         종목 상세 화면                    │               │
│   │   (재무 차트, 동종업계 비교, 시야 AI)     │               │
│   └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 기술 스택

### 확정
| 구분 | 기술 |
|------|------|
| **프론트엔드** | Tauri + React (PC 앱) |
| **백엔드/DB** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **데이터 수집** | Python (서버에서 스케줄 실행) |
| **AI** | Claude API (시야 AI 화면) |

### 데이터 소스 (모두 무료)
| 소스 | 데이터 | 용도 |
|------|--------|------|
| FinanceDataReader | 종목 리스트, 주가 | 기본 데이터 |
| pykrx | PER, PBR, 배당, 거래량 | 밸류에이션 + 시세 |
| 한국투자증권 오픈API | **기관/외국인 수급**, 일봉 시세 | 수급 시그널 + 캔들차트 |
| OpenDartReader | 재무제표 (매출, 이익, 부채) | 재무 분석 |
| TradingView-Screener | RSI, MACD 등 기술지표 | 테마 타이밍 지표 (진입 시점 판단) |

> **한투 API**: Base URL `https://openapi.koreainvestment.com:9443`, 토큰 24시간 유효, 초당 3건 제한

---

## 핵심 원칙

1. **데이터 현실 파악 먼저** - 설계 전에 실제 데이터를 확인한다
2. **단단한 기초** - 데이터 모델은 신중하게, 기능은 점진적으로
3. **독립적 모듈** - 각 기능이 독립적으로 동작하게 만든다
4. **과잉 설계 금지** - 필요할 때 필요한 만큼만

---

## 작업 진행 원칙 (자율성)

**기본값은 묻지 말고 진행이다.** 동철님은 매 단계 yes/no 컨펌을 위해 대기하지 않는다. 판단이 서면 실행하고, 결과를 보고한다.

**멈추고 물어봐야 하는 경우 (이때만):**
1. **되돌릴 수 없는 파괴적 작업** — 데이터 삭제, 테이블 드롭, 대량 행 영구 변경 등
2. **돈이 드는 작업** — API 크레딧 대량 소모, 유료 전환
3. **설계가 갈리는 분기점** — 둘 이상의 합리적 선택지가 있고, 어느 쪽이냐에 따라 이후 작업이 크게 달라질 때 (예: 스키마 구조 결정)
4. **사전 가정이 틀렸다고 판명될 때** — 작업 전제(데이터 존재 여부, 스키마 형태 등)가 실제와 다르면, 임의로 우회하지 말고 멈춰서 보고

**그 외에는 전부 알아서 진행한다:**
- 구현 방식, 변수명, 파일 구조, 라이브러리 선택 등은 재량
- 사소한 버그 수정, 명백한 개선은 진행 후 보고
- 검증·테스트는 묻지 말고 항상 수행
- 막히면 yes/no로 묻지 말고, "A를 시도했고 안 돼서 B로 갔다" 식으로 진행한 뒤 결과를 보고

보고는 작업 단위가 끝났을 때 한 번에. 중간에 "이렇게 할까요?"로 끊지 않는다.

---

## 현재 진행 상태

### Phase 1: 데이터 탐색 ✅ 완료
- 3개 데이터 소스 정상 작동 확인
- 기관/외국인 수급 데이터 pykrx에서 무료 제공 확인
- TradingView-Screener 라이브러리 연동 가능 확인

### Phase 1.5: 기획 ✅ 완료

| 작업 | 상태 | 비고 |
|------|------|------|
| 앱 방향 재설계 | ✅ 완료 | Bottom-up → Top-down + Bottom-up 병행 |
| PC 앱 전환 결정 | ✅ 완료 | Tauri + React |
| 로직 정의서 작성 | ✅ 완료 | `docs/로직.md` |
| 종합 점수 계산식 | ✅ 완료 | 품질(50) + 밸류(20) + 개선(30) |
| 테마 신뢰도 계산식 | ✅ 완료 | 거래량(30) + 수급(50) + 동반상승(20) |
| 방향예측 로직 | ✅ 완료 | 시그널 기반 단순 판단 (AI 예측 아님) |
| 타이밍 지표 로직 | ✅ 완료 | RSI/MACD 기반, 신뢰도와 별도 독립 운용 |
| 팀 회의 자료 | ✅ 완료 | `docs/시야_회의자료_앱방향재설계.pptx` |
| 팀 리뷰 | ✅ 완료 | 기획서 v4 검토 완료, 개발 진행 확정 |

### Phase 2: 데이터 모델 설계 ✅ 완료
- [x] DB 스키마 설계 (14개 테이블: stocks, price_daily, valuation, financials, investor_trading, themes, stock_themes, technical, users, watchlist, disclosures, dividend_schedule, user_themes, user_stock_themes)
- [x] 테마-종목 매핑 방식 확정 (반자동: 업종코드 1차 분류 → 수동 검수) → 실제 매핑 작업은 Phase 3 초반에 실행
- [x] 데이터 수집 파이프라인 설계 (서버에서 수집 + 일일 자동 갱신)
- [x] 업데이트 주기 및 방식 결정 (앱 실행 시 자동 + 수동 버튼)
- [x] 아키텍처 결정 (SQLite → Supabase 전환)

**아키텍처 결정 (2026-03-31):**
- SQLite(로컬) → **Supabase(클라우드)** 전환
- 이유: 멀티 디바이스(사무실+집), 로그인, 관심종목 동기화 필요
- Supabase 구성: PostgreSQL(DB) + Auth(인증) + Edge Functions(수집 스케줄)

**DB 설계 결정 사항:**
- 재무제표 금액: **백만원** 단위로 변환 저장
- 일별 시세 보관: **3년** (종목당 ~750행, 전체 ~200만 행)
- PER/PBR 저장: **일별** (pykrx 제공 기준 그대로)
- 점수는 DB에 저장 안 함 — 원본값만 저장, 점수는 앱에서 계산

**데이터 수집 파이프라인:**
- 초기 셋업: 서버에서 1회 실행 (사용자 대기 없음)
  - 수집 순서: stocks → themes/stock_themes → price_daily(3년) → valuation(3년) → financials(3년) → investor_trading(30일) → technical(30일)
- 일일 갱신: 서버에서 자동 스케줄 (장 마감 후) + 앱에서 수동 새로고침 버튼
- 수집 모듈: `src/data/collectors/` 하위에 소스별 별도 모듈
- 에러 처리: 3회 재시도, 실패 시 건너뛰고 로그 기록, ON CONFLICT DO NOTHING으로 중복 방지

### Phase 3: MVP 개발 ⬅️ **현재 진행 중**

**Supabase 프로젝트 정보:**
- Project URL: `https://txdxoplddwfdbbyenyzl.supabase.co`
- Region: Northeast Asia (Seoul)
- anon key: 설정 완료 (`.env`에 저장 필요)

- [x] Supabase 프로젝트 생성
- [x] DB 테이블 생성 (schema.sql 실행) — 11개 테이블 + RLS + 인덱스 + 트리거 완료
- [x] 테마 등록 (20 → 27개로 확장, 2026-04-17)
- [x] 종목 마스터 수집 (KOSPI 950 + KOSDAQ 1,823 = 2,773개)
- [x] 종목-테마 매핑 (27개 테마, 총 198개 매핑, 수동)
- [x] 데이터 수집 모듈 개발 (Python)
  - [x] 일별 시세 (price_daily) — 2,783개 종목 3년치
  - [x] 재무제표 (financials) — 2,328개 종목 3개년(2022~2024)
  - [x] 밸류에이션 (valuation) — PER/PBR 자체 계산 2,454개 종목 (시세+재무+발행주식수)
  - [x] 기관/외국인 수급 (investor_trading) — 한국투자증권(KIS) API로 수집 완료
  - [x] 기술지표 (technical) — RSI/MACD 자체 계산 2,674개 종목
  - [x] 공시목록 (disclosures) — DART API, 1시간 간격 수집 (GitHub Actions)
  - [x] 배당 일정 (dividend_schedule) — KIS API, 날짜별 일괄 조회, 주 1회 수집 (GitHub Actions)
- [x] Tauri + React 프로젝트 셋업 — `app/` 하위에 생성 완료
- [x] 로그인 화면 (Supabase Auth) — 이메일/비밀번호 가입+로그인, 이메일 인증 OFF
- [x] 3단 레이아웃 기본 구조 (Header, LeftPanel, CenterPanel, RightPanel)
- [x] Supabase 연동 확인 (Auth 로그인 + themes 테이블 조회 정상)
- [x] 최종 PC 목업 v5 작성 (`docs/siya-pc-mockup-v5.html`)
- [x] 테마 분석 모드 (Top-down) — 신뢰도/타이밍/종합점수 계산 + 테이블 UI 완료
- [x] 스크리너 모드 (Bottom-up) — 5개 필터 슬라이더 + 자격필터 + 종합점수 테이블 완료
- [x] 종목 상세 화면 — 종합점수 바 차트 + 핵심지표 컬러코딩 + 동종업계 비교 + 재무추이 완료
- [x] 시야 AI — Claude API 직접 호출, 종목 DB 컨텍스트 포함, 채팅 UI + 빠른 질문 완료
- [x] 관심종목 (watchlist) — 추가/삭제/메모, 관심종목 탭 + 테이블 리스트 완료
- [x] 종목 업종(sector) 데이터 수집 — fdr.StockListing('KRX-DESC') Industry 필드로 2,769개 종목 업데이트
- [x] 동종업계 비교 작동 확인 — sector 데이터 채워져서 ROE/PER/PBR 수평 바 + 업종 평균 마커 정상 표시
- [x] UI 목업 비교 및 수정 — 방향 아이콘 색상, 타이밍 이모지(🟢🟡🔴), RSI/GC 수치 표시
- [x] Claude API 키 설정 — `app/.env`에 `VITE_ANTHROPIC_API_KEY` 입력 완료 (크레딧 충전 필요)
- [x] ⓘ 툴팁 + 도움말 페이지 — 점수/신뢰도/타이밍/동종업계 등 지표 설명 (fixed 툴팁 + ❓ 도움말 모달 6개 섹션)
- [x] 3단 패널 비율 조정 + 폰트 키우기 — 좌측 340px, 우측 420px, 기본 15px, 테마명 16px, 테이블 14px
- [x] 52주 최고/최저가 밴드 (2026-04-16) — 종목상세 현재가 아래에 배치, 현재가 위치 % + 저점/고점권 색상 그라데이션
- [x] 경쟁사 개별 비교 테이블 (2026-04-16) — 동종업계 비교 아래, 업종 점수 상위 5개 + 선택 종목 보장 + 업종 평균 행
- [x] 이동평균선 (2026-04-17) — 캔들차트에 20/60/120일 SMA 토글 + 골든/데드크로스 상태 뽃지 + 범례 + 종목명 워터마크

### 진행 예정 (미루둔 작업)
- [x] 한국투자증권 오픈API 연동 — 수급 수집 + 캔들차트 + 시세 교체 완료 (2026-04-10~11)
- [x] 실시간 현재가 조회 시도 → Edge Function 해외 IP라 KIS API 차단 확인 → 기능 제거 (2026-04-15)
- [x] 한투 API 확장 — 배당 DPS/수익률 수집 완료 + 배당 일정(dividend_schedule) 수집 완료 (2026-04-16)
- [ ] 상용화 시 실시간 검토 — 한국 서버 프록시 필요 (⬇️ 실시간 데이터 로드맵 참고)
- [x] Vercel 커스텀 도메인 연결 — stocksiya.com (Namecheap 구매 + Vercel DNS + SSL, 2026-05-26 완료)
- [x] 스플래시 화면 (2026-05-26) — 상승 차트 애니메이션 + 시야 소개 모달 + stocksiya.com 도메인 표시
- [x] GitHub Public 전환 (2026-05-19) — Actions 무제한 + KIS 토큰 캐시 gitignore 추가
- [x] 우선주 재무데이터 복사 (2026-05-26) — daily_update.py Step 2b 추가
- [x] 시야 AI 개선 (2026-05-27) — 답변 빈줄 축소 + 중지 버튼 + localStorage 대화 저장(종목별 20개, 50종목)
- [x] 기관/외국인 수급 UI (2026-05-27) — 중앙 시세/수급 차트 토글 + 우측 요약 카드 + 일별 테이블
- [x] 수급 차트 개선 (2026-05-28) — 막대+꿐은선 분리, 모달 버튼 수정, 워터마크 제거, 색상 통일
- [x] 수급 수량 데이터 (2026-05-28) — DB 컨럼 + 수집 코드 + UI 금액/수량 병기
- [ ] PC 앱 배포 (Tauri exe) — 웹 배포 1~2주 사용 후
- [ ] 사용자 피드백 반영
- [ ] app/.env에서 VITE_ANTHROPIC_API_KEY 줄 삭제 (더 이상 필요 없음)
- [x] **FX(환율) 분석** (2026-06-04 논의 → 2026-06-17~19 완료)
  - 배경: 일부 종목은 원/달러 환율과 상관관계 높음(수출주=양의 상관, 항공·정유 등=음의 상관). retail에 직관적인 보조지표로 가치 있음. (실측 결과 국내 대형주는 외국인 자금흐름 영향으로 대부분 음의 상관)
  - 3개 기능 묶음:
    1. ✅ **환율 민감도 지표**: 종목 일별수익률 vs 원/달러 일별변동률의 상관계수 + 강도 범주. (완료 2026-06-18, 베타 숫자는 미표시 결정)
    2. ✅ **산점도**(모달/ⓘ): x=환율변동, y=주가변동 + 회귀선. 베타·상관을 시각적으로 납득시키고 과신 방지. (완료 2026-06-19)
    3. ❌ **캔들차트 "환율" 토글(오버레이) — 미채택** (2026-06-19 결정): 산점도와 정보 중복 + 겹친 선 착시 위험 + 음의 상관 지배로 혼란 → 비용 대비 가치 낮음. 상세는 2026-06-19 의사결정 기록 참고.
  - 주의(필수 설계): 겹친 선은 상관을 과대하게 느끼게 함(착시) → 오버레이는 반드시 상관/베타 수치와 세트 + 정규화 기준 명시 + ⓘ "과거 데이터, 인과 아님". 민감도는 시기마다 변함(단기/중기 두 기간 병기 고려).
  - 데이터: 원/달러 일별 시계열 필요(KIS/FDR 가능 여부 확인, 안되면 무료 환율 소스). 수치만이면 미리 계산 저장 가능하나 산점도/오버레이는 원천 시계열 접근 필요.
  - 기간 명시(60/120일 등)는 시야 기존 패턴 따름.
- [x] **TTM(최근 4분기) 이익 전환** (2026-06-22 점검 → 06-24 완료) — PER/EPS를 직전 연간 → TTM 기준으로 전환(네이버·FnGuide 표준 일치). ①분기 수집(`collect_quarterly.py`, 고유 2,613종목) → ②결산월 백필(`backfill_settle_month.py`, FDR `SettleMonth`) → ③TTM 계산(`compute_ttm.py` → `ttm_earnings`, basis **ttm 2,442/annual 331**) → ④`update_valuation` EPS=TTM 지배주주순이익 + `valuation.eps_basis` → ⑤프론트 TTM/연간 배지(`EpsBasisBadge`). 전종목 ~88%가 TTM 기준 PER, 나머지 연간 폴백.
  - 게이트: `settle_month='12' AND TTM 3값(FY/올해동기/작년동기) 구비`. 비12월·분기미비·SPAC은 연간 폴백. 음수 TTM은 그대로 저장(적자 신호).
  - 최신 분기 **자동 감지**(`detect_ttm_period`) — 8월 반기(2026Q2) 수집 시 코드 수정 없이 자동 전환. **8월 액션은 위 의사결정 기록 "TTM 8월 반기 대비" 참고**(⚠️ `collect_quarterly`는 `--resume` 없이 전체 재실행).
  - 백로그 닫힘: SPAC 매출 falsy 오추출 버그 수정 + 하나34호스팩 오염행 정리.
- [ ] **실시간/프로그램매매 (향후 검토 — 2026-06-18 조사)**
  - 증권사 교체 불필요: KIS 무료 API가 REST(배치) + 웹소켓(실시간) + 주문까지 다 제공. 대신증권 크레온은 Windows COM(32bit)+HTS세션 필수라 GitHub Actions(리눅스) 불가 → 부적합.
  - "유료로 batch 고속화" 옵션은 KIS에 없음. 속도/실시간은 비용이 아니라 방식(REST→웹소켓)으로 해결.
  - 실시간 시세: KIS 웹소켓. 단 세션당 41종목 제약 → "전 종목 실시간" 불가. 표준 패턴 = 사용자가 보고 있는 종목만 구독/해지.
  - 준실시간(10~30분 간격): REST 폴링 + 유량제어(초당 20건 제한, 동적 배치/지연). 대상 종목 좁히기 필수.
  - 결론적 설계 방향: "전 종목 일별 배치(야간) + 보는 종목만 실시간(장중)" 하이브리드.
  - 현 3시간 배치는 KIS가 느려서가 아니라 전종목 순차조회+0.4s 레이트리밋 누적 때문. 급하지 않으면 유지, 최적화 시엔 병렬화/증분수집 검토.

---

## 앱 화면 구성

> 📌 최종 목업: `docs/siya-pc-mockup-v5.html` (브라우저에서 열어서 확인)

```
┌────────────────────────────────────────────────────────────────┐
│  시야  [테마 분석] [스크리너]          🔍 검색  user@email 로그아웃│
├──────────────┬─────────────────────────┬───────────────────────┤
│              │                         │                       │
│   테마 목록   │      종목 리스트         │     종목 상세         │
│   (좌측)     │       (중앙)             │      (우측)          │
│              │                         │                       │
│  · AI/반도체 │  삼성전자  005930        │  현재가: 82,300      │
│  · 2차전지   │  ROE 15.2% PBR 1.42     │  등락률: +2.3%       │
│  · 바이오    │  종합점수: 57.75점       │                      │
│  ...        │  ...                     │  [재무 차트]          │
│              │                         │  [동종업계 비교]       │
│              │                         │  [시야 AI]            │
│              │                         │                       │
└──────────────┴─────────────────────────┴───────────────────────┘
```

---

## 주요 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 로직 정의서 | `docs/로직.md` | 화면별 로직, 점수 계산식 |
| DB 스키마 | `docs/schema.sql` | Supabase 10개 테이블 + RLS 정책 |
| 팀 회의 자료 | `docs/시야_회의자료_앱방향재설계.pptx` | 방향 전환 설명 PPT |
| PPT 생성 스크립트 | `docs/create_v3_full.js` | pptxgenjs 스크립트 |

---

## 의사결정 기록

### 2026-08-25~27: 분기 재무 2023~2024 백필 (B-3) ✅ 완료 — `--years` 백필 모드 신설

- **배경**: B-1 6컬럼 확장 후, 시야트레이더 팩터가 과거 분기(2023~2024)까지 필요 → `collect_quarterly.py`가 최근 2개 연도(`QUARTER_YEARS`)만 보던 것을 **`--years 2023 2024`로 과거 연도 백필** 가능하게 확장.
- **코드 변경 (`collect_quarterly.py`, 커밋 `28fd51d` — 이 파일만 커밋)**:
  - `eligible_combos(years=...)`: 과거 연도는 제출기한 컷오프가 전부 지나 **Q1~Q3 6조합** 전부 대상.
  - `get_codes_with_fy(year)`: **그 해 FY 행 보유 종목만 조회** — 그 해 상장도 안 된 종목 헛콜 제거(백필 전용 프록시). 재개 판정 분모에서도 빼야 영영 미완료로 남지 않음.
  - **재개 판정 교체**: `get_existing_quarter_pairs()` 기반 **'대상 조합 전부 채움'** 기준으로 통일(백필·정기 공통). 8/20 `--resume` 버그('아무거나 있으면 완료')와 '최신분기 유무' 방식을 **둘 다 포섭** → 백필 중단분·새 분기 추가 모두 정확히 이어받음. 옛 `get_codes_with_latest_quarter()`는 히스토리 보존용으로 미사용 상태 유지.
- **1일차 실행 결과** (`logs/quarterly_backfill_2023_2024_day1_20260825.log`):
  - FY 보유 종목: **FY2023 2,429 / FY2024 2,557** → 조회 대상 **2,563종목**(전체 2,773 중, 210종목은 두 해 모두 FY 없어 제외). 조회 조합 6개(2023 Q1~Q3, 2024 Q1~Q3). 예상 콜 ~15,378(최선)/~20,760(현실).
  - **1,200/2,563에서 한도 가드(8,508콜) 정상 중단** — 성공 1,185 / 건너뜀 29(분기 미제출) / **오류 0**.
  - DB 검증: 2023 Q1~Q3 1,070·1,086·1,136 / 2024 Q1~Q3 1,158·1,178·1,174 = **합 6,802행**(성공 1,185종목 x 6조합과 정합).
- **2일차 실행 결과** (8/26, `--resume`, `logs/quarterly_backfill_2023_2024_day2_20260826.log`):
  - 재개 대상 **1,490종목** → 1,100/1,490에서 한도 가드(8,509콜) 정상 중단. 성공 1,072 / 건너뜀 62 / **오류 0**.
  - 누적 분기행 **12,213**(1일차 6,802 → +5,411). 2023 Q1~Q3 1,913·1,944·2,026 / 2024 Q1~Q3 2,082·2,118·2,130.
  - **재개 대상 산술 불일치(1,349 예상 → 1,490 실제)의 정체**: 새 재개 판정이 '대상조합 **전부** 채움' 기준이라, **분기를 일부만 제출한 종목**(예: 반기·연간만 제출하는 중소형)은 1일차에 '성공' 처리됐어도 6조합을 못 채워 **다시 대상으로 잡힌다**. 즉 `--resume`은 미완성 종목을 계속 재조회하며, **분기 미제출 종목에 대해서는 수렴하지 않는다**(구조적 특성, 버그 아님).
- **3일차 완주 (8/27, `logs/quarterly_backfill_2023_2024_day3_20260827.log`)**: 재개 대상 645 → **전량 처리**(성공 573 / 건너뜀 72 / 오류 0, 4,990콜로 한도 미도달).
- **✅ 최종 결과**: 대상 2,563종목 전부 1회 조회 완료. **분기행 14,152**(1일차 6,802 → 2일차 12,213 → 3일차 14,152). 채움률 **94.5%**(14,152 / 14,973 = FY2023 2,429×3 + FY2024 2,562×3).
  - 연도·분기별: 2023 Q1~Q3 2,214·2,252·2,341 / 2024 Q1~Q3 2,413·2,461·2,471.
  - **B-1 6컬럼 채움률(2023~2024 분기행 기준)**: cfo 99.9% · 현금성 99.4% · 유동자산 98.7% · 유동부채 98.5% · 매출총이익 92.3% · 매출원가 90.9% (+ net_income_owners 99.6%). **연간 수집(cfo 99.7%…)과 서열·수치 모두 정합** = 업종 특성 재현. B-3 목적(과거 분기 팩터 원자료 확보) 달성.
- **남은 344종목은 영구 미완성(정상)**: 미착수 72(DART에 분기 재무 자체 없음 = 3일차 건너뜀분) + 일부만 채움 272(반기·연간만 제출하는 중소형). **재실행해도 전부 헛콜이므로 여기서 종료.** `--resume`이 '재개 대상 0'을 만들지 못하는 것은 앞서 기록한 판정 기준의 구조적 특성.
- **실행 메모**: 로컬 실행은 conda `siya` 환경(`C:/Users/easte/.conda/envs/siya/python.exe`) — Git Bash에서 base anaconda python 직접 호출 시 numpy DLL 로드 실패. `PYTHONIOENCODING=utf-8` + cmd 리다이렉트로 UTF-8 로그(PowerShell 리다이렉트는 UTF-16). **stdout 블록 버퍼링** 때문에 실행 중 로그가 0바이트로 보일 수 있음 — 실시간 확인이 필요하면 `python -u`.

### 2026-08-13: 재무 계정 확장 (B-1) — 총이익성·Piotroski F-score 원자료 6컬럼 추가

- **배경**: 별도 프로젝트 시야트레이더(자동매매) 종목선정에 정통 팩터(가치×수익성 + Piotroski F-score 밸류트랩 게이트)를 도입하려는데, `financials`의 기존 8계정으로는 총이익성(GP/자산, Novy-Marx)·유동비율(F⑥)·발생액(F②④, CFO)이 계산 불가. 핸드오프(`docs/핸드오프_재무확장.md`)가 4종=6컬럼 확장을 요구. **시야는 원자료만 채우고, 팩터 산출은 소비자(시야트레이더) 몫.**
- **실측 선행 (게이트)**: `check_financial_expansion.py`(일회성 진단, 샘플 28종목 제조/바이오/서비스/금융/유통/지주 혼합)로 사전 검증 — 이 프로젝트 확립 워크플로(샘플 진단 → 전체 실행).
  - **핵심 전제 확인 — finstate_all에 CF 구간 100% 포함(28/28)** → CFO를 별도 조회 없이 같은 df에서 추출 가능. 설계 성립.
  - 부재는 전부 업종 특성 NULL(금융·순수서비스의 매출원가/유동구분 부재)로 깨끗하게 갈림. CFO는 금융 포함 100%.
- **추가 컬럼 6종 (연간·분기 공용, 백만원)**: `cost_of_sales`·`gross_profit`·`cash_and_equiv`·`current_assets`·`current_liabilities`·`cfo`. `docs/migrate_financials_expansion.sql`로 `ADD COLUMN IF NOT EXISTS` + `NOTIFY pgrst`(owners 선례 형식).
  - account_id 우선 매칭: 매출원가 `ifrs-full_CostOfSales` / 매출총이익 `ifrs-full_GrossProfit` / 현금성 `ifrs-full_CashAndCashEquivalents` / 유동자산 `ifrs-full_CurrentAssets` / 유동부채 `ifrs-full_CurrentLiabilities` / CFO `ifrs-full_CashFlowsFromUsedInOperatingActivities`. 이름 폴백은 소수 안전장치(실측상 거의 account_id 매칭).
  - **CFO는 `sj_div='CF'` 구간에서 추출** — `extract_financials`가 기존 IS/CIS/BS만 봤으나 CF 구간 추가. 분기(cumulative=True)면 `_amount`가 `thstrm_add_amount`(누적)를 우선하므로 CFO도 누적, BS 3종은 시점 잔액이라 thstrm 폴백.
  - **매출총이익 산출**: GrossProfit 직접 계정 우선 → 없으면 `revenue − cost_of_sales` 계산 폴백. 실측상 보유 종목은 전부 직접 계정(폴백 발동 0).
- **코드 변경**:
  - `financials_common.py`: CF 구간 + 6계정 추출 + gross_profit 폴백. 반환 dict 6키 추가. (연간·분기 공용이라 한 곳 수정으로 둘 다 반영)
  - `collect_financials.py`: 저장 dict 6컬럼 + **`--expand` 재수집 게이트**(`cfo IS NULL` 기준, 중단/재개 가능). 기존 `--remigrate`(net_income_owners 기준)와 분리 — remigrate는 지금 전부 완료라 게이트로 못 씀.
  - `collect_quarterly.py`: 저장 dict 6컬럼(게이트 무변경, 8/15 전체 재수집 예정).
  - `daily_update.py`: 우선주 복사(Step 2b) dict에 6컬럼 추가 — 안 하면 삼성전자우·현대차2우B만 6컬럼 NULL(반쪽). 매일 도는 로직 중 유일한 확장 지점.
- **검증**: mock df 단위테스트 5케이스(GP직접/GP계산폴백/음수CFO보존/금융NULL/분기누적) 전부 통과.
- **연간 재수집 완료 (`--expand`, 2일 분할)**: 1차 2,599종목 9,002콜 → 2차 잔여 171성공/158건너뜀/2오류 680콜.
  - **커버리지(FY 7,603행)**: cfo 99.7%(7,583) · 현금성 98.6%(7,500) · 유동자산 97.8%(7,436) · 유동부채 97.2%(7,389) · 매출총이익 90.2%(6,857) · 매출원가 89.0%(6,763). NULL 비율이 "매출총이익 > 유동구분 > 현금성 > CFO" 순 = 업종 특성과 정합(총이익성 부적합 업종이 가장 넓음).
  - 검증 종목: 삼성전자 6컬럼 전부 채움(GP 2025 131조), KB금융 5컬럼 NULL·cfo만 채움(은행 정상).
  - 건너뜀 158 = 우선주·SPAC·신규/폐지·부실 소형주(DART 재무 없음, owners 재수집과 동일 꼬리). 오류 2건 = upsert 실패, cfo NULL로 남아 다음 `--expand` 시 self-heal.
- **분기 백필 완료 (8/20, `--resume` 버그 수정 포함)**: `collect_quarterly.py` 전체 재수집로 2026 Q2 신규 + 2025 Q1~Q3·2026 Q1 기존 분기행 6컬럼 백필 완료. 2026 Q2 행수 2,540(2025 Q2 2,592와 나란함). 이후 `compute_ttm.py`로 TTM 재계산(2026Q2 자동 감지, basis ttm 2,442/annual 331).
  - **분기 커버리지(Q1~Q3 11,679행)**: cfo 60.1%(7,022) · 유동자산 58.5%(6,837) · 매출총이익 54.7%(6,387). ← 연간(99.7%)보다 낮게 보이나 정상: 분모에 '제출 안 한 분기'(많은 중소형이 분기 생략, 반기·연간만 제출)가 섮여 분모가 부풀. 서열(cfo>유동>매출총이익)은 연간과 동일 = 업종 특성 재현.
  - **🚨 `--resume` 버그 발견·수정 (중요 교훈)**: 8/20 1차가 8,500 가드에서 끊긴 뒤 `--resume`으로 이어받았는데, 구(구) 게이트 `get_codes_with_quarterly`가 **'Q1/Q2/Q3 중 아무거나 행 있으면 완료'**로 판정 → 기존 분기행(2025·2026Q1)만 있고 **2026 Q2는 없는** 종목을 전부 건너뛰어 **2026 Q2가 절반(1,400)만 수집되는 사고**. compute_ttm도 최신분기를 Q1로 오감지.
    - **수정**: 게이트를 `get_codes_with_latest_quarter(latest_year, latest_q)`로 교체 — **'최신 분기'(2026 Q2) 행 유무**로 판정. 최신 분기는 `max(eligible_combos(), key=lambda c:(c[0],c[2]))`로 산출(⚠ combos는 [올해,작년]×Q1→Q3 순이라 **리스트가 시간순이 아니다** — `[-1]`은 2025 Q3 반환, 반드시 정렬 최댓값). 하드코딩 없이 시점만 바뀌면 자동 갱신.
    - **교훈**: '새 분기 추가 수집'과 '한도 분할 이어받기'는 다른 상황. 전자는 `--resume` 금지(전체 재실행), 후자는 `--resume` 허용. 수정 후엔 `--resume`가 '최신분기 없는 종목'만 이어받아 둘 다 안전. (수정 후 재실행: 남음 1,373 → 성공 1,213/건너뜀 160, 2026 Q2 2,540 복구)
- **핸드오프 §5 회신 완료** — `docs/회신_재무확장_B1.md` 작성(시야트레이더가 읽고 팩터 조작적 정의 확정용). ①추가컬럼 ②커버리지(연간+분기) ③예외 ④매출총이익 산출 ⑤예상외 + F-score 9항목 매핑(②④⑥⑧ 이번 확장으로 성립) + 팩터 산출 주의(분기행 누적·음수CFO·NULL은 0 아님).
- **자동화 영향 없음**: 재무/분기 수집은 GitHub Actions 미등록(시즌별 수동), daily_update는 6컬럼 미소비(EPS는 net_income_owners만) → 워크플로 신설·수정 불필요. 6컬럼은 향후 시즌 수집에 코드로 자동 포함.
- **파일**: `src/data/collectors/financials_common.py`, `collect_financials.py`, `collect_quarterly.py`(--resume 버그 수정), `daily_update.py`, `check_financial_expansion.py`(진단), `docs/migrate_financials_expansion.sql`, `docs/회신_재무확장_B1.md`.

### 2026-06-24: PER 적자 표시 (PER "0" → "적자")

- **배경**: 적자 종목(EPS<0 → `daily_update`가 PER<0을 **0으로 폴백**)이 화면에 "PER 0"으로 떠 **초저평가 착시**(SK이노 "PER 0 / 업종평균 16.5"로 싸 보임). PER 0은 현실에 없는 값 → "적자"가 정확(측정불가) + 이유까지 전달(KRX도 음수지표 "산출불가" 관행).
- **구분**: `per === 0` ⟺ **적자**(EPS<0 폴백) / `per === null` ⟺ **데이터 없음**(EPS NULL, 신규상장 등). `daily_update`가 `eps<0`만 per 0 처리하고 `eps==0`/없으면 per NULL이라 깔끔히 갈림.
- **처리**:
  - PER `=== 0`일 때 숫자 자리에 **"적자"**(회색 뮤트 `.per-loss`, 경고색 아님 — 사실 전달). 전 위치 일관: 종목상세 핵심지표 카드(`MetricCard`에 `display` prop 추가) + 데스크톱 테이블 + 모바일 리스트.
  - **TTM/연간 배지는 유지** — "TTM 기준으로 봤더니 적자"가 완성(어떤 EPS 기준인지는 별개 정보).
  - **정렬**: PER 정렬 시 적자(0)를 `null`처럼 **맨 뒤로**(저평가 오인 방지). 데스크톱(CenterPanel)·모바일(MobileStockList) 둘 다.
  - **스크리너 필터**: 기존 `per <= 0 제외`로 이미 적자 거름(확인만, 무변경).
- **검증**: SK이노(per 0, eps −12,744) "적자"+TTM 배지 / 삼성전자(per 21.75) 숫자+TTM 배지 무회귀 / 빌드 통과. 최신일 적자 978종목.
- **파일**: `RightPanel.tsx`(MetricCard display), `CenterPanel.tsx`(정렬+렌더), `MobileStockList.tsx`(정렬+렌더), `App.css`(.per-loss).

### 2026-06-24: TTM 8월 반기 대비 — compute_ttm 최신분기 자동 감지 전환

- **점검 발견**: `compute_ttm.py`가 기준 분기를 **하드코딩**(`BASE_FY=2025/Q_CURR=(2026,Q1)/...`)했었음 → 8월 2026 반기보고서 나오면 수동으로 Q2로 바꿔야 했음. 또 분기수집·TTM계산 모두 **자동화(워크플로/daily_update) 연결 없음** — 수동 실행 전용.
- **수정**: `detect_ttm_period()` 추가 — 수집된 분기행(`source='dart_q'`)에서 최신 기준 분기를 **데이터 기반 자동 감지**. 최신 연도에서 '충분히 제출된'(최다 분기의 `_QUARTER_SUBMIT_RATIO=70%` 이상) 최신 분기를 `q_curr`로, 1년 전 동분기를 `q_prior`로, 그 직전 사업연도를 `base_fy`로. 비율 게이트로 *일찍 제출한 소수 종목의 분기를 최신으로 오인하는 것 방지*(덜 수집된 분기면 자동으로 직전 분기 유지 = 안전 보수). **검증**: 현재 데이터에서 `2026Q1` 정확 감지, basis ttm 2,442/annual 331로 하드코딩 때와 동일(무회귀). → **8월에 2026Q2 수집만 하면 코드 수정 없이 TTM이 FY2025+2026Q2−2025Q2로 자동 전환.**
- **`collect_quarterly` 자동성 확인**: `eligible_combos()`의 제출기한 컷오프(반기=8/15)가 `datetime.today()` 기준이라 8/15 이후 **2026 Q2를 연도까지 자동 포함**(O). 단 ⚠️ **`--resume`은 "분기행 보유 종목 전체 skip"이라 새 분기 증분 불가** → 8월엔 `--resume 없이 전체 재실행`해야 2026Q2가 들어옴(기존 분기행은 upsert 갱신).
- **📌 8월 액션 아이템 (2026 반기보고서 마감 ~8/15 이후)**:
  1. `python collect_quarterly.py` 실행(**--resume 없이 전체**) — 2026Q2 자동 수집. DART 8,500 가드로 2일 분할 가능.
  2. `python compute_ttm.py` 실행 — 2026Q2 **자동 감지**, TTM 전환(코드 수정 불필요).
  3. (자동) daily_update가 매일 16:00 새 `ttm_earnings` 읽어 `valuation.eps_basis` 갱신.
  - 🚨 **함정 — 8월엔 절대 `--resume` 쓰지 말 것**: `--resume`은 *종목 단위* skip(분기행이 하나라도 있으면 그 종목 통째로 건너뜀)이라, 이미 2025Q1~Q3·2026Q1을 가진 종목 전부를 건너뛰어 **새 분기(2026Q2)가 안 들어옴**. 반드시 **`--resume 없이` 전체 재실행**해야 Q2가 추가된다. (`--resume`은 *최초 2일 분할 수집 중단→재개* 같은 동일 분기셋 이어받기 전용. 2일 분할은 8,500 가드에서 자동 중단되며, 이때의 재개는 OK — 새 분기를 '추가'하는 8월 실행과는 목적이 다름.)
  - 향후 옵션: `collect_quarterly`에 분기 증분(`--quarter 2026Q2`) 모드 추가하면 8월 전체 재수집 부담↓ (현재는 미구현, 전체 재수집으로 충분).
- **파일**: `src/data/collectors/compute_ttm.py`.

### 2026-06-24: SPAC 분기데이터 오염 원천 수정 (백로그 닫음 ✅)

- **배경**: TTM 백로그였던 "SPAC 신탁계정 손익 오추출" 정리. 조사로 **원래 가정과 다른 그림** 확인.
- **메커니즘 (2가지로 분해)**:
  1. **revenue falsy 폴백 버그 (진짜 코드 버그)**: `revenue = by_id('ifrs-full_Revenue') or by_name('수익')`에서 SPAC은 영업수익(`ifrs-full_Revenue`)이 **0인데 `0`이 falsy**라 `or`로 넘어가 **'금융수익' 61.5조를 매출로 오추출**. 0과 None을 구분 못 함.
  2. **net_income 27.7조 = DART 원본 쓰레기값 (코드 버그 아님)**: `ifrs-full_ProfitLoss` account_id가 정확히 27.7조 반환. 하나34호스팩이 XBRL에 단위 잘못 기재(EPS 6원인데 순이익 27.7조 → 주식수 4.6조주, 물리적 불가). account_id 정확 매칭이라 **코드로 차단 불가**.
- **영향 범위 (예상보다 극소)**: SPAC 분기행 209개 중 오염(>1조) **단 1개**(하나34호스팩 2025 Q1), 연간행 0개. "79개 SPAC 광범위 오염" 아님 → 분기마다 누적되는 긴급 문제 아니었음.
- **조치 (A만, B 미채택)**:
  - **(A) revenue 0-falsy 버그 수정** (`financials_common.py`): `or` 체인 → **`_first(*vals)`**(None 아닌 첫 값, 0도 채택) 헬퍼로 일관 교체(revenue/op/net_income/BS 항목 전부). **사전 검증**: 금융지주·증권·보험 7개 샘플 모두 `ifrs-full_Revenue` **부재(폴백 유지) 또는 >0** — 0값 보유 종목 없음 → 금융사 매출 추출 무영향 확인 후 진행. **회귀 검증**: 하나34 revenue 61.5조→0, KB금융/신한/미래에셋/삼성생명 매출 폴백 그대로, 삼성전자 전 항목 정상.
  - **(B) net_income sanity 가드 — 미채택**: "비현실적 배수면 폴백" 휴리스틱은 정상 실적 급변동(턴어라운드·일회성 대규모 이익) 오탐 위험. DART 원본 오류 1건 때문에 전종목 휴리스틱은 과잉방어. **compute_ttm의 SPAC 강제폴백이 이미 (B)를 막고 있어(EPS 35 검증됨) 충분 — 게이트 유지**.
  - **하나34호스팩 1행 직접 삭제**: 2025 Q1 오염행(id=24313) 삭제. 나머지 분기행 정상(rev 131/204/55 백만원). 재수집은 DART 원본이 쓰레기값이라 무의미 → 삭제 채택(SPAC이라 TTM 대상도 아님, `--resume`이 기존 분기행 보고 skip하므로 부활 없음).
- **파일**: `src/data/collectors/financials_common.py`. **백로그 닫힘**.

### 2026-06-24: TTM ⑤ 프론트 배지 — TTM 전환 완료 🎉

- **⑤ TTM/연간 배지 (`valuation.eps_basis` 기준)**: PER이 나오는 **전 위치에 일관 적용** — 종목상세 핵심지표 PER 카드(RightPanel MetricCard) + 데스크톱 테이블 PER 컬럼(CenterPanel, 스크리너/테마/관심종목 공용) + 모바일 리스트(MobileStockList). `eps_basis='ttm'`→파란 "TTM" / `'annual'`→회색 "연간" / `null`·미상→**배지 숨김**.
  - **공용 컴포넌트** `components/common/EpsBasisBadge.tsx`: basis prop, null/미상이면 `null` 반환(자연 숨김). `title` 속성으로 hover 설명("TTM: 최근 4개 분기 합산 이익 / 연간: 직전 사업연도 이익").
  - **데이터 흐름**: `Valuation`·`StockListItem` 타입에 `eps_basis` 추가. 종목상세(`useStockDetail`)는 `select('*')`라 자동 포함. 나머지 3훅(`useScreenerStocks`/`useThemeData`/`useWatchlistStocks`)의 valuation select + ValInfo 타입 + StockListItem 매핑에 `eps_basis` 추가.
  - **도움말**: HelpPage 밸류에이션 섹션에 배지 의미 한 줄(샘플 배지 포함).
  - **검증**: `npm run build`(tsc+vite) 통과. 최신일 valuation 2,580행 중 **배지 표시 2,570 / 숨김 10**(eps_basis NULL = ④의 신규상장 소형주 — PER만 표시, 배지 없음으로 깨끗 처리). ③ ttm 2,442→2,437 감소분 5개도 이 NULL군에 포함돼 자연 숨김.
- **🎉 TTM 전환 완료 (①~⑤ 전 단계)**: ①분기 수집(2일 분할, 고유 2,613종목) → ②결산월 백필(FDR, '12'/비12월 게이트) → ③TTM 계산(`ttm_earnings`, basis ttm 2,442/annual 331) → ④EPS=TTM 전환(`valuation.eps_basis`) → ⑤프론트 배지. **전종목 ~88%(2,437)가 TTM 기준 PER, 나머지는 연간 폴백으로 일관 표시.**
- **푸시 주의**: ⑤는 프론트(Vercel 자동 배포)라 푸시 시 반영. ④ daily_update가 매일 16:00 eps_basis 채우므로 둘 다 푸시 필요.
- **백로그(✅ 닫힘, 2026-06-24)**: SPAC 분기데이터 원천 오염 — revenue falsy 폴백 버그 수정 + 하나34호스팩 오염행 삭제 완료. compute_ttm SPAC 게이트는 이중 안전장치로 유지. 상세는 위 "SPAC 분기데이터 오염 원천 수정" 기록 참고.
- **파일**: `app/src/components/common/EpsBasisBadge.tsx`(신규), `types/stock.ts`, `hooks/{useScreenerStocks,useThemeData,useWatchlistStocks}.ts`, `components/layout/{RightPanel,CenterPanel}.tsx`, `components/mobile/MobileStockList.tsx`, `components/common/HelpPage.tsx`, `App.css`.

### 2026-06-24: TTM ④ valuation 연동 (EPS=TTM 전환) + 분기행 회귀 점검

- **③ 결과 사후 점검 2건 (깨끗 → ④ 진행)**:
  1. **basis='ttm' 2,442 vs ②예상 2,490, 차이 48 완전 정산**: `2490 = SPAC 41 + owners NULL 7`. ②는 `stock_code 존재`만 봐서 SPAC 오염행도 카운트, ③은 `net_income_owners NOT NULL` + SPAC 제외를 추가 요구 → 데이터 손실 아님, 게이트 강화. ttm_earnings 실제 집합과 100% 일치 확인.
  2. **SPAC 27.7조 오염 전파 경로 점검 → 백로그 유지 OK**: 분기행(`source='dart_q'`)을 읽는 소비자 전수조사 — 프론트 4훅(useThemeData/useStockDetail/useScreenerStocks/useWatchlistStocks) + `daily_update.update_valuation`(fin_map)은 **전부 `fiscal_quarter='FY'` 필터** → 분기행 안 읽음. SPAC은 우선주 매핑 대상 아니라 우선주복사로도 전파 안 됨.
     - **단 별건 회귀 발견·수정**: `daily_update.py`의 우선주 복사(Step 2b)와 `calc_valuation.py`의 `get_latest_financials`가 `fiscal_quarter` 필터 없이 `order fiscal_year desc` → 분기행 도입 후 `fiscal_year=2026`(2026 Q1) 분기행이 최신 연간으로 오집힐 위험. **둘 다 `.eq('fiscal_quarter','FY')` 추가**로 차단(SPAC 무관, 분기행 도입 일반 회귀).
- **④ EPS=TTM 전환 (`daily_update.update_valuation`)**:
  - EPS 분자를 **`ttm_earnings.ttm_net_income_owners`(지배주주 TTM)** 기준으로 전환, `valuation.eps_basis`에 `ttm_earnings.basis` 복사. `ttm_earnings`에 없거나 NULL이면 FY financials로 최종 폴백(basis='annual'). **BPS는 지분=시점값이라 TTM 무관 → FY `equity_owners` 유지**.
  - 우선주(Step 2b): valuation upsert에 `eps_basis = cv.get('eps_basis')` 추가 — 보통주 기준(ttm/annual) 그대로 승계.
  - **검증(전종목 실행 + dry-run)**: eps_basis 분포 **ttm 2,437 / annual 133 / NULL 10**(합 2,570 = PER 완료 수). 삼성전자 ttm(EPS 7,571→14,254) / SK하이닉스 ttm(60,220→105,433, 2026Q1 호황 반영) / **신영증권 annual(6,607=6,607, 연간폴백 무손상)** / SK이노 적자(EPS −12,745, PER 0 처리) / **하나34호스팩 annual(EPS 35, 오염 27.7조 안 들어옴 — SPAC 가드가 EPS까지 보호)** / 삼성전자우 `eps_basis='ttm'` 승계.
  - **NULL 10개** = 신규상장 소형주(뉴엔AI·아이엠바이오로직스 등) FY/ttm 데이터 미수집 → skip된 옛 행. ④ 버그 아님. **⑤에서 `eps_basis=NULL` 배지 방어 필요**.
- **파일**: `src/data/collectors/daily_update.py`(update_valuation EPS=TTM + 우선주 eps_basis + 우선주복사 FY필터), `calc_valuation.py`(FY필터). 로그: `logs/update_valuation_ttm_20260624.log`.
- **푸시 주의**: 매일 16:00 GitHub Actions `daily_update`가 이 로직으로 PER/PBR 재계산 → **푸시해야** 자동 실행이 eps_basis를 채움(미푸시 시 옛 로직이 eps_basis NULL로 원복).
- **다음 단계**: ⑤ 프론트 TTM/연간 배지 — `valuation.eps_basis` 기준으로 PER 옆 "TTM"/"연간" 표기, NULL이면 배지 숨김. (백로그 유지: SPAC 분기데이터 원천 오염 `extract_financials` 수정)

### 2026-06-24: TTM 데이터 레이어 완성 — 결산월 백필(②) + TTM 계산(③)

- **②결산월 백필 (`backfill_settle_month.py`, `docs/migrate_stocks_settle_month.sql`)**: `stocks.settle_month` 컬럼(text) 추가 후 FDR `KRX-DESC.SettleMonth`로 백필. **DART 0콜**.
  - **게이트 통일(핵심 함정 회피)**: FDR `'12월'` → 숫자추출+zfill → **`'12'`(월 2자리)** 저장 → `compute_ttm` 게이트 `settle_month='12'`와 정확히 일치. 한글 '월' 남으면 게이트 전부 false 나 TTM 0종목 되는 함정.
  - 결과: 전종목 2,773 / **12월 2,587 · 비12월 54 · NULL 132**. 비12월 54는 6/24 실측(dart_q 모수 33)과 정합(모수가 전종목으로 넓어져 +21, 대부분 리츠). 신영증권(001720)=`'03'` 정확. NULL 132 = 우선주류 113 + 스팩 12 + 기타 7(FDR KRX-DESC=보통주 상장정보라 우선주·스팩 부재 → 폴백 정상).
- **③TTM 계산 (`compute_ttm.py` → `ttm_earnings`)**: 게이트 통과 종목의 TTM 지배주주/전체 순이익 적재.
  - 공식: **TTM = FY2025 + 2026Q1누적 − 2025Q1누적** (누적은 분기행 `thstrm_add_amount` 기반, 백만원 단위). 지배주주(net_income_owners) 기준 + 전체(net_income) 병행.
  - **전제 확인 통과**: 분기행 `net_income_owners` 99.8% 적재(10,251/10,268, 비지배 분리 실재 4,973행) → 멈출 사유 없음. `ttm_earnings` 스키마(OpenAPI로 확인: stock_code PK, ttm_net_income, ttm_net_income_owners, basis, as_of, components jsonb, updated_at)가 명세와 일치 → DDL 추가 불필요.
  - **basis 원천화**: 전종목 행 생성, `basis`로 `'ttm'`/`'annual'` 구분(행 없음=폴백 아님, 디버깅 지옥 회피). 폴백 행은 ttm_* 컬럼에 직전 FY값 넣어 ④복사 단순화(basis가 해석 주체). `components`(jsonb)에 계산근거(fy/q_curr/q_prior/각 구성값) 또는 폴백사유 기록. **NULL=폴백 / 0=유효 / 음수=그대로 저장**.
  - **결과: `basis='ttm'` 2,442 / `'annual'` 331** (폴백사유: spac 79 · non_dec_settle 54 · missing_quarter 50 · missing_fy 21 · unknown_settle 120 · null_owners 7).
  - **검증**: SK하이닉스 owners 99.9%(비지배 0.1%, 6/19 부합) / 삼성물산 62.9%(비지배 37.1%, 6/19 부합) / 음수 TTM 937종목(SK이노 -2.15조·LG화학 -2.06조 등 현실적) / 양수 상위 삼성전자 83조·하이닉스 75조 현실적.
- **⚠️ 발견 — SPAC 분기데이터 오염(원천)**: 하나34호스팩(484130) 2025Q1 행 `net_income=27.7조`(신탁계정 총액이 손익으로 오추출). TTM −27.7조 outlier 유발. → **`compute_ttm` 게이트에 종목명 '스팩' 강제 폴백(reason='spac')** 추가로 회피(6/22 SPAC 폴백 정책의 코드화). **단 `financials` 테이블의 오염 분기행은 잔존** — 스크리너 등 다른 소비자 영향 가능 → **백로그**: `collect_quarterly`의 `extract_financials`가 SPAC 신탁계정을 매출/손익으로 오추출하는 문제 별도 수정 필요.
- **파일**: `src/data/collectors/backfill_settle_month.py`, `compute_ttm.py`, `docs/migrate_stocks_settle_month.sql`.
- **다음 단계**: ④ `update_valuation`/`daily_update` 연동(EPS = `ttm_net_income_owners`÷주식수, `valuation.eps_basis = ttm_earnings.basis` 복사) → ⑤ 프론트 TTM/연간 배지(eps_basis 기준).

### 2026-06-24: TTM 분기 수집 빌드 1차 + 게이트 설계 확정

- **빌드 1차 완료 (커밋 `40b202d`)**: TTM(최근 4분기) 계산의 데이터 레이어.
  - `financials_common.py`(신규): 연간/분기 공용 추출 로직. `extract_financials(df, cumulative=...)` — `cumulative=True`면 분기 누적 컬럼(`thstrm_add_amount`) 우선, False면 연간(`thstrm`). 2026-06-22 점검에서 확정한 "누적은 add_amount" 원칙 반영.
  - `collect_quarterly.py`(신규): 분기 누적 재무를 `financials`에 적재(`source='dart_q'`, `fiscal_quarter`∈{Q1,Q2,Q3}). **제출기한 지난 분기만 조회**(`REPRT_FILING_CUTOFF` Q1=5/15·반기=8/15·Q3=11/15 이후, `eligible_combos()`) → 미제출 분기 헛콜 제거. 가드 `DART_DAILY_LIMIT=8500`(공시 수집과 한도 풀 공유 마진). `--resume`(분기행 있는 종목 skip)으로 이틀 분할.
  - `collect_financials.py`: 추출 헬퍼를 `financials_common` import로 전환(연간 동작 무변경).
  - `verify_quarterly.py`(신규): 분기 수집 검증(샘플 5종목, read-only).
- **분기 수집 현황**: 1일차 **1,773종목 적재**(분기행 6,974, 가드 8,501콜에서 정상 중단). 2일차 `--resume` 진행 중(남은 ~998, 우선주·SPAC 꼬리 구간이라 다수 건너뜀, ~5천콜 예상 1회 완주). 분기행은 **원자료만** 저장 — 비율(roe/roa/debt_ratio/operating_margin)은 의도적 NULL(분기 누적 비율은 연간과 직접 비교 불가 → TTM 단계에서 산출).
- **TTM 게이트 설계 확정**:
  - **TTM 적용 = `acc_mt='12'`(12월 결산) AND TTM 3값(직전 FY / 작년 동기 누적 / 올해 동기 누적) 전부 구비.**
  - 게이트 기준은 "분기 개수"가 아니라 **공식 성립 여부(계산 가능성)** — 6/22 점검의 "분기≥3" 표면 기준을 계산가능성 기준으로 정밀화.
  - **음수 TTM은 그대로 저장**(적자 신호, PER<0→0 처리는 표시단에서).
  - **비12월 ~33종목은 연간 폴백**(6/24 실측: dart_q 1,773 중 33개=1.9%, 대부분 소형주 + 리츠 11개라 TTM 부적합, 시총영향≈0. **신영증권(001720, 03월결산, KOSPI 시총~144위)만 유의미** → 인지하되 폴백 허용). 라벨 drift(비12월의 "2025 Q3"가 달력상 6개월 밀림) 위험은 게이트로 차단.
  - **`acc_mt` 소스 = FDR `StockListing('KRX-DESC').SettleMonth`**(DART 한도 안 씀, '12월' 형식. DART `acc_mt`와 값 일치 검증됨).
  - **비12월 정밀 TTM**(실제 회계기간 정렬 기반)은 **v2 백로그** — 현재는 연간 폴백으로 충분.
- **스키마(Supabase 적용 완료)**: `ttm_earnings` 테이블 신설 + `valuation.eps_basis` 컬럼 추가(TTM/연간 기준 표기용).
- **실행 주의**: 분기 수집 로그는 **UTF-16** 인코딩 → `Get-Content -Encoding Unicode`로 읽기. (PowerShell 리다이렉트 기본 인코딩. cp949 이모지 크래시 회피용 `PYTHONIOENCODING=utf-8`와 별개 이슈)
- **다음 단계**: ① 2일차 `--resume` 완주 → ② `acc_mt` 백필(FDR `SettleMonth` → `stocks` 결산월 컬럼) → ③ `compute_ttm.py` 구현(게이트 통과 종목 `ttm_earnings` 채우기) → ④ `update_valuation` 연동(EPS=TTM 지배주주순이익 기준, `eps_basis` 표기) → ⑤ 프론트 TTM 배지.
- **파일**: `src/data/collectors/financials_common.py`, `collect_quarterly.py`, `collect_financials.py`, `verify_quarterly.py`. 로그: `logs/quarterly_collect_day1_20260623.log`, `logs/quarterly_collect_day2_20260624.log`.

### 2026-06-22: TTM 전환 사전 점검 — 분기 데이터 품질 진단 (실질 80% 커버리지)

- **목적**: TTM(최근 4분기) 전환 빌드 전, DART 분기 재무가 쓸 만한지 검증. 일회성 진단 스크립트 `src/data/collectors/check_quarterly_coverage.py`(DB 저장 안 함). 샘플 30종목(대형5 고정 + 중형10 시총중위·업종분산 + 소형10 시총하위·거래정상 + SPAC5). DART finstate_all을 분기 reprt_code(11013/11012/11014/11011)로 조회.
- **검증 2지표 확정**:
  1. **누적 컬럼 함정 입증**: 분기보고서 손익은 `thstrm_amount`(당기 3개월)와 `thstrm_add_amount`(당기 누적)가 공존(삼성 2025반기 매출 74.5조 vs 153.7조). 1차 진단이 3개월값으로 누적 비교해 정상주까지 "누적정합 N" 오판 → `add_amount`로 교정하니 **전 종목 누적정합 Y**(스코넥 1건만 부실). **→ TTM 구현은 반드시 `thstrm_add_amount`(1Q·연간은 thstrm과 동일) 사용.**
  2. **account_id 매칭 N 원인 분류**(CFS 강제 + fs_div 표기): N 12건 = **개별만(OFS) 6 / 분기없음 4 / 연결O·ID없음 2**.
     - **개별만(OFS) 6건**(한양증권·삼진제약·일정실업·아이톡시·미래에셋스팩2): 연결재무제표 분기 미제출(종속회사 없어 연결 대상 아님) → 지배주주/비지배 분리가 무의미 → **전체 순이익 = 지배주주 순이익으로 TTM 적용 가능**(연간 수집의 `owners is None → net_income` 폴백과 동일 원리). **구제 대상.**
     - **분기없음 4건**: SPAC 3 + 신규상장(프로브잇) 1 → 연간 폴백 당연.
     - **연결O/ID없음 2건**(강원에너지·스코넥): 진짜 부재, 극소수.
- **결론(표면 60% → 실질 80%)**: 표면 18/30(60%)은 OFS-only를 전부 불가로 깐 과소평가. **실질 TTM 가능 ≈ 24/30(80%)** = 표면18 + OFS구제6. 진짜 불가 6/30(20%) = SPAC·신규 4 + 연결ID부재 2. 대형 100%, 중형·소형 핵심 종목 사실상 전부 커버 → **TTM 도입 타당**.
- **확정 커버리지 정책(다음 빌드 게이트)**: 종목별로 `분기 ≥3개 존재 AND (CFS 지배주주 ID 있음 OR 연결 미제출=OFS-only)` → TTM 적용(OFS-only는 전체순이익으로 계산). 그 외(분기없음·연결ID 진짜부재) → 연간 폴백. 기존 연간 수집의 지배주주 폴백 원칙과 일관.
- **다음 단계**: 분기 재무 수집기 + TTM 계산 빌드(직전연간 − 작년동기누적 + 올해동기누적, 누적은 add_amount). 기준일마다 최신 분기 1점만 증분 수집하면 됨.
- **파일**: `src/data/collectors/check_quarterly_coverage.py`(진단, 일회성). 로그: `logs/quarterly_check_v2_20260622.log`.

### 2026-06-19: 배당 미확정(dps=0) stale 행 자동 정정 + 결정대기 UI 가드

- **증상**: 삼성전자 종목상세 배당일정에 "결정 대기 — 기준일 2026-03-31, 금액 미확정"이 뜨는데, 그 아래 이력엔 더 나중에 지급된 2025-12-31(566원, 4/17 지급)이 완료로 표시 → 시간순 모순.
- **진단 (원인 a = stale 행 확정)**:
  - DB: 삼성 2026-03-31 행이 실제 `dps=0`, 지급일 없음. **KIS 재조회 시엔 372원/지급 2026-05-29 확정값 존재** → 우리 DB만 0(stale).
  - 메커니즘: `collect_dividend_schedule.py`의 증분 수집이 **기준일(F_DT/T_DT) 기반 + 주간 "최근 7일"**. 분기 기준일(3/31)이 이사회 결의 *전*(금액 0)에 수집된 뒤, 확정(~5월)되어도 **7일 윈도우가 80일 지난 과거 기준일을 재방문 안 해** 0으로 굳음. `batch_upsert`는 DO UPDATE라 재조회만 되면 갱신됨 → 윈도우가 과거를 안 건드리는 게 근본 원인.
  - UI 기여: `RightPanel` `pendingDecisions` 필터가 `dps=0 && 기준일 120일 이내`만 보고 가드가 없어 stale 0행을 "결정 대기"로 노출.
- **수정 (데이터 근본 + UI 보강 둘 다)**:
  - **데이터** — `collect_dividend_schedule.py --refresh-pending`(신규): DB `dps=0` & 기준일 **[오늘-180일, 오늘]** 행의 **distinct 기준일**만 `fetch_dividends_by_date`로 재조회 → `batch_upsert`(DO UPDATE). KIS 조회가 '날짜→전 종목' 구조라 by-date 배치가 호출 최소(stale 종목이 분기말에 몰림). 180일 상한으로 무한 재조회 방지(오래된 0=무배당 확정), stale 고쳐지면 다음 실행 타깃에서 자동 제외(self-healing).
    - 주간 워크플로(`collect-dividends.yml`)에 Step 추가 — `continue-on-error: true`로 격리(실패해도 앞 수집·잡 무영향).
  - **UI** — `RightPanel` `pendingDecisions` 가드: **이 기준일 '이후'에 이미 지급완료(dps>0, 지급일≤오늘)된 배당이 있으면** 그 0행은 stale로 보고 결정 대기에서 제외. (분기배당주에서 다음 사이클이 먼저 지급됐는데 이전 분기가 0 = 명백 stale). 데이터 정정 전에도 모순 표시 차단.
- **실행 결과**:
  - 삼성 2026-03-31 즉시 정정: 0 → 372원/5-29.
  - `--refresh-pending` 1회: 미확정 169건/기준일 23개(API 23회) → **확정 반영 4건(삼성 외 분기배당주)**, 나머지 165건은 KIS도 0이라 유지(올바름).
- **파일**: `src/data/collectors/collect_dividend_schedule.py`, `.github/workflows/collect-dividends.yml`, `app/src/components/layout/RightPanel.tsx`. **커밋**: `abf4ab2`
- **교훈**: 기준일 기반 증분 수집은 "기준일 공시 → 금액 확정"이 시차가 있는 필드(배당)에선 과거 재방문(self-healing refresh)이 필수. (역: 4/20 "dps=0+120일내=결정대기" 로직은 stale을 거르는 가드가 없으면 오작동)

### 2026-06-19: FX 산점도 추가 + 오버레이(④) 미채택 결정

- **산점도**: 종목 일별수익률 vs 원/달러 일별변동률 (x=환율변동, y=주가변동) + 회귀선. **SVG 직접 렌더**(recharts 등 의존성 추가 없이, SplashModal/Week52Band 관행 따름). 데스크톱=차트모달 패턴 재사용 / 모바일=Tooltip 바텀시트 재사용. 60/120 토글, 상관계수·강도·표본 병기, 착시방지 ⓘ.
- **데이터**: `useFxSensitivity`가 `points60/120` 반환 — 카드와 **동일 정렬·ECOS 1일 보정 소스 재사용** → 카드 수치(corr)와 산점도 추세 자동 일관(삼성 -0.68 일치 확인).
- 회귀선 기울기 = 기존 `beta`(cov/var) 재사용(`regressionLine`).
- **캔들 환율 오버레이(④) 미채택 결정 (냉철한 재검토 결과)**:
  - 정보 중복: 산점도가 "시각적 납득" 역할을 더 정직하게 이미 수행.
  - 착시 위험: 두 선을 겹치면 실제보다 강한 동조로 오인(우리 핵심 우려) → 산점도는 점 분포로 약한 상관을 정직하게 보여주는 반면 오버레이는 역행.
  - 음의 상관 지배 환경: 전 종목 음의 상관이라 환율선이 주가와 반대로 움직여 혼란. "반전(invert)" 옵션은 원본 조작 인상 + 해석 꼬임.
  - 차트 과적재: 캔들차트에 이미 시세/수급 토글 + MA + 골든/데드크로스 배지 존재.
  - 결론: 비용 대비 가치 낮음 → FX 프론트는 카드+산점도 2종으로 완결. (향후 강한 사용자 수요 확인 시, 상관계수 강제병기 + 인과 아님 경고 형태로 재검토 가능)
- **상태**: FX 환율 민감도 기능 완료(데이터레이어 + 카드 + 산점도).
- **파일**: `app/src/lib/fxStats.ts`(regressionLine), `app/src/hooks/useFxSensitivity.ts`(points), `app/src/components/stock-detail/FxScatterChart.tsx`(신규), `app/src/components/layout/RightPanel.tsx`, `app/src/App.css`

### 2026-06-19: PER/PBR/ROE 지배주주(소유주지분) 기준 전환

- **배경**: SK하이닉스 PER이 타 사이트와 차이 → 조사 결과 두 가지 차이 발견.
  (1) **기준**: 네이버·증권사·FnGuide는 EPS·BPS·ROE를 전부 **지배주주(지배기업 소유주지분)** 기준으로 산출하는데, 시야는 **당기순이익 전체(지배+비지배)** 기준이었음.
  (2) **기간**: 사이트는 TTM(최근 4분기)/추정(forward)을 쓰고 시야는 직전 연간 — 이건 **별개 이슈, 다음 단계(TTM)**. 하이닉스 PER 격차의 본질은 사실 (2).
- **지배주주 vs 전체 차이는 비지배지분 비중에 비례**: 하이닉스 0.04%(거의 무영향), 삼성물산 ~20~38%, 카카오는 전체 순손실인데 지배주주는 흑자인 경우도 있음(연도별).
- **데이터**: 지배주주 순이익/지분은 DART `finstate`(주요계정)엔 없고 **`finstate_all`(전체 재무제표)에만** 있음. 회사마다 한글 계정명이 달라(하이닉스 "지배기업의 소유주지분" vs 삼성물산 "지배기업소유주지분당기순이익") **XBRL account_id로 매칭**:
  - 지배주주 순이익 = `ifrs-full_ProfitLossAttributableToOwnersOfParent`
  - 지배주주지분 = `ifrs-full_EquityAttributableToOwnersOfParent`
- **변경**:
  - DB: `financials`에 `net_income_owners`, `equity_owners` 컬럼 추가 (`docs/migrate_financials_owners.sql`, Supabase SQL 에디터로 적용 — DDL 자동경로 없음)
  - `collect_financials.py`: `finstate`→`finstate_all` 전환, `extract_financials`(account_id 기반 + 이름 fallback, `regex=False`), **ROE = 지배주주순이익 / 지배주주지분**, `--remigrate` 재수집 플래그(지배주주 컬럼 채워진 종목 skip → 중단/재개 가능). 개별재무제표(OFS)는 지배/비지배 분리 없음 → 전체값으로 대체.
  - `daily_update.py`: EPS/BPS = **지배주주 기준**(`net_income_owners`/`equity_owners`, 없으면 전체 폴백). 우선주 복사에 두 컬럼 추가.
  - **ROA·부채비율은 전체 기준 유지** (사이트도 ROA=전체순이익/전체자산, 부채비율=부채총계/자본총계).
- **검증(전→후, 저장 PER/PBR == 새 지배주주 계산값 일치 확인)**:
  - 삼성물산(비지배 37.6%): PER 20.2→**32.3** / ROE 6.79→**4.89** / PBR 1.37→1.58
  - 카카오: PER 33.6→35.4 / PBR 1.14→1.54 / ROE 3.40→4.36
  - 삼성전자·하이닉스·KB금융: 비지배 작아 거의 동일(정상). 적자 종목(에코프로)은 PER<0→0 처리 유지.
- **재수집 현황(✅ 완료, 2026-06-22)**: 6/19 시점 2,447종목 완료 후, 잔여 324종목을 `python collect_financials.py --remigrate`로 마저 채움 → **성공 165 / 건너뜀 156 / 에러 3 (API 679건)**. 건너뜀 156은 적자·SPAC·폐지·소형주 꼬리라 DART에 추출 가능한 지배주주 데이터 자체가 없음(정상). **DART에 데이터 있는 종목은 전부 지배주주 컬럼 채워짐.** 잔여 에러 3건만 다음 `--remigrate` 시 자동 재시도(self-healing).
  - 실행 주의: 로컬 Windows 콘솔에서 `--remigrate` 직접 실행 시 진행상황 출력의 ⏳(`⏳`) 이모지가 cp949로 인코딩 안 돼 크래시 → **`PYTHONIOENCODING=utf-8` 설정 후 실행 필요**(2026-04-29 Task Scheduler와 동일 이슈). GitHub Actions(리눅스)는 utf-8 기본이라 무관.
- **파이프라인 주의**: `daily_update.py`가 매일 16:00 PER/PBR 재계산 → 이 변경을 **푸시해야** 자동 실행이 옛(전체 기준) 로직으로 원복하지 않음.
- **다음 단계 후보**: 이익 기간 **TTM(최근 4분기)** 전환 — 분기 재무 수집 필요(현재 연간만). 별도 논의.

### 2026-06-18: 환율 민감도 카드 — ECOS 정렬 시차 보정 + 강도 범주 표시

- **배경**: FX 데이터 도입(6/17) 후속. 종목 상세에 "환율 동조 정도"를 보여주는 첫 프론트 기능.
  종목 일별수익률 vs 원/달러 일별변동률의 상관계수·민감도(FX베타)를 60/120일 창으로 계산.
- **파일**:
  - `app/src/lib/fxStats.ts` (신규): 순수 계산 — `dailyReturns`(단순수익률, 로그수익률 아님 → "환율 +1%→주가 X%" 직관), `alignByDate`(날짜 inner join), `applyFxReportingLag`(ECOS 1일 보정), `computeFxSensitivity`(피어슨 corr + beta=cov/var, var=0 방어), `windowSensitivity`(60/120창, 70% 미만 null)
  - `app/src/hooks/useFxSensitivity.ts` (신규): price_daily(최근 180거래일) + fx_daily 조회 → 보정 → 계산. `{ window60, window120 }` 반환. useChartData 컨벤션
  - `app/src/components/layout/RightPanel.tsx`: 카드(수급 위), `useFxSensitivity` 호출, 강도/방향 표시
- **핵심 발견 — ECOS 매매기준율 1일 정렬 시차** (검증으로 확정):
  - 증상: 삼성전자/현대차 등 수출주에서 동일날짜 상관이 0.03~0.19로 전 종목 "약함(회색)" 처리됨
  - 원인: **ECOS 매매기준율 rate[T]는 "전 영업일 은행간 거래 가중평균"을 다음날 고시 → T-1 외환시장 반영.**
    주가 종가(T일)와 동일날짜 join하면 환율이 1일 어긋나 실제 신호가 상쇄됨
  - 검증(lag 시프트 비교, 삼성 60일): 동일날짜 +0.195 → **환율 1일 앞당김(rate[T+1]이 T일 변동) −0.685**.
    |corr|이 특정 시프트에서 급증 = 고정 1일 오프셋의 전형적 신호. 주별(5일) 상관도 음수(−0.17)로 일별 보정값과 부호 일치
  - **보정**: `applyFxReportingLag`가 fxRet를 한 영업일 앞당겨 재라벨 → 경제적 동일시점 정렬. 계산식은 그대로, **정렬만 변경**.
    보정 후 삼성 60일 corr −0.68 재현
- **방향성 해석 — 음의 동조가 정상**:
  - 보정 후 바스켓 전 종목 음의 상관(삼성 −0.68, SK하이닉스 −0.75, 현대차 −0.44, 한전 −0.59, KB −0.35, CJ −0.08).
  - 원인: 외국인 자금흐름(리스크오프 시 주식 매도→달러 환전→원/달러↑)이 일별 동조를 지배. "수출주=원화약세 수혜(양의 상관)"는 장기 펀더멘털 효과라 일별에선 안 보임
  - → 카드 방향 라벨은 사실상 대부분 "원/달러 강세(원화약세) 시 동반 하락 경향"
- **표시 결정 (베타 숫자 제거 + 강도 전면)**:
  - **베타 숫자 미표시**: 시장베타와 혼동 + 구간/환율변동크기에 민감해 불안정(삼성 |beta| 5.0~6.4 출렁) → 폐기. "원/달러 +1%→주가 X%" 문구도 제거
  - **강도 범주 = 주 메시지**: `|corr|` 기반 `높음(≥0.5)/보통(0.3~0.5)/낮음(<0.3)`. 전 종목 음의 동조라 방향만으론 변별 불가 → 강도를 전면(배지+corr 수치 강조)에, 방향을 보조 한 줄로 재배치
  - 임계값 `|corr|` 채택 이유: beta는 불안정, |corr|은 bounded·비교가능 + |corr|과 |beta| 순위 거의 일치(강도가 크기도 대략 반영). 기존 <0.3 회색 게이트와 자연 연결
  - 낮음(<0.3): 회색 + "환율 영향 약함"(방향 라벨 생략). 데이터 부족 창은 "데이터 부족"
- **상태**: 데이터레이어+카드(수치) 완료. **산점도/캔들 환율 오버레이("펼치기")는 미착수** — 다음 단계
- **커밋**: `1a9f60d`

### 2026-06-17: FX(원/달러) 환율 데이터 도입 — ECOS API

- 배경: 기존 "FX 분석 향후 후보"의 선행 작업. 종목 환율 민감도(상관/FX베타,
  산점도, 캔들 오버레이) 위해 원/달러 일별 시계열 확보 필요.
- 소스 선정 (냉철한 검토 결과):
  · FDR USD/KRW = 내부적으로 Yahoo(KRW=X) 경유 → 불안정, 제외
  · KIS = 현물 원/달러 일별 시계열 엔드포인트 없음(해외선물/잔고환산용
    현재환율만) → 부적합
  · 채택: 한국은행 ECOS API (무료 공식, JSON, 날짜구간 조회, 안정적)
    - 통계표 731Y001 "주요국 통화의 대원화 환율" / 항목 0000001
      "원/미국달러(매매기준율)" / 주기 D
    - 응답: TIME(YYYYMMDD), DATA_VALUE(환율, 정수문자열로도 옴→float 캐스팅),
      거래일만 존재(주말/공휴일 결측, price_daily와 동일 기준)
- DB: fx_daily(trade_date date PK, rate numeric(10,2)) + RLS(authenticated SELECT,
  price_daily와 동일). 원본만 저장, 상관/베타 등 파생값은 프론트 계산(기존 원칙).
  통화쌍 칼럼은 USD 단일이라 미도입(향후 다통화 시 pair+복합PK 마이그레이션).
- 수집기: src/data/collectors/collect_fx.py
  · update_fx(sb, days/start/end, executor) 함수화(단일 출처), CLI 유지
  · ECOS StatisticSearch 호출, list_total_count 페이지네이션(3년치도 단일 페이지)
  · 옵션: 기본 3년 백필 / --days N / --from --to
- daily_update.py: Step 5 추가 — update_fx(days=10, executor=execute_with_retry).
  try/except 격리(실패해도 Step1~4 무영향). 보조지표라 메인 수집 방해 금지.
- .env: ECOS_API_KEY 추가(gitignore)
- 초기 백필: 2023-06-19~2026-06-17, 732영업일, 에러 0건, 총 732행(중복 없음)
- 키 발급: ecos.bok.or.kr/api (무료, 즉시). 호출한도 하루 십만건 수준(여유 충분)
- 상태: 데이터 레이어 완료. 프론트(민감도 카드/산점도/캔들 오버레이) 미착수
- GitHub Actions: `daily-update.yml` env에 ECOS_API_KEY 미설정 → 추가 필요
  (워크플로 env 한 줄 + GitHub Secrets 등록). 미등록 시 Actions에서 FX 스텝만
  키 없음으로 실패(try/except로 격리되어 Step1~4는 정상).

### 2026-06-12: daily_update 일시적 연결 끊김 재시도 래퍼 추가
- **배경**: 6/11 16:00 daily-update 워크플로우가 Step 2(PER/PBR 재계산) 중 크래시
  - 에러: `httpx.RemoteProtocolError: ConnectionTerminated (error_code:0)` — Supabase(PostgREST)가 장시간 실행 중 HTTP/2 연결을 graceful close
  - 죽은 지점: `update_valuation()`의 종목별 `price_daily` 조회(루프 안, try/except 미보호). Step 1 시세는 저장됐으나 Step 2~4 미실행
  - 6/2 런도 같은 패턴으로 1시간만에 실패했던 것으로 추정 (간헐적 재발)
- **1차 조치**: 워크플로우 재실행 → 성공 (126.5분, 전 단계 완주, 데이터 정상 백필)
- **재발 방지**: `daily_update.py`에 `execute_with_retry(query)` 헬퍼 추가 (지수 백오프 재시도)
  - 대상 예외: `httpx.RemoteProtocolError/ReadError/WriteError/ConnectError/*Timeout/PoolTimeout`
  - 기본 4회 재시도, 백오프 1.5s→3s→6s
  - **16개 `.execute()` 호출 전부** `execute_with_retry(...)`로 감쌈 (페이지네이션 + 루프 내 종목별 쿼리 + 배치 upsert)
  - 특히 try/except 미보호 호출들(per-stock 조회, 배치 저장)이 끊기면 스크립트 전체가 죽던 문제 해결
- **검증**: py_compile 통과 + httpx 예외 이름 8개 유효성 확인
- **향후 옵션**: 종목별 개별 쿼리(2,769회) → 일괄 조회 리팩터로 연결 수·실행시간 추가 절감 가능 (미착수)
- **파일**: `src/data/collectors/daily_update.py`
- **상태**: ee9b40e로 커밋·푸시 완료 (2026-06-17 확인)

### 2025-02-04: 프로젝트 시작
- **결정**: 장기 가치/퀄리티 투자 스타일
- **이유**: 사용자 선호
- **영향**: 재무제표 분석, 밸류에이션이 핵심 기능

### 2025-02-04: 개발 방식
- **결정**: "데이터 탐색 → 모델 설계 → 점진적 구현"
- **이유**: 한국 주식 데이터의 현실적 한계를 먼저 파악해야 함

### 2026-02-04: 데이터 탐색 완료
- **결과**: 3개 소스 모두 정상 작동 확인
- **발견**: 가치투자 분석에 필요한 모든 데이터 조합 가능

### 2026-03-19: 앱 방향 재설계 (Bottom-up → Top-down + Bottom-up)
- **배경**: 실제 투자자 행동 패턴 분석 (페이스북 포스트 참조)
- **결정**: 
  - 기존 스크리너(Bottom-up) 유지
  - 테마 분석 모드(Top-down) 추가
  - 두 가지 분석 방식 병행
- **근거**: 
  - "AI 테마 뜬다" → 관련 종목 찾기 (Top-down)
  - "재무 좋은 종목 찾기" (Bottom-up)
  - 둘 다 유효한 투자 접근법

### 2026-03-19: 테마 시그널 감지 로직 추가
- **배경**: 페이스북 포스트에서 "AI 모델이 방향성과 신뢰도까지 판단" 아이디어 참조
- **결정**: 
  - 3가지 시그널 (거래량 급증, 기관/외국인 매집, 동반 상승)
  - 신뢰도 계산: 거래량(30%) + 수급(50%) + 동반상승(20%)
  - 방향예측: AI 예측이 아닌 시그널 기반 단순 판단으로 단순화
- **이유**: 멀티에이전트 AI 예측은 MVP 스코프 외, 시그널 기반으로 충분

### 2026-03-25: PC 앱 전환 결정
- **결정**: 모바일 앱 → PC 앱 (Tauri + React)
- **이유**: 
  - 차트, 테이블 등 복잡한 UI → 넓은 화면 필요
  - 3단 레이아웃 (테마/스크리너 | 종목 리스트 | 종목 상세)
  - 개발 속도: Tauri가 React Native보다 빠름

### 2026-03-31: 팀 리뷰 완료 및 Phase 2 진입 결정
- **배경**: 기획서 v4 팀 검토 완료
- **결정 사항**:
  - 배당수익률: 스크리너 5번째 필터로 추가 (기본값 ≥ 0%, pykrx DIV 데이터 활용)
  - 테마-종목 매핑: 반자동 방식 (업종코드 1차 분류 → 수동 검수)
  - 가이던스/컨센서스: MVP에서는 시야 AI 웹검색으로 대응, 고도화 단계에서 유료 데이터 소스 검토
  - 점수 계산 계수 튜닝: Phase 3(최적화) 단계에서 백테스팅으로 검증 예정

### 2026-04-02: Tauri + React 셋업 완료 및 UI 결정
- **셋업 완료**: Tauri + React 프로젝트 (`app/` 하위), 로그인, 3단 레이아웃, Supabase 연동 확인
- **스크리너 중앙 패널 UI 결정**: 테이블 형식 (카드형 ✖)
  - 칼럼 헤더: 종목명 | 점수 | PER | PBR | ROE | 부채비율 | 배당수익률 | 현재가
  - 칼럼 헤더 클릭 시 오름차순/내림차순 정렬 전환
  - 테마 분석 모드는 기존 카드형 유지
- **최종 목업 v5 작성**: `docs/siya-pc-mockup-v5.html` (v4 기획서 대비 변경사항 반영)

### 2026-04-07: UI 목업 비교 및 수정, 업종 데이터 수집, API 키 설정
- **Claude API 키**: console.anthropic.com에서 `siya-app-2` 키 발급 → `app/.env`에 입력 완료 (Evaluation 크레딧 소진으로 충전 필요)
- **업종(sector) 데이터 수집**: `collect_stocks.py`에서 업종 누락 확인 → `update_sector.py` 스크립트 작성 → fdr.StockListing('KRX-DESC') Industry 필드로 2,769개 종목 업데이트
  - KRX 직접 API는 400 에러, fdr 'KRX' 리스팅에는 업종 컨럼 없음 → fdr 'KRX-DESC'에서 Industry(162개 유니크) 발견
- **동종업계 비교 정상 작동**: sector NULL → sectorAvg 계산 불가 → 조건부 렌더링으로 비교 섹션 숨겨지는 문제 해결
- **UI 수정 (목업 v5 일치)**:
  - 방향 아이콘: 색상 코딩 추가 (up=green, possible=yellow, neutral=gray)
  - 타이밍: 텍스트만 → 🟢🟡🔴 이모지 + 배경색 배지
  - RSI/GC 수치: 테마 카드에 별도 행으로 표시
  - 테마 카드 레이아웃: 방향 + 점수 + 타이밍 한 줄 → 방향/타이밍+RSI 여러 줄로 분리
- **최종 검토 결과**: UI는 목업 v5와 거의 완벽히 일치. 남은 이슈는 데이터/외부 서비스 문제만 존재
- **ⓘ 툴팁 + 도움말 페이지 구현**:
  - `components/common/Tooltip.tsx`: position:fixed 방식으로 패널 overflow에 가려지지 않음, 아이콘 오른쪽에 표시
  - `components/common/HelpPage.tsx`: 모달 방식 6개 섹션 (종합점수, 테마지표, 스크리너필터, 동종업계, 용어사전, 면책문구)
  - Header: ❓ 버튼 추가
  - LeftPanel: 신뢰도 볱지, 방향, 타이밍, RSI/GC에 ⓘ 툴팁
  - RightPanel: 종합점수, 품질/밸류/개선 바, 동종업계 비교에 ⓘ 툴팁
- **3단 패널 비율 조정** (2단 vs 3단 검토 후 3단 유지 결정 — 테마 상태를 한눈에 볼 수 있으니까):
  - 좌측 260→340px, 우측 380→420px, 기본폰트 14→15px
  - 테마명 16px, 테이블 14px, 종목명(상세) 20px, 현재가 26px
- **테마 카드 레이아웃 개선**: 관망+타이밍을 한 줄로 합치고, RSI/GC를 파란 볱지 스타일로 별도 행 표시
- **테마 카드 단순화 (추가 수정)**:
  - "관망" 방향예측 삭제 (신뢰도와 중복이므로)
  - 신뢰도 × 타이밍 조합 해석 한 줄 추가 (예: "💤 약한 테마 + 나쁜 타이밍", "✨ 강한 테마 + 좋은 타이밍")
  - getDirectionIcon/getDirectionColor 함수 제거, getComboLabel 함수 추가
- **모든 툴팁 설명 개선**: 로직만 → "의미 설명 + 로직" 방식으로 변경 (예: "주가가 너무 많이 올랐는지 측정" + 기준값)
- **도움말 페이지 연동 수정**: 방향예측 섹션 삭제, 조합해석 섹션 강화, "쉽게 말하면" 컨럼 추가

### 2026-04-07: UI 마무리 + 데이터 업데이트 + 점수 통일
- **UI 개선 (실제 앱 코드)**:
  - 테마 카드 4줄→3줄 압축 (타이밍+RSI/GC 한 줄로 합침, 툴팁 통합)
  - 우측 패널 420→500px, 핵심지표 2열→3열 (스크롤 없이 한 페이지 표시)
  - 전체 폰트 +1~2px 키움 (기본 16px, 테마명 17px, 테이블 15px, 종목명 22px, 현재가 28px, 점수 40px)
  - 관심종목 버튼: 전체너비 버튼 → 종목명 옆 ☆/★ 아이콘으로 이동
  - 재무추이: 매 행 라벨 반복 → 테이블 헤더(매출액/영업이익/ROE) + 데이터 행 분리, 열 정렬 고정
  - 검색 기능: Enter 전달 방식 → DB 조회 + 자동완성 드롭다운 (300ms 디바운스, 화살표/Enter/Esc 지원)
  - 타이밍 지표 섹션: 종목 상세에 RSI/MACD/Signal 3열 카드 추가 (과열/저점/골든크로스 상태 표시)
- **종합점수 PER 기준 통일 (로직.md 설계대로)**:
  - 테마 모드: 테마 내 평균 PER (useThemeStocks + useStockDetail)
  - 스크리너: 전체 시장 평균 PER — 필터 통과 종목만→전체 종목으로 수정 (useScreenerStocks + useStockDetail)
  - 관심종목/검색: KRX 업종 평균 PER
  - 동종업계 비교 바: 항상 KRX 업종 기준 (모드 무관)
  - 툴팁 + 도움말 페이지에 모드별 차이 설명 추가
- **2025년 재무제표 수집 완료**:
  - `update_financials_2025.py` 실행: 2025년 2,356개 수집 + 2022년 2,036건 삭제
  - 전 종목 2023~2025 3개년 통일 (2023: 2,427 / 2024: 2,560 / 2025: 2,591)
  - `collect_financials.py` YEARS도 [2025, 2024, 2023]으로 변경
- **데이터 자동 수집 계획 수립**: GitHub Actions로 매일 장 마감 후 자동 실행 (UI 마무리 → 자동화 → 배포 순서)

### 2026-04-08: 배포 준비 — Edge Function + GitHub Actions + 데이터 날짜 표시
- **Claude API 크레딧 충전**: console.anthropic.com에서 $5 결제 → 시야 AI 정상 작동 확인
- **시야 AI → Supabase Edge Function 전환 완료**:
  - `supabase/functions/siya-ai/index.ts` 생성 (Claude API 프록시)
  - `app/src/lib/ai.ts` 수정: 직접 호출 → `supabase.functions.invoke('siya-ai')` 전환
  - API 키가 서버에서만 관리됨 → 클라이언트 노출 없음
  - `supabase secrets set ANTHROPIC_API_KEY=...` 등록, `--no-verify-jwt`로 배포
- **데이터 자동 수집 (GitHub Actions) 완료**:
  - `daily_update.py`: pykrx 전종목 일괄 수집 → 10분만에 완료 (FDR 개별 호출 1시간+ → pykrx 날짜별 일괄로 최적화)
  - `.github/workflows/daily-update.yml`: 매일 KST 16:30 자동 실행 (월~금)
  - GitHub Secrets 3개 등록 (SUPABASE_URL, SUPABASE_SERVICE_KEY, DART_API_KEY)
  - GitHub 리포지토리: https://github.com/movieisover/siya (Public — Actions 무제한)
- **헤더 시세 기준일 표시**: "4월 8일 종가 기준" 배지 추가, 5분마다 자동 갱신
- **종목 상세 데이터 날짜 표시**: 가격 아래에 "4월 8일(화) 기준" 표시 (실시간 대비용)
- **pykrx 복구 확인**: 여전히 고장 (get_market_fundamental, get_market_trading_value_by_date 등)
- **배포 계획 수립**: 웹 배포(Vercel) 1차 → 1~2주 사용 → PC 앱(Tauri exe) 2차
- **한국투자증권 오픈API 검토**: 실시간 시세 + 수급 데이터 + 배당 동시 해결 가능, 계좌 개설 필요
- **Vercel 웹 배포 완료**: https://siya-movieisovers-projects.vercel.app (확인 필요)
- **시야 AI 강화**: 웹 검색 도구 추가 + 시스템 프롬프트 확장 (DB데이터만 → DB+일반지식+웹검색)

### 2026-04-10: 한국투자증권(KIS) 오픈API 연동 + 캔들차트
- **KIS API 유틸리티**: `src/data/collectors/kis_api.py` — 토큰 발급/캐싱(24h), 공통 GET 함수, 초당 3건 제한(0.4s sleep)
- **수급 수집 스크립트**: `src/data/collectors/collect_investor_kis.py` — 전 종목 투자자별 매매동향 → investor_trading 테이블 upsert
  - 옵션: `--date YYYYMMDD` (특정일), `--days N` (최근 N일)
  - source = 'kis_api'
- **daily_update.py Step 4 추가**: update_investor() — KIS API로 전 종목 수급 자동 수집
- **GitHub Actions 업데이트**: KIS_APP_KEY, KIS_APP_SECRET 환경변수 추가, requests 패키지 추가
- **캔들차트 추가**: 종목 상세 우측 패널에 일봉 캔들스틱 + 거래량 바 차트
  - `app/src/hooks/useChartData.ts`: Supabase price_daily에서 기간별 OHLCV 조회
  - `app/src/components/stock-detail/CandleChart.tsx`: lightweight-charts v5, 기간 선택(1M/3M/6M/1Y/3Y)
  - 상승=빨강(#ef4444), 하락=파랑(#3b82f6) — 한국 주식 색상
- **시세 수집 pykrx → KIS API 교체**: `daily_update.py`의 `update_prices()` 함수를 KIS API 일봉 조회로 교체
  - 기존 pykrx `get_market_ohlcv`가 KRX API 변경으로 불안정 (4/8 이후 시세 누락 발생)
  - 종목별 순회 방식으로 약 20분 소요 (timeout 120분 내)
  - source = 'kis_api'
- **수급 단위 변환 버그 수정**: `useThemeData.ts`에서 `totalNetBuy / 100,000,000`(원→억) → `totalNetBuy / 100`(백만원→억) 수정
  - KIS API 수급 데이터가 백만원 단위로 저장되는데 프론트엔드에서 원 단위로 가정해서 모든 테마가 LOW로 표시되던 문제 해결

### 2026-04-11: 실시간 현재가 + 캔들차트 레이아웃 개선 + 문서 정리
- **실시간 현재가 조회**: 종목 선택 시 KIS API로 현재가 1건 조회
  - Supabase Edge Function `kis-price` 생성 (30초 캐싱)
  - 장중: 실시간 가격 + "실시간" 배지 + 시분 표시
  - 장 마감 후: DB 종가 표시 (기존 그대로)
  - 의사결정: "1번(종목 선택 시 조회) + 4번(장 마감 후 일괄)" 조합 채택
- **캔들차트 레이아웃 개선**: 우측 패널 → 중앙 패널 상단으로 이동 (300px)
  - 우측 패널 폭: 500px → 600px
  - 캔들차트 확대 버튼(⛶) → 클릭 시 80vw 모달로 크게 보기
- **TradingView 워터마크 제거**: lightweight-charts TV 로고 숨김
- **Vercel 툴바 비활성화**: Production Deployments Off
- **실시간 데이터 로드맵 문서화**: CLAUDE.md와 로직.md에 3단계 로드맵 기록
  - 1단계(MVP): REST + 배치 ← 현재
  - 2단계(상용화 초기): REST polling (10초/30초)
  - 3단계(상용화 확장): KIS 웹소켓 + Supabase Realtime

### 2026-04-15: Edge Function IP 제한 확인 + 실시간 기능 제거 + 갱신시간 변경
- **Edge Function 해외 IP 제한 확인**: Supabase Edge Function에서 KIS API 호출 시 500 에러
  - 원인: Edge Function이 해외 서버(Deno Deploy)에서 실행되어 KIS API가 IP 차단
  - Python(daily_update.py)은 GitHub Actions(REST 호출)에서 정상 동작 → 토큰 발급만 IP 바인딩, API 호출은 IP 제한 없음
  - Edge Function은 토큰도 발급 못하고 API 호출도 차단됨
- **실시간 현재가 기능 제거**: useRealtimePrice.ts, kis-price Edge Function 삭제
- **KIS 토큰 DB 공유 구조 구현**: kis_tokens 테이블에 app_key/app_secret 추가, Python이 저장 → 공유
- **일괄 갱신 시간 변경**: 16:30 → 16:00 (KST), 장 마감 후 최대한 빠른 갱신
- **의사결정**: 실시간 기능은 한국 서버 프록시 없이는 불가 → MVP는 16:00 일괄 배치로 충분
- **실시간 데이터 로드맵 업데이트**: 해외 IP 제한 사항 반영, 한국 서버 필요성 명시
- **배당 데이터 수집 구현**: KIS API `ksdinfo/dividend` (HHKDB669102C0) 엔드포인트 활용
  - `collect_dividends_kis.py`: 전 종목 최근 1년 배당 이력 조회 → 연간 DPS 합산 → div_yield 계산
  - valuation 테이블에 dps, div_yield 업데이트
  - GitHub Actions: 매주 월요일 17:00 자동 실행 (daily_update 1시간 후)
  - 초기 1회 수동 실행 필요 (전 종목 ~18분)
- **토큰 TZ 비교 버그 수정**: kis_api.py 파일 캐시에서 aware/naive datetime 비교 오류 수정

### 2026-04-16: 배당 일정(dividend_schedule) 수집 + 프론트 신규 기능 2개 (52주 밴드, 경쟁사 비교)

#### 프론트엔드 신규 기능
- **52주 최고/최저가 밴드** (종목상세 현재가 바로 아래):
  - `useStockDetail.ts`: 최근 252거래일 `price_daily` 조회 → `computeWeek52()`로 high/low 계산
  - UI: 가로 밴드(파랑→회색→빨강) + 현재가 마커 + “저 65,400원 +25.8%” 식 좁점/고점 대비 수치
  - 구간 판정: 0–20% “저점권”(파랑), 20–80% “중간권”, 80–100% “고점권”(빨강)
- **경쟁사 개별 비교 테이블** (동종업계 비교 아래):
  - `useStockDetail.ts`: 같은 업종 종목들의 최신 밸류/재무 → 간이 점수(품질50 + 밸류 20 = 70) → 상위 5개 + 선택 종목 보장 + 업종 전체 평균
  - UI: 점수는 표시하지 않고 **원본 수치만** 표시 (ROE/PER/PBR/영업이익률) — 상단 종합점수와의 기준 충돌 방지
  - 선택 종목은 파란 좌측 라인 + ★ 표시, 마지막 행은 업종 전체 평균(이탈릭)
- **HelpPage 구버전 노트 삭제**: “현재 기관/외국인 데이터 미수집 상태(pykrx 고장)” 안내문 누락 — KIS API 전환 완료(4/10) 반영 안 되어 혼란 여지

#### 백엔드 — 배당 일정 수집
- **엔드포인트**: 기존 KIS API `ksdinfo/dividend` (HHKDB669102C0) 재활용
  - 배당 DPS/수익률(`collect_dividends_kis.py`)과 동일 엔드포인트, 날짜 필드만 추가 추출
- **수집 방식**: 날짜별 일괄 조회 (SHT_CD 빈값, 하루씩 순회) → 전 종목 순회 불필요
  - 100건/일 제한이지만 실제 하루 최대 ~47건으로 문제 없음
  - 초기 수집 3년(1,202일) = ~5분, 주간 갱신 7일 = ~3초
- **DB 테이블**: `dividend_schedule` (stock_code, record_date, payment_date, dividend_per_share, dividend_type, stock_kind)
  - 배당락일(ex_dividend_date)은 API 미제공 → 프론트에서 "기준일 T-1 영업일" 안내로 대체
  - UNIQUE(stock_code, record_date, dividend_type)
- **스크립트**: `collect_dividend_schedule.py` — `--days N` / `--years N` / `--from` `--to` / `--stock` 옵션
- **초기 수집 결과**: 2023-01-01~2026-04-16, 5,710건, 에러 0건

### 2026-04-17: 이동평균선 + 배당일정 프론트 UI + 기술적 분석 종합 등급
- **이동평균선 (SMA 20/60/120일)**: 캔들차트에 토글 버튼 추가, 기본 OFF
  - 20일(초록 1px) + 60일(주황 2px) + 120일(보라 2px)
  - 데이터 버퍼: 선택 기간 + 180일 추가 fetch → 1M 뷰에서도 120일선 정상 표시
  - 골든/데드크로스 상태 뽃지: “🟢 골든크로스 (N일째)” 또는 “🔴 데드크로스 (N일째)”
  - 차트 마커(setMarkers) → lightweight-charts v5 미지원으로 제거, 선 교차 시각 확인 + 뽃지로 대체
  - 범례: 차트 좌하단에 반투명 오버레이 (MA ON 시만)
  - 종목명 워터마크: 차트 좌상단에 반투명(35%) 표시
- **배당 일정 프론트 UI**: 종목상세 하단에 배당일정 섹션 추가
  - 다음 예정 배당 카드 (파란 테두리) + 과거 이력 테이블 (최대 6건)
  - 케이스별 처리: 분기배당주(삼성), 고배당주(SK텔레콤), 미지급(한온시스템), 비배당주 → "배당 기록 없음"
  - 도움말 페이지: 배당 일정 섹션 + 데이터 현황 표에 행 추가
- **기술적 분석 종합 등급**: 타이밍 지표 섹션 상단에 4단계 등급 뽃지 추가
  - 🟢 진입 적기 (RSI < 70 + MACD 상승), 🟡 관망 (RSI < 70 + MACD 하락), 🔴 과열 주의 (RSI ≥ 70), ⚪ 판단 불가 (데이터 부족)
  - Investing.com 5단계 대신 시야 스타일 4단계로 정체성 유지
  - Signal 카드 제거 (MACD 카드와 중복), 타이밍 그리드 3열 → 2열
- **전체 툴팁/도움말 용어 통일**: Signal/GC 등 기술 용어 제거, 4단계 등급 설명 + 의미 추가
  - RightPanel 타이밍 툴팁, LeftPanel 테마 카드 툴팁, HelpPage 타이밍/용어사전 모두 통일
- **GitHub Actions**: 기존 `collect-dividends.yml`에 Step 추가 (매주 월요일 KST 17:00, 최근 7일분)

### 2026-04-29: 테마 v3 초안 작성 + Task Scheduler UTF-8 수정

#### 테마 v3 마이그레이션 + 개인화 ✅ 완료 (2026-05-19)
- **v3 마이그레이션**: `docs/migrate_themes_v3.sql` 실행 완료
  - 31개 테마 / 267개 매핑 / 카테고리 제거 (NULL)
  - 신규 테마: 석유화학, 해운, 원자력, 지주사
  - 우선주 편입: 삼성전자우→AI+반도체, 현대차2우B→자동차+수소
  - 미매핑 TOP 100: 0개 (전원 해소)
- **테마 개인화 기능**: 사용자별 테마/종목 커스터마이징 구현 완료
  - DB: `user_themes` + `user_stock_themes` 테이블 (RLS 적용)
  - 최초 로그인 시 기본 31개 테마 자동 복사
  - 편집 모드: 테마 추가/삭제/이름변경 + 종목 검색 추가/제거
  - 편집 완료 시 신뢰도/타이밍 자동 재계산
  - 테마 목록 헤더 sticky (스크롤 시 상단 고정)
- **검색 통일**: 헤더 검색 + 종목편집 검색 동일 로직 (2글자 이상, 제한 없음, 가나다순)
- **카테고리 제거 배경**: 31개 테마로 분류 애매한 케이스 증가 + 개인화 시 사용자 카테고리 부담 → 제거 결정
- **파일**:
  - `docs/migrate_themes_v3.sql` — v3 마이그레이션 SQL (실행 완료)
  - `docs/user_themes_schema.sql` — 개인화 테이블 스키마 (실행 완료)
  - `docs/시야_테마종목_매핑현황_v3.docx` — 팀 리뷰 문서
  - `app/src/hooks/useUserThemes.ts` — 사용자 테마 CRUD + 초기화 훅
- **데이터 플로우 변경**:
  - 기존: themes → stock_themes (시스템 공용)
  - 변경: user_themes → user_stock_themes (사용자별 개인화)
  - 기존 themes/stock_themes는 신규 사용자 초기화용 템플릿으로 유지

#### Task Scheduler UTF-8 수정
- **문제**: 4/29 16:30 자동 실행 시 이모지(⏳, ✅) 출력에서 cp949 인코딩 에러로 크래시
- **수정**: `daily_collect.bat`에 `chcp 65001` + `PYTHONIOENCODING=utf-8` 추가
- **결과**: 19:26 수동 재실행 시 정상 동작 확인 (exit: 0). 로그 한글 깨짐은 표시 문제일 뿐 데이터 수집은 정상

### 2026-06-01: 동종업계 비교 UI 개선 + 배당수익률 표시 버그 수정

#### 동종업계 비교 개선 (4건)
- **데이터 현황 표 출처 정정**: HelpPage 데이터 현황 표의 종목 마스터/업종 출처를 "KRX (한국거래소)" → "FinanceDataReader (KRX 상장정보 기준)"로 변경.
  - 업종(sector)은 `update_sector.py`에서 KRX 직접 API(400 에러)가 아닌 **FDR `StockListing('KRX-DESC')` Industry** 필드로 수집됨. KIS API는 업종 분류 미제공 → KIS로 바꾸면 오류.
  - 단, "KRX 공식 업종 분류" 용어(분류 기준 설명)는 실제 KRX 표준 업종분류이므로 정확 → 그대로 유지.
- **초록/노랑 막대 의미 설명 추가**: 초록=업종 평균보다 우수, 노랑=열위 (ROE는 높을수록·PER/PBR은 낮을수록 우수). HelpPage 동종업계 비교 섹션 + 인라인 툴팁 양쪽 반영.
- **업종 평균선 개선**: 노랑(`#eab308`) → **흰색 3px + 어두운 외곽선/그림자**. 마커 위에 "평균 OO" 라벨 추가 (가장자리 0~12%/88~100% clamp). 노란 막대 위 노란 평균선이 안 보이던 문제 해결.
- **음수 평균 clamp**: `ComparisonBar`의 barPercent/avgPercent를 `Math.max(0, …)`로 하한 처리. 업종 평균 ROE가 음수(예: 삼성전자 KRX 업종 "통신 및 방송 장비 제조업"의 적자 소형주 평균)면 마커가 `left: 음수%`로 화면 밖으로 밀려 안 보이던 문제 → 왼쪽 끝(0%) 고정 + 실제값("평균 -3.2%") 표시.
- **범례 가독성**: 10px → 12px, 색 밝게(`#b4b9c8`), 평균선 표식 흰색 통일. "| = 업종 평균" → "업종 평균".

#### 배당수익률 카드 빈칸 버그 수정
- **증상**: 종목 상세 배당수익률 카드가 배당 수집일(월요일) 외에는 "-"로 표시.
- **원인**: 상세는 valuation 최신 1행만 조회하는데, `daily_update.py`의 `update_valuation()`이 매일 새 valuation 행을 만들면서 dps/div_yield를 안 넣음(NULL). 배당 수집(`collect_dividends_kis.py`)은 주 1회 월요일에 그날 최신 행에만 div_yield UPDATE → 화요일부터 NULL 행이 최신이 되어 카드가 빔.
- **수정**: `daily_update.py`에 `get_latest_dps_map()` 추가(최근 30일 내 종목별 최신 DPS), `update_valuation()`에서 매일 새 행에 **div_yield = DPS ÷ 당일 종가 × 100**으로 재계산해 dps/div_yield 같이 저장(carry-forward). 종가 변동도 매일 반영.
- **적용 시점**: 다음 daily_update 실행분부터. 확인 완료.
- **교훈**: valuation은 (stock_code, trade_date) 단위 행이므로, 매일 새 행을 만드는 일일 갱신은 주 1회만 들어오는 배당 같은 필드를 임의로 carry-forward해야 한다. (역: 배당 수집은 새 행 INSERT 금지 — 기존 원칙과 쌍).
- **파일**: `app/src/App.css`, `app/src/components/layout/RightPanel.tsx`, `app/src/components/common/HelpPage.tsx`, `src/data/collectors/daily_update.py`

### 2026-05-28: 수급 차트 개선 + 수량 데이터 추가

#### 수급 차트 버그 수정 (3건)
- **막대 겹침 해결**: 기관+외국인 모두 HistogramSeries로 그려 색이 겹치던 문제 → 기관=막대(HistogramSeries), 외국인=꿐은선(LineSeries)으로 분리
- **확대 모달 버튼 중첩**: 모달 내 재귀 렌더링으로 확대 버튼(⛶) 중복 표시 → `isModal` prop 추가, 모달에서 확대 버튼 숨김
- **TradingView 워터마크**: 캔들+수급 차트 모두 `attributionLogo: false` + CSS 백업으로 제거
- **기관 막대 색상 통일**: 양수=초록/음수=빨강 → 전부 초록으로 통일 (방향으로 매수/매도 구분)

#### 수급 수량(물량) 데이터 추가
- **배경**: KIS API `FHKST01010900` 응답에 수량 필드(`orgn_ntby_qty`, `frgn_ntby_qty`)가 이미 포함되어 있으나 미수집 상태
- **검증**: `test_investor_fields.py`로 삼성전자 5/27 데이터 확인 — 기관 +155만주(+4,953억), 외국인 -27.4만주(-809억)
- **DB**: `investor_trading` 테이블에 `inst_net_qty`, `foreign_net_qty` bigint 컨럼 추가
- **수집 코드**: `collect_investor_kis.py` + `daily_update.py` — 수량 필드 추가 저장 (추가 API 호출 없음)
- **초기 수집**: `python collect_investor_kis.py --days 30` 실행 → 최근 30일 수량 데이터 전체 채워짐
- **UI 표시**:
  - 요약 카드: "-206억 / 15.3만주" (금액과 동일 크기, "/" 구분자)
  - 일별 테이블: "-79억원 / 5.2만주" ("원" + "/" 구분자)
  - 테이블 헤더 중앙 정렬
- **의사결정**: 금액 vs 물량 — 금액이 기본(종목간 비교 가능), 물량은 보조 정보로 병기

#### Chrome 브라우저 연결
- Claude in Chrome 확장 프로그램 연결 성공 (stocksiya.com 스크린샷 확인 가능)
- 단, stocksiya.com 도메인에 JS 실행 권한 필요 (navigate/JS는 permission denied 발생)

#### 파일 변경
- `app/src/components/stock-detail/SupplyChart.tsx` — 막대+꿐은선 분리, isModal prop, 워터마크 제거, 색상 통일
- `app/src/hooks/useInvestorData.ts` — 수량 필드 추가 (InvestorDayData, InvestorSummary)
- `app/src/components/layout/RightPanel.tsx` — 카드/테이블에 수량 병기 + 헤더 정렬
- `app/src/App.css` — 워터마크 CSS, 수량 스타일, 헤더 중앙정렬
- `src/data/collectors/collect_investor_kis.py` — 수량 필드 저장
- `src/data/collectors/daily_update.py` — 수량 필드 저장
- `app/src/components/stock-detail/CandleChart.tsx` — 워터마크 중복 제거

#### 다음 세션에서 확인/진행할 사항
1. **수급 모드에서 MA 토글 숨김 확인**: 수급 차트 선택 시 이동평균선 버튼이 숨겨지는지 (현재 CandleChart 내부 처리로 자동 숨겨지는지 확인 필요)
2. **localStorage 대화 저장 미스터리**: 동철님이 커밋 후 stocksiya.com에서 대화했으나 localStorage에 데이터 없음 — 원인 조사 필요
3. **우선주 데이터 확인**: daily-update 자동 실행 후 삼성전자우/현대차2우B ROE/ROA/부채비율 채워졌는지
4. **베타 오픈 피드백 수집**

### 2026-05-27: 시야 AI 개선 3건 + 기관/외국인 수급 UI

#### 시야 AI 개선 (3건)
- **답변 빈줄 축소**: `white-space: pre-wrap` 제거, `\n\n`으로 분리해 `<p>` 문단 렌더링 (간격 ~21px → 8px)
- **중지 버튼**: `ai.ts`에 AbortSignal 지원 추가 (`supabase.functions.invoke` → raw `fetch` 전환), 로딩 중 "■ 중지" 빨간 버튼 표시
- **대화 localStorage 저장**: 종목별 최근 20개 메시지, 최대 50개 종목까지 브라우저에 저장
  - 종목 전환 시 해당 종목 대화 불러오기 (기존: 초기화)
  - "대화 삭제" 버튼 + "💬 N개 메시지" 표시
  - 웰컴 화면에 저장 정책 안내 문구 추가
  - DB 대신 localStorage 선택 이유: 테이블 추가/용량 관리 부담 없음, 새로고침/재시작에도 유지
- **파일**: `ai.ts`, `RightPanel.tsx`, `App.css`

#### 기관/외국인 수급 UI
- **배경**: investor_trading 데이터가 테마 신뢰도 계산에만 내부 사용 중 → 종목 상세에 수급 정보 노출 필요
- **네이버증권 비교 검토**: 네이버 투자자별 매매동향 화면 참조 → 시야 스타일로 적용
- **중앙 패널 차트 토글**: `시세` | `수급` 버튼으로 캔들차트/수급차트 전환
  - 시세 모드: 캔들차트 + MA 토글 + 골든/데드크로스 뱃지
  - 수급 모드: 기관(초록)/외국인(파랑) 순매수 막대차트 + MA 토글 숨김
  - 기간 선택(1M/3M/6M/1Y), 확대 버튼 공유
- **우측 패널 수급 섹션** (경쟁사↔배당 사이):
  - 요약 카드 2xd72: 기관 5일/20일 + 외국인 5일/20일 누적 순매수 (양수=초록, 음수=빨강)
  - "연속 N일 매수/매도" 상태 표시
  - 일별 테이블 최근 10거래일 (날짜 | 기관 | 외국인 | 종가 | 등락률)
- **파일**:
  - `app/src/hooks/useInvestorData.ts` (새 파일) — 수급 데이터 fetch + 요약 계산
  - `app/src/components/stock-detail/SupplyChart.tsx` (새 파일) — lightweight-charts 막대차트
  - `app/src/components/layout/CenterPanel.tsx` — 시세/수급 토글
  - `app/src/components/layout/RightPanel.tsx` — SupplySection 컴포넌트
  - `app/src/App.css` — 차트 토글, 수급 카드/테이블 스타일

### 2026-05-26: 베타 오픈 준비 — 스플래시 + 도메인 + 우선주 수정
- **스플래시 화면 구현**: 첫 방문 시 인트로 애니메이션 + 소개 모달 표시
  - 1단계: 상승 차트 SVG 라인 드로잉 애니메이션 (2초) + "시야" 텍스트 페이드인
  - 2단계: 시야 소개 모달 (5개 기능: 테마분석, 스크리너, 공시모니터링, 나만의테마, 시야AI)
  - localStorage로 최초 1회만 표시, "시작하기" 클릭 시 페이드아웃
  - `app/src/components/common/SplashModal.tsx`
- **도메인 확정**: stocksiya.com
  - Namecheap에서 구매 (프로모션 반값)
  - Vercel DNS 연결: A Record (@→216.198.79.1) + CNAME (www→vercel-dns)
  - SSL 자동 발급 완료
  - 헤더에 stocksiya.com 병기 (시야 옆에 표시)
- **우선주 재무데이터 복사**: 삼성전자우/현대차2우B ROE/ROA/부채비율 빈칸 문제 해결
  - `daily_update.py` Step 2b 추가: 보통주 financials(roe, roa, operating_margin, debt_ratio 포함) + valuation(PER/PBR 재계산) 복사
  - 우선주→보통주 매핑: PREFERRED_TO_COMMON 딕셔너리 (005935→005930, 005387→005380)
  - **버그 수정**: `total_debt` → `total_liabilities` 컨럼명 오류 수정 (2026-05-27 push 완료, 다음 daily-update에서 자동 반영 예정)
- **배당 수집 쿼리 타임아웃 수정**: get_latest_prices/get_latest_valuation_dates에서 ORDER BY 제거 → Python에서 날짜 비교 방식으로 변경
- **배당 수집 timeout**: 60분 → 90분 증가

#### 다음 세션에서 확인/진행할 사항
1. **수급 UI 테스트**: 수급 차트(중앙) + 요약 카드/테이블(우측) 정상 표시 확인, 데이터 정합성 검증
2. **시세/수급 토글 시 MA 토글 숨김 확인**: 수급 모드에서 이동평균선 버튼이 숨겨지는지 (CandleChart 내부 처리)
3. **시야 AI 개선 확인**: 빈줄 축소 + 중지 버튼 + 대화 유지 정상 동작 확인
4. **우선주 데이터 확인**: daily-update 자동 실행 후 삼성전자우(005935)/현대차2우B(005387) ROE/ROA/부채비율 채워졌는지
5. **GitHub Actions 자동 실행 확인**: 5/27 16:00 정상 작동 여부
6. **베타 오픈 피드백 수집**: 사용자 피드백 반영

### 2026-04-28: GitHub Actions 한도 100% 도달 대응 + PER/PBR 버그 수정
- **배경**: 4/27 GitHub Actions 월 2,000분 100% 사용 → 모든 워크플로우 실행 차단됨 (5/1 초기화까지)
- **대응**: 5/1까지 PC 수동 실행으로 전환
  - `python daily_update.py && python collect_disclosures.py`
  - 평일 장마감 후 1회 실행 (약 55분 소요)
  - `daily_update.py`는 최근 20일치 백필 + UPSERT라 빠진 데이터 자동 만회
- **4/28 수동 갱신 결과**: 시세 2,773종목(41,515건) + RSI/MACD 2,680 + 수급 2,773 + 공시 795건 → 4/24 이후 데이터 전부 백필 완료

#### Windows Task Scheduler 설정 (GitHub Actions 백업)
- **배경**: GitHub Actions 한도 초과 시 로컬 대안 필요
- **Cowork Scheduled Tasks 시도 → 실패**: Cowork 터미널은 Linux 샌드박스에서 실행되어 Windows conda 환경/로컬 패키지 사용 불가
- **대안**: Windows Task Scheduler로 로컬 자동 실행 구성
  - 배치 파일: `scripts/daily_collect.bat` (영문 전용, 한글 인코딩 문제 회피)
  - 스케줄: 평일 16:30 (월~금)
  - 동작: conda activate siya → daily_update.py → collect_disclosures.py
  - 로그: `logs/daily_YYYYMMDD.log` 자동 저장
  - 놓친 스케줄 자동 실행 설정 완료
  - 절전 설정: 전원 연결 시 절전 모드 "안 함"으로 변경됨
- **운영 체제**: 기본 GitHub Actions (5/1 재개, 월 ~680분) + 백업 Task Scheduler (한도 초과 시 전환)
- **주의**: 회사 PC 절전 설정 변경함 (전원 연결 시 절전 30분 → 안 함). 배터리 모드는 30분 그대로

#### PER/PBR 버그 발견 및 수정
- **증상**: `update_valuation()`에서 "발행주식수: 0개 종목" → PER/PBR 재계산이 전혀 안 되고 있었음
- **원인**: FDR `StockListing()` 반환 컨럼명이 `Shares` → `Stocks`로 변경됨 (FDR 버전 업데이트 시 변경된 것으로 추정)
- **수정**: `daily_update.py` 121번째 줄 `row.get('Shares')` → `row.get('Stocks')`
- **수정 후 결과**: 발행주식수 2,770개 정상 인식, PER/PBR 2,583개 종목 재계산 완료
- **교훈**: FDR 업데이트 시 컨럼명 변경 가능성 항상 염두. GitHub Actions에서도 0개였을 가능성 높음 (잘보한 버그)

### 2026-04-24: GitHub Actions 사용량 절감 (공시 수집 3시간 간격)
- **배경**: GitHub에서 "2,000분 중 90% 사용" 알림 → 조사 결과 `collect-disclosures.yml`의 매시간 실행(평일 10회/일)이 사용량의 60~80% 차지
- **변경**: `collect-disclosures.yml` cron 스케줄
  - 기존: `0 0-9 * * 1-5` (평일 매시간, 1일 10회)
  - 변경: `0 0,3,6,9 * * 1-5` (평일 3시간 간격, 1일 4회)
  - 시간대: KST 09:00, 12:00, 15:00, 18:00
- **예상 절감**: 공시 수집 사용량 60% ↓ (월 ~1,100분 → ~400분), 전체 월 사용량 ~640분 이내로 안정
- **트레이드오프**: 시야는 가치투자용 앱이어서 공시 즉시성이 분 단위로 필요하지 않음 → 3시간 지연 용인 가능
- **향후 옵션** (사용자가 늘어나면):
  - Public 레포 전환 (무제한)
  - Vercel Cron으로 이전 (단, Python 재작성 필요)
  - 예산 추가 (초과 사용량 분당 $0.008)

### 2026-04-20: 배당 일정 UI 개선 + 툴팁 동적 높이 + HD현대 정유 매핑

#### 배당 일정 UI 3단계 분리
- **배경**: SK텔레콤에서 "2025.12.31 기준일, 금액 미확정" 상태가 "다음 배당 예정"으로 표시되는 혼란 발생
  - 원인: 2025년 SK텔레콤 사이버 침해 사고로 3·4분기 배당 지연/축소 → 정관상 기준일(12.31)은 전해져 있으나 이사회 결의가 없어 KIS API가 금액 0으로 반환
- **구현**: `app/src/components/layout/RightPanel.tsx` `DividendSection`
  - ① 다음 배당 (파란 카드): `dps > 0` + 미래 기준일/지급일
  - ② 결정 대기 (노란 카드, 신규): `dps === 0` + 오늘 이전 120일 이내 기준일
  - ③ 과거 이력 (테이블): `dps > 0` + 지급일이 오늘 이하
- **120일 임계값**: 120일 이상 뭵은 금액 미확정 = 사실상 무배당 확정으로 간주 → 숨김 (노이즈 제거)
- **CSS**: `.dividend-pending` + 동일 스타일군 추가 (노란 테두리/배경, 기존 파란 카드와 시각적 구분)

#### 툴팁 동적 높이 조정
- **배경**: 배당 일정이 좁제일 하단에 있어 긴 툴팁(현재 10+줄)이 화면 아래로 잘림
- **변경**: `app/src/components/common/Tooltip.tsx`
  - 기존: 툴팁 높이 120px 하드코딩 가정
  - 개선: `useLayoutEffect` + ref로 실제 렌더된 툴팁 높이 측정 → 뉴포트 안에 맞게 재배치
  - 위/아래로 넘치면 화면 경계에 맞춰 고정, 뉴포트보다 아러면 `max-height: calc(100vh - 16px)` + 스크롤 스크롤
  - 플리커 방지: 렌더 직후 opacity 0 → 0.08s fade-in

#### HD현대 화학/정유 테마 추가 (정유 테마 보완)
- **배경**: 사용자가 "SK가 화학/정유에 없네" 질문 → 조사 결과 SK(034730)는 2007년부터 지주사(정유은 SK이노베이션으로 분리됨) → 현재 매핑 유지
- **발견**: 국내 정유 BIG4 중 상장사는 SK이노베이션/S-Oil이고, GS칼텍스/HD현대오일뱅크는 비상장 자회사 → 지주사를 통해 간접 매핑 필요
- **조치**: HD현대(267250)은 실질적으로 HD현대오일뱅크 중심 지주사 → 화학/정유에 중복 매핑 추가 (조선/해운은 기존 유지)
  - GS(078930)는 GS칼텍스 + GS리테일 + GS건설 등 분산되어 있어 보류
- **실행 파일**: `docs/migrate_themes_v2_patch2.sql`
- **결과**: 화학/정유 2 → 3, 총 매핑 197 → 198

#### 팬트 발견
- SK(034730): 동철님 기억(정유회사)은 2007년 이전까지 사실이었음. 이후 지주사 전환하면서 정유 사업은 SK에너지 → SK이노베이션으로 이관
- HD현대(267250): 구 현대중공업지주의 사명 변경만이 아니라 정유(HD현대오일뱅크)가 주력 중 하나

### 2026-04-17: 테마 구조 v2 마이그레이션 (20개 → 27개, 카테고리 5 → 6)
- **배경**: 사용자 요청 3가지
  1. "AI/반도체" 테마가 15종목으로 너무 크고 AI·반도체 논리가 달라서 분리 필요
  2. 자동차 테마 공백 — 현대차/기아/모비스 등 대형주 미매핑
  3. 시총 TOP 100 중 미매핑 종목을 체계적으로 커버
- **조사**: `scripts/analyze_top100.py` 작성 → 실행 결과 50/100 매핑됨 (미매핑 50개)
  - 결과 리포트: `scripts/top100_analysis.md`
- **구조 변경**:
  - 카테고리 5 → 6 (신규 `소비재/유통`)
  - 카테고리 개명: `산업/방산` → `산업/인프라`
  - 테마 20 → 27 (신규 7개)
  - 기존 테마 개명 3개: `AI/반도체` → `반도체`, `희토류` → `희토류/비철금속`, `원자력` → `원자력/전력`
- **신규 테마 7개**:
  - 첨단기술: AI
  - 에너지/소재: 화학/정유
  - 산업/인프라: 자동차/모빌리티
  - 금융/소비: 증권/보험
  - 소비재/유통(신규 카테고리): 음식료/필수소비재, 유통/무역, 통신/미디어
- **매핑 변경**:
  - `반도체`(옛 AI/반도체)에서 NAVER/카카오/SK/SKT 제거 → 신규 `AI` 테마로 이관
  - 기존 테마에 TOP 100 종목 약 15개 추가 (바이오/제약 5, 조선/해운 2, 로봇 2, 원자력/전력 2, 희토류/비철금속 1, 방위산업 1, 건설/인프라 1, 화장품 1)
  - 신규 7개 테마에 TOP 100 종목 31개 매핑
  - **총 매핑 149 → 197** (전자부품 보완 패치 포함)
- **패치 (전자부품 누락 보완)**:
  - 초기 마이그레이션(191 매핑) 후 analyze_top100.py 재실행하니 전자부품 4개 누락 발견
  - `반도체`에 삼성전기(009150), LG이노텍(011070), 이수페타시스(007660) 추가
  - `AI`에 이수페타시스(007660), LG전자(066570) 추가
  - `자동차/모빌리티`에 LG전자(066570) 추가 (VS사업부)
  - 패치 파일: `docs/migrate_themes_v2_patch.sql`
- **최종 커버리지**: TOP 100 중 **92/100 매핑** (나머지 8개는 의도적 제외 — 우선주 2, 지주/투자회사 5, 대한항공 1)
- **레인보우로보틱스 코드 불일치 수정**:
  - 기존 `454910`은 실제로는 두산로보틱스 (docx에 이름이 잘못 표기되어 있었음)
  - 실제 `레인보우로보틱스 (277810)`를 로봇/자동화에 신규 추가
- **발견 사항**:
  - `010620 현대미포조선`: 2025년 12월 HD현대중공업에 흡수합병되어 상장폐지. 조선/해운 테마 매핑이 안 되는 게 정상 (docx 갱신 필요)
  - `082740`: HSD엔진 → 한화엔진 사명 변경됨 (docx 갱신 필요)
- **실행 파일**:
  - 마이그레이션: `docs/migrate_themes_v2.sql`
  - 롤백: `docs/migrate_themes_v2_rollback.sql`
  - 백업 테이블: `themes_backup_20260417`, `stock_themes_backup_20260417`
  - 조사 스크립트: `scripts/analyze_top100.py` (결과: `scripts/top100_analysis.md`)
- **남은 작업**:
  - `시야_테마종목_매핑현황.docx` v2 갱신 ✅ 완료 (`시야_테마종목_매핑현황_v2.docx`)
  - 카테고리 UI 스타일 개선 ✅ 완료 (헤더 강화 + 접기/펼치기 버튼, `LeftPanel.tsx` + `App.css`)

### 2026-04-02: 관심종목 기능 구현 완료
- **구현 내용**:
  - `hooks/useWatchlist.ts`: watchlist 테이블 CRUD (추가/삭제/메모수정/관심여부확인/메모조회)
  - `hooks/useWatchlistStocks.ts`: 관심종목 코드 목록으로 종목 데이터 + 종합점수 fetch
  - Header: 관심종목 탭 추가 (개수 표시)
  - CenterPanel: 관심종목 모드 시 테이블 표시 (부채비율/배당수익률 칼럼 포함)
  - RightPanel: 종목 상세 헤더에 관심종목 추가/제거 버튼 + 메모 편집 기능
  - LeftPanel: 관심종목 모드 시 안내 메시지
  - App.tsx: AppMode에 'watchlist' 추가, useWatchlist 상태를 자식 컴포넌트에 분배

### 2026-04-02: 시야 AI 구현 완료
- **구현 내용**:
  - `lib/ai.ts`: Claude API 직접 호출 모듈 (나중에 Edge Function 전환 예정)
    - `buildStockContext()`: 종목 DB 데이터를 시스템 프롬프트용 컨텍스트로 변환
    - `askSiyaAi()`: Claude API 호출 (모델: claude-sonnet-4-20250514, max_tokens: 1024)
    - 시스템 프롬프트: 장기 가치투자 관점 분석, 한국어, 데이터 기반 객관적 분석
  - RightPanel AI 탭: 채팅 UI (메시지 목록 + 입력창 + 전송 버튼)
    - 빠른 질문 4개 버튼 (투자 매력, 재무 건전성, 저평가 여부, 실적 추세)
    - 종목 변경 시 대화 자동 초기화
    - 에러 핸들링 + 로딩 애니메이션
- **환경변수**: `VITE_ANTHROPIC_API_KEY`를 `app/.env`에 추가 필요
- **보안 TODO**: 배포 시 Supabase Edge Function 프록시로 전환 (CLAUDE.md TODO 섹션에 기록됨)

### 2026-04-02: 종목 상세 화면 구현 완료
- **구현 내용**:
  - `hooks/useStockDetail.ts`: 종목 기본정보 + 시세 + 밸류에이션 + 재무3년 + 업종평균(PER/PBR/ROE) 병렬 fetch
  - RightPanel 전면 재작성:
    - 종합점수 시각화: 큰 숫자(36px) + 품질/밸류/개선 3개 프로그레스 바
    - 핵심 지표 6개 카드: 업종 평균 비교, 컬러 코딩(good=green, warning=yellow)
    - 재무 추이: 3년 매출/영업이익/ROE 행
    - 동종업계 비교: ROE/PER/PBR 수평 바 차트 + 업종 평균 마커 라인
- **업종 평균 계산**: 같은 sector의 전체 종목 최신 데이터 기반, 이상치 제외 (PER: 0<x≤100, PBR: 0<x≤10, ROE: -100<x<100)

### 2026-04-02: 테마 분석 모드 구현 완료
- **구현 내용**:
  - `lib/scoring.ts`: 신뢰도(거래량30+수급50+동반상승20), 타이밍(RSI+MACD), 종합점수(품질50+밸류20+개선30) 계산 함수
  - `hooks/useThemeData.ts`: `useThemeAnalysis`(전체 테마 신뢰도/타이밍 일괄 계산), `useThemeStocks`(테마 종목 리스트+실제 지표+종합점수)
  - LeftPanel: 카테고리별 그룹핑, 신뢰도 뱃지(HIGH/MEDIUM/LOW), 방향 아이콘(상승/상승가능/관망), 타이밍(진입적기/관망/과열주의)
  - CenterPanel: 테이블 형식 종목 리스트(종목명/점수/PER/PBR/ROE/현재가/등락률), 칼럼 헤더 클릭 정렬
- **기술 결정**:
  - Supabase Database 제네릭 타입 제거 — v2.101.1에서 순환 참조로 `never` 타입 발생, 타입 단언 방식으로 전환
  - 중앙 패널 UI: 테마 분석 모드도 테이블 형식 채택 (기존 계획은 카드형이었으나 스크리너와 일관성 유지)
- **참고**: 기관/외국인 수급 데이터 미수집 상태라 수급 점수는 0으로 표시됨 (pykrx 복구 시 자동 반영)

### 2026-04-02: 스크리너 모드 구현 완료
- **구현 내용**:
  - `types/stock.ts`: `ScreenerFilters` 타입 + `DEFAULT_SCREENER_FILTERS` 기본값, `StockListItem`에 `debt_ratio`/`div_yield` 추가
  - `hooks/useScreenerStocks.ts`: 전체 종목 fetch → 자격필터(Stage 1) → 시장평균 PER 기반 종합점수 계산, 500개 배치 처리
  - LeftPanel 스크리너 UI: 시장 버튼(전체/KOSPI/KOSDAQ) + 5개 슬라이더(PER/PBR/ROE/부채비율/배당수익률) + 적용/초기화 버튼
  - CenterPanel: 스크리너 모드 시 부채비율/배당수익률 칼럼 추가, 필터 결과 개수 표시
  - App.tsx: `screenerFilters` 상태 관리 (LeftPanel → App → CenterPanel 전달)
- **기본 필터값**: PER ≤ 15, PBR ≤ 1.5, ROE ≥ 10%, 부채비율 ≤ 100%, 배당수익률 ≥ 0%
- **스크리너 탭 진입 시 기본 필터 자동 적용** (필터 적용 버튼 클릭 없이도 결과 표시)

### 2026-03-31: 아키텍처 전환 (SQLite → Supabase)
- **배경**: 사무실+집 멀티 디바이스 사용, 로그인, 관심종목 동기화 필요
- **결정**: SQLite(로컬) → Supabase(클라우드) 전환
- **근거**:
  - 로컬 → 서버 나중 전환 시 데이터 관련 코드 전면 재작업 필요 → 처음부터 서버로 가는 게 효율적
  - haimusic 프로젝트에서 Supabase 경험 있음
  - 초기 셋업 1시간 대기 문제 해결 (서버에서 수집, 사용자 대기 없음)
- **추가 테이블**: users (Supabase Auth 연동), watchlist (관심종목)
- **영향**: DB 테이블 구조는 거의 동일, 데이터 수집이 사용자PC → 서버로 이동

---

## 팀 논의 필요 사항 (Phase 2 진입 전)

1. **방향 확정**: Top-down + Bottom-up 병행 접근법 동의?
2. **초기 테마 범위**: 20개 테마로 시작? 더 줄일지?
3. **시그널 임계값**: 거래량 +100%/+150%/+200%, 수급 +300억/+500억/+1,000억 중 선택
4. **MVP 범위/일정**: 어디까지 MVP로 볼 것인가?
5. **기타 피드백**: 자유 의견

---

## 데이터 탐색 결과 (2026-02-04)

### 상장 종목 리스트
- **KOSPI**: 951개 / **KOSDAQ**: 1,822개 / **전체**: 2,773개

### 주가 데이터 (일봉)
- **소스**: FinanceDataReader
- **제공 필드**: Open, High, Low, Close, Volume, Change
- **데이터 품질**: 결측치 없음

### 밸류에이션 데이터 (pykrx)
- **제공 필드**: BPS, PER, PBR, EPS, DIV(배당수익률), DPS(주당배당금)
- **기관/외국인 수급**: `get_market_trading_value_by_investor()` 무료 제공

### 재무제표 데이터 (OpenDartReader)
- **소스**: DART 공시 시스템
- **주요 항목**: 자산총계, 부채총계, 자본총계, 매출액, 영업이익, 당기순이익
- **API 제한**: 일 10,000건 (무료)

### 재무비율 계산 가능 여부
| 지표 | 계산식 | 데이터 소스 |
|------|--------|-------------|
| ROE | 당기순이익 / 자본총계 | OpenDartReader |
| ROA | 당기순이익 / 자산총계 | OpenDartReader |
| 부채비율 | 부채총계 / 자본총계 | OpenDartReader |
| 영업이익률 | 영업이익 / 매출액 | OpenDartReader |

---

## 폴더 구조

```
stock-analyzer/
├── CLAUDE.md              # 프로젝트 컨텍스트 (이 파일)
├── README.md              # 프로젝트 소개
├── requirements.txt       # Python 의존성
├── .gitignore
├── .env                   # 환경변수 (DART API 키, Supabase 키, KIS API 키)
├── app/                   # Tauri + React PC 앱
│   ├── .env               # Supabase 키 + Claude API 키 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ANTHROPIC_API_KEY)
│   ├── package.json
│   ├── src/               # React 소스코드
│   │   ├── App.tsx / App.css
│   │   ├── lib/
│   │   │   ├── supabase.ts    # Supabase 클라이언트
│   │   │   ├── scoring.ts     # 신뢰도/타이밍/종합점수 계산 함수
│   │   │   └── ai.ts          # Claude API 호출 (시야 AI)
│   │   ├── types/         # TypeScript 타입 (database.ts, stock.ts)
│   │   ├── hooks/
│   │   │   ├── useThemeData.ts      # 테마 신뢰도/타이밍/종목 리스트 fetch 훅
│   │   │   ├── useUserThemes.ts     # 사용자별 테마 CRUD + 초기화 훅
│   │   │   ├── useScreenerStocks.ts # 스크리너 필터 적용 + 종합점수 계산 훅
│   │   │   ├── useStockDetail.ts    # 종목 상세 + 업종 평균 fetch 훅
│   │   │   ├── useChartData.ts      # 캔들차트 OHLCV 데이터 fetch 훅
│   │   │   ├── useWatchlist.ts      # 관심종목 CRUD 훅
│   │   │   ├── useWatchlistStocks.ts # 관심종목 종목 데이터 fetch 훅
│   │   │   └── useInvestorData.ts    # 기관/외국인 수급 데이터 fetch 훅
│   │   ├── components/
│   │   │   ├── auth/      # AuthProvider, LoginPage
│   │   │   ├── layout/    # Header, LeftPanel, CenterPanel, RightPanel
│   │   │   ├── stock-detail/ # CandleChart, SupplyChart, DisclosureTab
│   │   │   └── common/    # Tooltip, HelpPage, SplashModal
│   └── src-tauri/         # Tauri (Rust) 설정
│       ├── tauri.conf.json
│       └── Cargo.toml
├── docs/                  # 문서
│   ├── 로직.md            # 화면별 로직 정의서
│   ├── schema.sql         # DB 스키마
│   ├── siya-pc-mockup-v5.html  # 최종 PC 목업
│   └── 시야_PC앱_기획서_v4.pptx
├── src/
│   ├── core/              # 핵심 로직
│   └── data/
│       └── collectors/    # 데이터 수집 모듈 (Python) — kis_api.py, collect_investor_kis.py, collect_dividend_schedule.py, daily_update.py 등
├── scripts/
│   └── exploration/       # 탐색용 스크립트
└── tests/                 # 테스트
```

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
