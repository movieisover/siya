# 시야 모바일 레이아웃 — 작업 컨텍스트

> 모바일 관련 세션 시작 시 반드시 이 파일을 먼저 읽을 것.
> 메인 CLAUDE.md도 함께 읽어 전체 프로젝트 맥락 유지.

---

## 설계 원칙

- **같은 프로젝트 안에서 분기**: 별도 폴더/빌드 없이 `app/src/components/mobile/`에 모바일 전용 컴포넌트를 두고, App.tsx에서 모바일 감지 시 다른 컴포넌트 트리를 렌더링
- **기존 컴포넌트 최대 재활용**: 새로 만드는 건 셸·리스트·설치화면 등 최소한. 나머지는 import해서 사용
- **단계별 구현 + 확인**: 한 단계 완료 후 동철님이 localhost:1420에서 확인하고 다음 단계 진행
- **PWA는 마지막 단계**: 모바일 레이아웃이 완성된 후 manifest + 설치 유도 화면 추가

---

## 모바일 화면 구조

```
[상단바: 시야 로고 · 검색 아이콘 · 도움말 아이콘]

[화면 영역 — 현재 탭에 따라]

  탭1 테마    → 테마 목록(ThemeCard) → 테마 선택 → 종목 리스트 → 종목 탭 → 종목 상세
  탭2 스크리너 → 필터 바텀시트 + 결과 리스트 → 종목 상세
  탭3 관심종목 → 종목 리스트 → 종목 상세
  탭4 공시    → DisclosureTab 전체화면

  종목 상세 (전체화면, 뒤로가기로 복귀):
    현재가·점수 → 차트(시세/수급) → 핵심지표 → 동종업계 → 수급 → 배당
    종목 상세 탭 | 시야 AI 탭  (공시는 하단 탭바로 분리됨)

[하단 탭바: 테마 | 스크리너 | 관심종목 | 공시]
```

### 핵심 UX 결정사항
- **공시는 전역 탭**: 종목 상세와 무관한 전체 공시 목록 → 하단 탭바 독립 배치. RightPanel의 공시탭은 모바일에서 CSS로 숨김
- **시야 AI**: 바텀시트 별도 구현 없음. 종목 상세 내 탭으로 이미 전체화면 전환 동작하므로 충분. 모바일 화면 크기상 "같이 보기"가 현실적으로 불가능
- **종목 리스트는 리스트형 2줄 행** (토스증권 등 국내 앱 표준):
  ```
  SK하이닉스            2,333,000  +1.92%
  점수 78.6  PER 38.7  PBR 13.8  ROE 35.6%
  ```
- **정렬 칩**: 점수순 · 등락률 · ROE · PER · PBR (각 탭 재탭 시 방향 전환)
- **관심종목**: MobileWatchlistView에서 useWatchlist() 직접 호출 (MobileApp에서 prop으로 받지 않음 — 즉시 반영 보장)

---

## 컴포넌트 재활용 맵

| 기존 컴포넌트 | 모바일에서 재활용 위치 | 처리 |
|---|---|---|
| `RightPanel` 전체 | 종목 상세 전체화면 | CSS override로 폭·높이 해제 |
| `RightPanel > AiTab` | 종목 상세 내 시야 AI 탭 | 그대로 재활용 |
| `RightPanel > DisclosureTab` | 탭4 공시 전체화면 | 그대로 재활용 |
| `LeftPanel > ThemeCard` | 탭1 테마 목록 | 그대로 재활용 (MobileThemeView 내부) |
| `LeftPanel > ScreenerFilterPanel` | 탭2 필터 바텀시트 | 슬라이더 직접 재구현 |

---

## 파일 구조

