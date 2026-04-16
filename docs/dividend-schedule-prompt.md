# 배당 일정(dividend_schedule) 수집 — Claude Code 프롬프트

## 배경
시야(Siya) 프로젝트에 **배당 일정** 수집 기능을 추가해야 해.
배당수익률/DPS(금액)는 이미 KIS API로 매주 수집 중인데, **배당락일/배당기준일/배당지급일(날짜)**은 아직 없어.
사용자가 종목 상세에서 "다음 배당을 언제 받을 수 있나"를 확인할 수 있도록 날짜 정보를 DB에 쌓아야 해.

## 환경
- 프로젝트 경로: `C:\projects\stock-analyzer\`
- Python: Conda 환경 `siya` (Python 3.11) — **Anaconda Prompt에서 실행**
- `.env`에 `KIS_APP_KEY`, `KIS_APP_SECRET` 이미 저장됨
- `src/data/collectors/kis_api.py` 이미 존재 — 토큰 발급/캐싱/공통 GET 함수 **재사용할 것**
- `CLAUDE.md` 읽어서 프로젝트 전체 컨텍스트 파악할 것
- 기존 수집 스크립트 패턴 참고: `src/data/collectors/collect_investor_kis.py`, `daily_update.py`

## 작업 목록 (순서대로)

### 작업 1: 한투 API 배당 일정 엔드포인트 탐색 및 확정
한투 공식 문서에서 배당 일정 조회 엔드포인트를 찾아야 해. 후보는:

1. **예탁결제원 배당 일정** — `/uapi/domestic-stock/v1/ksdinfo/dividend`
   - 기간 지정으로 전체 종목 배당 일정 일괄 조회 가능성 있음
   - 한투 GitHub 샘플: https://github.com/koreainvestment/open-trading-api

2. **종목 현재가 상세** — 현재가 API 응답에 배당 관련 필드가 포함될 수도 있음

**확인 사항:**
- 정확한 엔드포인트 경로, tr_id, 필수 파라미터
- 응답 필드명 (배당락일, 배당기준일, 배당지급일, 주당배당금, 배당 종류 등)
- 기간 조회(전체 일괄) vs 종목별 조회 중 어느 쪽이 가능한지
- 기간 조회가 가능하면 그 방식을 우선 채택 (전 종목 순회 회피)

공식 문서 확인 후 사용자에게 "이 엔드포인트를 쓸 거야, 응답 구조는 이렇게 돼" 보고하고 진행.

### 작업 2: DB 테이블 설계
파일: `docs/dividend_schedule_schema.sql`

제안 스키마 (응답 구조 보고 조정):
```sql
CREATE TABLE IF NOT EXISTS dividend_schedule (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  ex_dividend_date DATE,          -- 배당락일
  record_date DATE,               -- 배당기준일
  payment_date DATE,              -- 배당지급일
  dividend_per_share NUMERIC,     -- 주당 배당금(원)
  dividend_type TEXT,             -- 결산/중간/분기/특별 등
  fiscal_year INT,                -- 사업연도
  source TEXT DEFAULT 'kis_api',
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stock_code, record_date, dividend_type)
);

CREATE INDEX idx_dividend_stock ON dividend_schedule(stock_code);
CREATE INDEX idx_dividend_ex_date ON dividend_schedule(ex_dividend_date DESC);

