-- ============================================================
-- migrate_fx_daily.sql — 원/달러 환율 일별 테이블 생성
-- ============================================================
-- 소스: ECOS(한국은행) 통계표 731Y001 / 항목 0000001
--       (원/미국달러 매매기준율, 주기 D)
-- 적용: Supabase SQL 에디터에 붙여넣어 실행
-- 작성: 시야 (2026-06-17)
-- ============================================================

-- fx_daily — 원/달러 일별 환율 (매매기준율)
CREATE TABLE IF NOT EXISTS fx_daily (
    trade_date  DATE PRIMARY KEY,                 -- 거래일 (KRX 영업일 기준)
    rate        NUMERIC(10,2) NOT NULL            -- 원/달러 매매기준율
);

-- ------------------------------------------------------------
-- RLS — price_daily와 동일 정책 (공용 읽기전용 SELECT)
--   · 인증된 사용자: SELECT 허용
--   · service_role: RLS 자동 우회 → 전체 권한 (별도 정책 불필요)
-- ------------------------------------------------------------
ALTER TABLE fx_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "시장데이터_읽기_fx" ON fx_daily FOR SELECT TO authenticated USING (true);
