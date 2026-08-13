-- ============================================================
-- migrate_financials_expansion.sql — 재무 계정 확장 (B-1)
-- ============================================================
-- 목적: 시야트레이더 종목선정(정통 Piotroski F-score + 총이익성) 원자료를 위해
--       financials에 매출원가·매출총이익·현금성자산·유동자산/부채·영업활동현금흐름(CFO)
--       6개 컬럼 추가. 연간(FY)·분기(Q1~Q3) 공용.
--       (핸드오프: docs/핸드오프_재무확장.md)
-- 원칙: 시야는 원자료만 저장. 비율/팩터(GP÷자산, 유동비율, CFO>ROA 등)는 소비자가 산출.
-- 적용: Supabase SQL 에디터에 붙여넣어 실행
-- 작성: 시야 (2026-08-13)
-- ============================================================

ALTER TABLE financials ADD COLUMN IF NOT EXISTS cost_of_sales       BIGINT;  -- 매출원가 (백만원)
ALTER TABLE financials ADD COLUMN IF NOT EXISTS gross_profit        BIGINT;  -- 매출총이익 (백만원) — 총이익성 팩터용
ALTER TABLE financials ADD COLUMN IF NOT EXISTS cash_and_equiv      BIGINT;  -- 현금및현금성자산 (백만원) — EV 순부채용
ALTER TABLE financials ADD COLUMN IF NOT EXISTS current_assets      BIGINT;  -- 유동자산 (백만원) — 유동비율(F ⑥)용
ALTER TABLE financials ADD COLUMN IF NOT EXISTS current_liabilities BIGINT;  -- 유동부채 (백만원) — 유동비율(F ⑥)용
ALTER TABLE financials ADD COLUMN IF NOT EXISTS cfo                 BIGINT;  -- 영업활동현금흐름(CFO) (백만원) — F ②CFO>0, ④발생액용

-- PostgREST 스키마 캐시 reload (신규 컬럼 인식)
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 참고: 컬럼별 커버리지 특성 (2026-08-13 샘플 28종목 실측)
--   · cfo                : 전 종목 100% (금융 포함) — F-score 핵심, 게이트 기준으로 사용
--   · cash_and_equiv     : 제조/일반 100%, 은행·보험 일부 부재('현금및예치금' 별도분류)
--   · cost_of_sales      : 제조/유통/바이오 보유, 금융·순수서비스(NAVER 등) 부재(NULL 정상)
--   · gross_profit       : GrossProfit 직접 계정 우선, 없으면 매출−매출원가 계산 폴백
--   · current_assets/liabilities : 금융업은 유동/비유동 미구분이라 부재(NULL 정상)
--   → NULL은 '결측'이 아니라 '그 업종에 그 팩터가 부적합'하다는 신호. 소비자가 업종별 처리.
-- ============================================================
