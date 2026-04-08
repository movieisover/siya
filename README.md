# 한국 주식 가치투자 분석 앱

장기 가치/퀄리티 투자를 위한 한국 주식 분석 도구

## 시작하기

### 1. 환경 설정

```bash
cd stock-analyzer

# 가상환경 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 데이터 탐색 실행

```bash
python scripts/exploration/01_data_exploration.py
```

### 3. OpenDartReader API 키 (재무제표용)

1. [DART 오픈API](https://opendart.fss.or.kr/) 회원가입
2. 인증키 발급 (무료)
3. `.env` 파일 생성:
   ```
   DART_API_KEY=your_api_key_here
   ```

## 프로젝트 구조

```
stock-analyzer/
├── CLAUDE.md              # AI 어시스턴트(시야) 컨텍스트
├── README.md              # 이 파일
├── requirements.txt       # Python 의존성
├── .env                   # API 키 (git 제외)
├── docs/                  # 문서
├── src/
│   ├── core/              # 핵심 로직
│   └── data/
│       └── collectors/    # 데이터 수집
├── scripts/
│   └── exploration/       # 탐색 스크립트
└── tests/                 # 테스트
```

## 개발 with Claude Code

이 프로젝트는 **Claude Code**와 함께 개발됩니다.

```bash
# Claude Code CLI
claude

# 또는 VSCode에서 폴더 열기
```

AI 어시스턴트 이름: **시야**

## 진행 상황

- [x] Phase 0: 프로젝트 설정
- [ ] Phase 1: 데이터 탐색
- [ ] Phase 2: 데이터 모델 설계
- [ ] Phase 3: MVP v1 - 스크리너
- [ ] Phase 4: MVP v2 - 종목 상세

자세한 진행 상황은 `CLAUDE.md` 참조