```
app/
├── index.html                       ← PWA manifest 링크, SW 등록, 모바일 메타태그 추가됨
├── public/
│   ├── manifest.json                ← PWA manifest (신규)
│   ├── sw.js                        ← Service Worker (신규)
│   └── icon-512.svg                 ← 앱 아이콘 (신규)
└── src/
    ├── App.tsx                      ← 모바일 감지 분기 추가됨
    ├── mobile.css                   ← 모바일 전용 스타일 (신규)
    └── components/mobile/
        ├── MobileApp.tsx            ← 전체 셸 + 화면 전환 + 설치 유도 분기
        ├── MobileHeader.tsx         ← 상단바 (로고 + 검색 + 도움말)
        ├── MobileTabBar.tsx         ← 하단 4탭 네비게이션
        ├── MobileStockList.tsx      ← 2줄 행 종목 리스트 + 정렬 칩
        ├── MobileStockDetail.tsx    ← 종목 상세 전체화면 (RightPanel 래퍼)
        ├── MobileThemeView.tsx      ← 테마 목록 → 종목 리스트 (목록 편집 + 종목 추가/제거)
        ├── MobileScreenerView.tsx   ← 필터 바텀시트 + 결과 리스트
        ├── MobileWatchlistView.tsx  ← 관심종목 리스트
        ├── MobileSearch.tsx         ← 전체화면 검색 오버레이 (신규)
        ├── MobileChartLayer.tsx     ← 차트 전체화면 레이어 (신규)
        └── MobileInstallGuide.tsx   ← PWA 설치 유도 화면
```

---

## 단계별 작업 계획

### 완료
- 설계 확정 (2026-06-01)
- **1단계 완료 (2026-06-02)**: 모바일 감지 + 상단바 + 하단 탭바 + 화면 전환 골격. 확인 완료
- **2단계 완료 (2026-06-02)**: 종목 리스트(MobileStockList) + 4개 탭 뷰. 확인 완료 (리스트형 2줄 행, 점수·PER·PBR·ROE, 정렬 칩 5개, 필터 바텀시트)
- **3단계 완료 (2026-06-02)**: 종목 상세 전체화면(MobileStockDetail). RightPanel 재활용, 공시탭 CSS 숨김, 중복 별★ 제거, 관심종목 즉시반영. 확인 완료
- **4단계 건너뜀 (2026-06-02)**: 시야 AI 바텀시트 → 종목 상세 내 탭으로 이미 충분. 바텀시트는 모바일 화면 크기상 실익 없음으로 판단
- **5단계 완료 (2026-06-02)**: PWA manifest + SW + 설치 유도 화면. 로컬 확인 완료(스킵 버튼 동작). 실제 설치는 배포 후 폰에서 확인 필요

### 진행중 → 완료 후 다음 작업 순서 (2026-06-03~)
1. [x] **로그아웃 버튼** (2026-06-03 완료) — MobileHeader에 텍스트 "로그아웃" 칩 버튼 추가, MobileApp에서 useAuth().signOut 연결. signOut → user=null → App.tsx가 자동으로 LoginPage 렌더. 확인 완료.
2. [x] **상단바 검색 기능** (2026-06-03 완료) — 신규 MobileSearch.tsx(전체화면 오버레이, 입력창 자동포커스, 에시 입력 → 결과 리스트). 검색 로직은 데스크탑 Header.tsx 재활용(stocks ilike + 300ms 디바운스 + 2글자 이상). MobileApp에 showSearch 상태 + 오버레이 연결, 결과 탭 → handleStockSelect로 상세 이동 + 자동 닫힘. MobileHeader는 안 건드림(빈 onSearchOpen만 교체). 확인 완료.
3. [x] **차트 추가** (2026-06-03 완료) — 상시 인라인 차트 대신 주가 옆 "📈 차트보기" 버튼(모바일 전용) → 전체화면 레이어 방식으로 구현.
   - 신규 `MobileChartLayer.tsx`: 시세/수급 토글 + 기간 + 이동평균(시세, 차트 내장) + X. CandleChart/SupplyChart 그대로 재활용.
   - `RightPanel.tsx`에 `onChartOpen?` 옵션 prop 추가 → **콜백이 있을 때만** 주가 옆 버튼 렌더 → 데스크탑엔 안 생김(MobileStockDetail에서만 콜백 전달).
   - **방향 반응**: 세로 기본 + "↻ 가로로 돌리면 더 넓게" 힌트, 가로면 차트 크게(72vh). 강제 회전 X(iOS 미지원) → 돌리면 보너스 방식 확정.
   - 안드로이드 하드웨어 뒤로가기로 닫기(popstate). 확대버튼(⛶)은 레이어 내부에서 CSS로 숨김(레이어 자체가 확대 뷰).
   - **버그 2건 해결**:
     - (a) 레이어가 즉시 닫히던 문제 → StrictMode 이중 마운트 시 cleanup의 `history.back()`이 원인. cleanup에서 back() 제거, 닫기는 항상 history.back()→popstate→onClose 경로로 통일.
     - (b) 시세차트 가로 전환 시 빈 차트 → CandleChart가 차트 생성([height])과 데이터 그리기([data]) effect가 분리돼 있어, 높이 변경 시 재생성되면서 데이터 effect가 안 돌아 빈 차트. 데이터 effect deps에 height 추가로 해결(SupplyChart는 effect 1개라 무관했음). 데스크탑은 height 고정이라 영향 없음.
   - 파일: MobileChartLayer.tsx(신규), MobileStockDetail.tsx, RightPanel.tsx, CandleChart.tsx, mobile.css
