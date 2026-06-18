-- ============================================================
-- migrate_financials_owners.sql — 지배주주 기준 컬럼 추가
-- ============================================================
-- 목적: EPS/PER·BPS/PBR·ROE를 지배주주(소유주지분) 기준으로 계산하기 위해
--       financials에 지배주주 순이익 / 지배주주지분 컬럼 추가.
--       (네이버·증권사·FnGuide 표준과 정합)
-- 적용: Supabase SQL 에디터에 붙여넣어 실행
-- 작성: 시야 (2026-06-18)
-- ============================================================

ALTER TABLE financials ADD COLUMN IF NOT EXISTS net_income_owners BIGINT;  -- 지배주주 순이익 (백만원)
ALTER TABLE financials ADD COLUMN IF NOT EXISTS equity_owners     BIGINT;  -- 지배주주지분(자기자본) (백만원)

-- PostgREST 스키마 캐시 reload (신규 컬럼 인식)
NOTIFY pgrst, 'reload schema';
