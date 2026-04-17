-- ============================================================
-- 시야 (Siya) — 테마 v2 누락 전자부품 보완
-- 작성일: 2026-04-17
-- 배경: migrate_themes_v2.sql 실행 후 analyze_top100.py 재실행 결과
--       전자부품 계열 4개가 누락된 것이 발견되어 추가
--
-- 추가 대상:
--   ① 반도체 테마: 삼성전기(009150), LG이노텍(011070), 이수페타시스(007660)
--   ② AI 테마:    이수페타시스(007660), LG전자(066570)
--   ③ 자동차/모빌리티 테마: LG전자(066570) — VS사업부(전장/인포테인먼트)
--
-- 실행 방법: Supabase SQL Editor에서 전체 복붙 후 Run
-- ============================================================


-- 반도체 테마에 전자부품 3개 추가
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('009150'),  -- 삼성전기 (MLCC·반도체 기판)
  ('011070'),  -- LG이노텍 (카메라모듈·반도체 기판)
  ('007660')   -- 이수페타시스 (AI 서버용 MLB)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '반도체'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- AI 테마에 2개 추가
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('007660'),  -- 이수페타시스 (AI 서버 수혜주)
  ('066570')   -- LG전자 (AI 가전·로봇·TV)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = 'AI'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- 자동차/모빌리티 테마에 LG전자 추가 (VS사업부 — 차량용 인포테인먼트/전장)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('066570')   -- LG전자
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '자동차/모빌리티'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ============================================================
-- 검증 쿼리 (주석 해제하여 수동 실행)
-- ============================================================

-- 반도체 테마 매핑 수 (기대: 11 → 14)
-- SELECT COUNT(*) FROM stock_themes
-- WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '반도체');

-- AI 테마 매핑 수 (기대: 7 → 9)
-- SELECT COUNT(*) FROM stock_themes
-- WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = 'AI');

-- 자동차/모빌리티 테마 매핑 수 (기대: 6 → 7)
-- SELECT COUNT(*) FROM stock_themes
-- WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '자동차/모빌리티');

-- 총 매핑 수 (기대: 191 → 197)
-- SELECT COUNT(*) FROM stock_themes;