4. [x] **메인 헤더 고정** (2026-06-03 완료) — 각 뷰(테마/스크리너/관심종목 + MobileStockList)를 세로 flex 컬럼(height:100%, overflow:hidden)으로 바꿔 상단 영역(헤더/정렬칩/필터바/뒤로가기바/테마추가줄)은 flex-shrink:0 고정, 리스트 영역만 flex:1; overflow-y:auto로 스크롤. 종목 상세가 쓰던 검증된 패턴과 동일. **CSS만** 수정(JSX 무변경). 파일: mobile.css
5. [x] **테마 안 종목 추가/제거** (2026-06-03 완료) — 종목 리스트 화면 뒤로가기 바에 "종목 편집" 토글.
   - `MobileStockList.tsx`: `editMode`(행 ✕ 제거) + `addBar`(추가 검색바 슬롯) 옵션 추가. 빈 테마에서도 추가바 노출되게 구조 정리. 스크리너/관심종목은 옵션 미전달이라 그대로.
   - `MobileThemeView.tsx`: `StockAddSearch` 인라인 컴포넌트(stocks ilike 검색 → + 추가, 이미 있으면 ✓ 추가됨). addStock/removeStock 후 `theme-stocks-changed` 이벤트로 useThemeStocks 리로드(데스크탑과 동일 패턴). 목록 복귀 시 변경됐으면 reloadAnalysis로 신뢰도/타이밍 재계산(stocksDirty ref).
   - 파일: MobileStockList.tsx, MobileThemeView.tsx, mobile.css
6. [x] **헤더 홈화면 설치 버튼** (2026-06-03 완료) — 설치화면 스킵한 사용자도 헤더에서 언제든 설치 가능.
   - **이벤트 캐처를 MobileApp으로 올림**: `beforeinstallprompt`는 페이지 로드당 1회만 발생 → 항상 떠있는 MobileApp에서 캐처(`installPrompt` 상태) + `appinstalled`로 해제. MobileInstallGuide는 prop 기반으로 리팩터(installPrompt/isIOS/onDismiss/onInstalled, `BeforeInstallPromptEvent` 타입 export).
   - `canInstall = !standalone && (installPrompt ≠ null || isIOS)`일 때만 헤더에 `onInstallOpen` 전달 → 탭하면 설치화면 재오픈.
   - **라벨 "앱설치"**(아이콘 X): 버튼은 동작을 말해야 명확 → 이모지/"앱" 단독은 모호. PWA는 설치 시 진짜 앱처럼 동작하므로 "앱"으로 부르는 건 정당(Spotify도 "Install App"). 헤더 공간 확보위해 도메인 텍스트(.mobile-header-domain)는 모바일에서 display:none.
   - **주의**: 설치칩은 beforeinstallprompt가 떠야만 나타남(로컬은 F5 필요할 수). 재로그인 후 사라짐 = 페이지 재로드가 아니라 브라우저가 프롬프트 회수한 것(정상, 버그 아님). 파일: MobileApp.tsx, MobileHeader.tsx, MobileInstallGuide.tsx, mobile.css
