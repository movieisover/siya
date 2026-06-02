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
        ├── MobileThemeView.tsx      ← 테마 목록 → 종목 리스트
        ├── MobileScreenerView.tsx   ← 필터 바텀시트 + 결과 리스트
        ├── MobileWatchlistView.tsx  ← 관심종목 리스트
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

### 진행중
- 배포 후 폰 실제 테스트 (stocksiya.com)
  - 안드로이드: "홈 화면에 설치" 버튼 동작 확인
  - iOS: 공유→홈 화면에 추가 안내 표시 확인
  - 설치 후 standalone 풀스크린 진입 확인

### 향후 개선 후보
- 검색 기능 (상단바 검색 아이콘)
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
- **LoginPage.tsx / MobileHeader.tsx 수정 시 블랙화면 발생** (2026-06-02, 미해결)
  - 빌드 성공, 런타임 에러, 에러 바운더리도 안 잡힘, 코드/인코딩 정상
  - 원인 미파악. 다음 시도 방향: 이 두 파일 대신 MobileApp.tsx에 직접 구현
- **index.html 한글 금지** (2026-06-02, 교훈)
  - 한글 포함 시 인코딩 깨짐 → JS 실행 불가 → 흰 화면
  - index.html에는 영문자만 사용할 것
