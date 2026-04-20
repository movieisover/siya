-- ============================================================
-- 시야 (Siya) — 테마 v2 패치 2: HD현대 화학/정유 추가
-- 작성일: 2026-04-20
-- 배경: HD현대(267250)는 "현대중공업지주"에서 사명 변경된 지주사로,
--       실질적으로는 HD현대오일뱅크(정유)가 핵심 사업 중 하나.
--       기존 조선/해운 매핑은 유지하고 화학/정유에 중복 매핑 추가.
--
-- 추가 대상:
--   ① 화학/정유 테마: HD현대(267250)
--
-- 실행 방법: Supabase SQL Editor에서 전체 복붙 후 Run
-- ============================================================


-- 화학/정유 테마에 HD현대 추가
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('267250')   -- HD현대 (HD현대오일뱅크 지배, 정유 지주)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '화학/정유'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ============================================================
-- 검증 쿼리 (주석 해제하여 수동 실행)
-- ============================================================

-- 화학/정유 테마 매핑 수 (기대: 2 → 3)
-- SELECT s.stock_code, s.stock_name
-- FROM stock_themes st
-- JOIN themes t ON st.theme_id = t.theme_id
-- JOIN stocks s ON st.stock_code = s.stock_code
-- WHERE t.theme_name = '화학/정유'
-- ORDER BY s.stock_code;

-- 총 매핑 수 (기대: 197 → 198)
-- SELECT COUNT(*) FROM stock_themes;