7. [x] **툴팁 처리 — 바텀시트** (2026-06-03 완료) — (B) 바텀시트 방식 채택.
   - `Tooltip.tsx`가 detectMobile()(width<768 || 모바일 UA, resize 감지)로 분기: 모바일 = ⓘ 탭 → 하단 시트(.tooltip-sheet-overlay z-index 400, white-space:pre-line, "닫기"), 데스크탑 = 기존 hover 그대로. 같은 컴포넌트라 RightPanel/차트 등 모든 ⓘ에 자동 적용. z-index 400 > 차트레이어(300)라 차트 안 ⓘ도 동작.
   - **빠졌던 ⓘ 추가**: 데스크탑 LeftPanel ThemeCard에만 있던 신뢰도/타이밍 ⓘ을 모바일 테마 카드(MobileThemeView)에 동일 텍스트로 추가(배지 옆 + RSI/GC 옆). ⓘ onClick은 stopPropagation돼 테마로 안 들어감. (종목 상세·차트 ⓘ은 RightPanel 재활용이라 원래 있음.)
   - **전체 도움말(HelpPage)도 모바일 바텀시트**: `@media (max-width:767px)`로 .help-modal을 하단 시트(전체폭, 상단 라운드, 90vh, slide-up)로 override(!important). 표는 display:block; overflow-x:auto로 가로스크롤. 데스크탑(≥768px)은 기존 중앙 모달 그대로. JSX 무변경.
   - 파일: Tooltip.tsx, MobileThemeView.tsx, mobile.css
