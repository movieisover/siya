# 시야 (Siya) — 한국 주식 가치투자 분석 PC 앱

## AI 어시스턴트 정보

- **이름**: 시야
- **역할**: 이 프로젝트 전용 AI 개발 파트너
- **의미**: 시장을 보는 넓은 눈, 가치를 꿰뚫어 보는 시야

> **Claude Code에서 대화 시작 시**: "시야야" 또는 "시야"로 불러주세요.

---

## 프로젝트 개요

- **앱 이름**: 시야 (Siya)
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
| pykrx | PER, PBR, 배당, 거래량, **기관/외국인 수급** | 밸류에이션 + 테마 시그널 |
| OpenDartReader | 재무제표 (매출, 이익, 부채) | 재무 분석 |
| TradingView-Screener | RSI, MACD 등 기술지표 | 테마 타이밍 지표 (진입 시점 판단) |

> **pykrx 기관/외국인 데이터**: `stock.get_market_trading_value_by_investor()` 함수로 무료 제공 확인됨

---

## 핵심 원칙

1. **데이터 현실 파악 먼저** - 설계 전에 실제 데이터를 확인한다
2. **단단한 기초** - 데이터 모델은 신중하게, 기능은 점진적으로
3. **독립적 모듈** - 각 기능이 독립적으로 동작하게 만든다
4. **과잉 설계 금지** - 필요할 때 필요한 만큼만

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
- [x] DB 스키마 설계 (10개 테이블: stocks, price_daily, valuation, financials, investor_trading, themes, stock_themes, technical, users, watchlist)
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
- [x] DB 테이블 생성 (schema.sql 실행) — 10개 테이블 + RLS + 인덱스 + 트리거 완료
- [x] 테마 20개 등록 (insert_themes.sql)
- [x] 종목 마스터 수집 (KOSPI 950 + KOSDAQ 1,823 = 2,773개)
- [x] 종목-테마 매핑 (20개 테마 × 테마당 5~15개 핵심 종목, 수동 매핑)
- [x] 데이터 수집 모듈 개발 (Python)
  - [x] 일별 시세 (price_daily) — 2,783개 종목 3년치
  - [x] 재무제표 (financials) — 2,328개 종목 3개년(2022~2024)
  - [x] 밸류에이션 (valuation) — PER/PBR 자체 계산 2,454개 종목 (시세+재무+발행주식수)
  - [ ] 기관/외국인 수급 (investor_trading) — pykrx API 복구 후 수집 필요 (⬇️ TODO 참고)
  - [x] 기술지표 (technical) — RSI/MACD 자체 계산 2,674개 종목
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

### 진행 예정 (미루둔 작업)
- [ ] pykrx API 복구 확인 → 기관/외국인 수급 + 배당 데이터 수집 (4/8 확인: 여전히 고장)
- [ ] 한국투자증권 오픈API 연동 — 실시간 시세 + 수급 데이터 해결 (계좌 개설 필요)
- [ ] 웹 배포 (Vercel) — 1차 배포
- [ ] PC 앱 배포 (Tauri exe) — 웹 배포 1~2주 사용 후

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
  - GitHub 리포지토리: https://github.com/movieisover/siya (Private)
- **헤더 시세 기준일 표시**: "4월 8일 종가 기준" 배지 추가, 5분마다 자동 갱신
- **종목 상세 데이터 날짜 표시**: 가격 아래에 "4월 8일(화) 기준" 표시 (실시간 대비용)
- **pykrx 복구 확인**: 여전히 고장 (get_market_fundamental, get_market_trading_value_by_date 등)
- **배포 계획 수립**: 웹 배포(Vercel) 1차 → 1~2주 사용 → PC 앱(Tauri exe) 2차
- **한국투자증권 오픈API 검토**: 실시간 시세 + 수급 데이터 + 배당 동시 해결 가능, 계좌 개설 필요

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
├── .env                   # 환경변수 (DART API 키, Supabase 키)
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
│   │   │   ├── useScreenerStocks.ts # 스크리너 필터 적용 + 종합점수 계산 훅
│   │   │   ├── useStockDetail.ts    # 종목 상세 + 업종 평균 fetch 훅
│   │   │   ├── useWatchlist.ts      # 관심종목 CRUD 훅
│   │   │   └── useWatchlistStocks.ts # 관심종목 종목 데이터 fetch 훅
│   │   ├── components/
│   │   │   ├── auth/      # AuthProvider, LoginPage
│   │   │   ├── layout/    # Header, LeftPanel, CenterPanel, RightPanel
│   │   │   └── common/    # Tooltip, HelpPage
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
│       └── collectors/    # 데이터 수집 모듈 (Python) — update_sector.py 포함
├── scripts/
│   └── exploration/       # 탐색용 스크립트
└── tests/                 # 테스트
```

---

## TODO: 보류 작업

### pykrx API 복구 확인 (정기적으로 체크 필요)
- **상태**: 2026-04-01 기준 `get_market_fundamental`, `get_market_trading_value_by_date` 등 고장
- **영향**: 밸류에이션(PER/PBR), 기관/외국인 수급 수집 불가
- **확인 방법**: `python scripts/test_valuation.py` 또는 `python scripts/test_investor.py` 실행
- **GitHub 이슈 확인**: https://github.com/sharebook-kr/pykrx/issues
- **복구 시 실행할 것**:
  1. `pip install --upgrade pykrx` (패키지 업데이트)
  2. `python src/data/collectors/collect_valuation.py` (밸류에이션 수집)
  3. `python src/data/collectors/collect_investor.py` (기관/외국인 수급 수집)
- **대안**: 한국투자증권 오픈API로 대체 가능 (계좌 필요)

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
  - 매일: 일별 시세, PER/PBR(자체계산), RSI/MACD(자체계산), 기관/외국인 수급(pykrx 복구 후)
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