-- RLS: 모든 인증 사용자 read-only (다른 테이블과 동일 패턴)
ALTER TABLE dividend_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON dividend_schedule FOR SELECT USING (true);
```

작성 후 사용자에게 **Supabase SQL Editor에서 실행해달라고 안내**. 수집 스크립트 실행 전에 테이블이 있어야 함.

### 작업 3: 수집 스크립트
파일: `src/data/collectors/collect_dividend_schedule.py`

요구사항:
- `kis_api.py`의 `get_access_token()`, `kis_get()` 재사용
- KIS API로 배당 일정 조회 → `dividend_schedule` 테이블에 upsert
- `source='kis_api'`
- 중복 방지: `(stock_code, record_date, dividend_type)` UNIQUE 제약 활용, ON CONFLICT DO UPDATE
- CLI 옵션:
  - 기간 조회 API가 있으면 `--from YYYY-MM-DD --to YYYY-MM-DD`
  - 종목별 조회만 가능하면 `--stock 005930` (단일 테스트) / 옵션 없으면 전 종목
- 진행률: 500개마다 출력 (전 종목 순회인 경우)
- 에러 처리: 3회 재시도, 실패 시 건너뛰고 로그
- 호출 간 `time.sleep(0.4)` (이미 `kis_api.py` 내부에서 처리되면 불필요)

### 작업 4: 실행 주기 결정 및 자동화 연결
배당 일정은 분기/연간 단위 이벤트라 자주 안 바뀜. **주 1회가 적절**.

기존 배당수익률/DPS 수집(매주 월요일 17:00)과 같은 시간대에 묶는 것을 권장.

파일: `.github/workflows/` 내 주간 워크플로우 확인:
- 기존 주간 배당 수집 워크플로우가 있으면 → 해당 파일에 Step 추가
- 없으면 → 신규 `weekly-update.yml` 생성 (cron: `0 8 * * 1` = 매주 월요일 KST 17:00 = UTC 08:00)

GitHub Secrets (`KIS_APP_KEY`, `KIS_APP_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)는 이미 등록됨 → 신규 등록 불필요.

### 작업 5: 초기 수집 실행
사용자에게 Anaconda Prompt에서 실행하도록 안내:
```
conda activate siya
cd C:\projects\stock-analyzer
python src/data/collectors/collect_dividend_schedule.py --stock 005930
```

삼성전자(005930), 한온시스템(018880), SK텔레콤(017670) 같은 **대표 배당주**로 테스트. 결과를 DB에서 SELECT로 확인:
```sql
SELECT stock_code, ex_dividend_date, record_date, payment_date, dividend_per_share, dividend_type, fiscal_year
FROM dividend_schedule
WHERE stock_code IN ('005930', '018880', '017670')
ORDER BY record_date DESC;
```

테스트 통과하면 전 종목 실행:
```
python src/data/collectors/collect_dividend_schedule.py
```

### 작업 6: CLAUDE.md 업데이트
- Phase 3 체크리스트에 "배당 일정 수집" 완료 항목 추가
- 의사결정 기록에 오늘 날짜로 항목 추가 (KIS API 배당 엔드포인트 연동, 스키마, 수집 주기, 초기 수집 결과)
- `dividend_schedule` 테이블 존재를 폴더 구조 또는 DB 설명에 반영

## 중요 참고사항
- 실행은 **반드시 Anaconda Prompt에서** `conda activate siya` 후
- `kis_api.py` 변경은 **최소화** — 이미 Python 수집기와 Edge Function이 공유 중
- 배당 일정 응답에 **예상일**(미래 날짜)과 **실적**(과거 날짜)이 섞여 올 수 있음 → 둘 다 저장하되 구분 필요 시 필드 추가
- 한투 API에 종목별 배당 일정이 **없는 경우**도 많음 (비배당주) → 빈 응답 정상 처리
- 프론트엔드 작업은 이 작업 범위 **밖**. 백엔드 완료 후 별도 세션에서 진행.

## 완료 체크리스트
- [ ] 한투 API 엔드포인트 확정 + 사용자 보고
- [ ] `dividend_schedule` 테이블 스키마 작성 (`docs/dividend_schedule_schema.sql`)
- [ ] 사용자가 Supabase에서 스키마 실행했는지 확인
- [ ] `collect_dividend_schedule.py` 작성
- [ ] 단일 종목 테스트 (삼성전자) → DB에 정상 저장 확인
- [ ] 대표 배당주 3개 테스트 → 결과 합리성 확인
- [ ] 전 종목 실행 → 수집 건수/오류 리포트
- [ ] GitHub Actions 주간 스케줄 연결
- [ ] `CLAUDE.md` 업데이트