8. [x] **실기 테스트 (배포 후 폰)** (2026-06-03) — 안드로이드 크롬: 앱설치 칩 정상 노출. iOS 사파리/앱: 상·하단·툴팁 확인. 발견 이슈는 9번에서 수정.
9. [x] **실기 이슈 수정** (2026-06-03 완료) — 폰에서 발견된 5건 + 탭바.
   - **(#1) 수급 범례**: SupplyChart.tsx 의 "기관 (우)/외국인 (좌)" → "기관/외국인" (외국인이 선형이라 좌우 구분 불필요). PC·폰 공용.
   - **(#2) 안드로이드 앱설치 칩**: `beforeinstallprompt`가 로그인 화면(MobileApp 마운트 전)에 발생해 놓치던 문제 → 캐처를 **main.tsx 모듈 로드 시점으로 상향**(window.__siyaInstallPrompt 전역 보관 + 'siya-install-available' 커스텀 이벤트). MobileApp은 마운트 시 전역값 읽고 늦은 도착도 수신. **결과: 크롬·iOS 정상. 삼성 인터넷은 beforeinstallprompt 미발생(브라우저 차이)이라 미노출 = 정상**.
   - **(#3·#4·탭바) iOS standalone safe-area**: status-bar-style=black-translucent라 콘텐츠가 노치/홈인디케이터 밑으로 들어감. 상·하단 고정바에 `env(safe-area-inset-*)` 반영. **box-sizing 함정**: height 고정 바에 padding(safe-area) 추가하면 border-box라 콘텐츠가 찌그러짐(탭바 아이콘이 위로 쏠린 원인). → **height 대신 min-height: calc(기본 + env(...)) + box-sizing:border-box**. 적용: `.mobile-header`(top), `.mobile-search-bar`(top), `.mobile-detail-screen > .mobile-back-bar`(top; 테마 종목리스트의 뒤로가기바는 헤더 아래라 제외), `.mobile-tabbar`(bottom). 데스탑은 env=0이라 무영향.
   - **(#5) 툴팁 바텀시트 닫기 가림**: iOS에서 스크롤 컨테이너 안 `position:fixed`가 뷰포트가 아닌 스크롤영역 기준이 돼 탭바에 가림 → `createPortal`로 **document.body에 직접 렌더** + 하단 패딩 확대.
   - **(추가) SW 배포 반영**: `/`(HTML)를 cache-first로 잡아 새 배포가 반영 안 되던 문제 → **HTML은 network-first**(오프라인 시 캐시 폴백)로 변경, CACHE_NAME v3.
   - 파일: main.tsx, MobileApp.tsx, SupplyChart.tsx, Tooltip.tsx, mobile.css, sw.js

### 향후 개선 후보
- 차트 터치 UX 개선 (핀치줌, 스와이프 탐색)
- 스크리너 필터 슬라이더 터치 영역 개선

---

## 모바일 감지 방식

```typescript
// App.tsx에서 사용
const isMobile = window.innerWidth < 768 ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
```

resize 이벤트도 감지해 태블릿 가로/세로 전환 대응.

---

## 알려진 이슈 / 주의사항

- **스크리너 슬라이더 터치**: range input 터치 영역이 좁을 수 있어 실기기 테스트 필요
- **차트 터치 이벤트**: CandleChart·SupplyChart는 모바일 해상도·터치에서 별도 테스트 필요
- **AiTab localStorage**: stockCode 기준 저장이라 모바일/데스크톱 대화 공유됨 (정상)
- **PWA iOS**: beforeinstallprompt 없음 → 3단계 수동 안내. HTTPS 필수
- **설치 유도 재표시**: localStorage.removeItem('siya_install_dismissed') 로 초기화 가능
- **standalone 감지**: display-mode: standalone + navigator.standalone(iOS) 두 가지 모두 체크
- **LoginPage.tsx / MobileHeader.tsx 수정 시 블랙화면** (2026-06-02 발생 → 2026-06-03 재현 안 됨, 사실상 해소)
  - CLI가 추정한 beforeinstallprompt 이벤트 충돌 가설은 **틀림**: 그 리스너는 MobileInstallGuide.tsx 한 곳에만 등록돼 있고, MobileHeader/LoginPage는 그 이벤트를 전혀 안 건드림 (둘 다 순수 표시 컴포넌트, 리스너 없음)
  - 6/3 MobileHeader 최소 편집(onSignOut prop + 버튼 1개) 후 정상 동작, 블랙화면 재현 안 됨 → 과거 블랙화면은 **Vite HMR stale 상태 추정** (편집 후 풀 리로드로 해소되는 류)
  - 교훈: MobileHeader 편집 후 화면 이상하면 먼저 풀 리로드(Ctrl+Shift+R)부터
- **index.html 한글 금지** (2026-06-02, 교훈)
  - 한글 포함 시 인코딩 깨짐 → JS 실행 불가 → 흰 화면
  - index.html에는 영문자만 사용할 것
- **SW 캐시 전략 (2026-06-03 업데이트, 현재 v3)**
  - HTML(네비게이션)은 **network-first** → 새 배포가 즉시 반영(오프라인 시 캐시 폴백). 그 외 정적 셸 자산(icon, manifest)만 cache-first.
  - 따라서 JS/CSS/HTML 변경은 **재배포만으로 반영**(CACHE_NAME 안 올려도 됨). icon-512.svg/manifest 등 정적 셸 자산을 바꿀 때만 CACHE_NAME 숫자를 올릴 것 (siya-v3 -> v4 ...).
  - 폰에서 SW 갱신: 앱(또는 탭)을 완전히 닫았다 다시 열기. 강제: DevTools -> Application -> Service Workers -> Unregister, 또는 사이트 데이터 삭제.
  - icon-512.svg는 상승그래프 디자인 그대로 확정(원형 런처엔 끝점이 약간 잘릴 수 있으나 그대로 두기로 결정).
- **iOS standalone safe-area (2026-06-03, 교훈)**
  - status-bar-style=black-translucent → 콘텐츠가 노치/홈인디케이터 밑으로 들어감. 상·하단 고정 바에 env(safe-area-inset-*) 필수.
  - box-sizing 함정: height 고정 바에 padding(safe-area) 추가하면 border-box라 콘텐츠가 찌그러짐 → min-height: calc(기본 + env(...)) 패턴 사용. 적용처: .mobile-header, .mobile-search-bar, .mobile-detail-screen>.mobile-back-bar(상단), .mobile-tabbar(하단).
- **PWA 설치 버튼은 브라우저별 차이** (2026-06-03)
  - 크롬(안드로이드): beforeinstallprompt 발생 → "앱설치" 노출. iOS 사파리: isIOS로 수동 안내(공유→홈 화면에 추가). **삼성 인터넷: beforeinstallprompt 미발생 → 미노출(정상)**. 미지원 브라우저엠 버튼 숨김이 정석.
  - beforeinstallprompt는 로그인 전 발생 가능 → main.tsx에서 전역 캐처(9번 참고).
