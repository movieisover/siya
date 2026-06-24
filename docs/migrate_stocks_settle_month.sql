-- 시야 (Siya) — stocks 결산월(settle_month) 컬럼 추가
-- TTM 로드맵 ②단계: compute_ttm.py 게이트(settle_month='12')의 모수 확정용.
--   · 값 형식: 월 2자리 숫자 문자열 ('12','03','06' ...). FDR SettleMonth '12월'를
--     '월' 제거 + zfill(2)로 정규화해 저장한다. 게이트 비교값('12')과 반드시 일치.
--   · NULL = 결산월 미상(FDR 미수집) → compute_ttm는 NULL도 비(非)12월로 보고 연간 폴백.
-- 적용: Supabase SQL 에디터에서 1회 실행 (DDL 자동 경로 없음, migrate_financials_owners.sql과 동일 방식).

ALTER TABLE stocks ADD COLUMN IF NOT EXISTS settle_month text;

COMMENT ON COLUMN stocks.settle_month IS '결산월(월 2자리, 예 12/03/06). FDR KRX-DESC SettleMonth 정규화. TTM 게이트 기준.';
