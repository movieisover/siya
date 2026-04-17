-- ============================================================
-- 시야 (Siya) — 테마 v2 마이그레이션 롤백
-- 용도: migrate_themes_v2.sql 실행 후 문제 발생 시 복구용
-- 주의: 롤백 전에 현재 상태를 백업해두길 권장
-- ============================================================

-- ─────────────────────────────────────────────────────
-- STEP 1: 신규 테마 7개 삭제 (매핑도 CASCADE)
-- ─────────────────────────────────────────────────────

-- 신규 테마의 매핑 먼저 삭제 (stock_themes에 FK 있음)
DELETE FROM stock_themes
WHERE theme_id IN (
  SELECT theme_id FROM themes
  WHERE theme_name IN (
    'AI',
    '자동차/모빌리티',
    '증권/보험',
    '화학/정유',
    '음식료/필수소비재',
    '유통/무역',
    '통신/미디어'
  )
);

-- 신규 테마 삭제
DELETE FROM themes
WHERE theme_name IN (
  'AI',
  '자동차/모빌리티',
  '증권/보험',
  '화학/정유',
  '음식료/필수소비재',
  '유통/무역',
  '통신/미디어'
);


-- ─────────────────────────────────────────────────────
-- STEP 2: 기존 테마 복원 (개명 되돌리기)
-- ─────────────────────────────────────────────────────

UPDATE themes
SET theme_name = 'AI/반도체',
    description = 'AI 인프라, GPU, 메모리 반도체, 파운드리, 팹리스 등'
WHERE theme_name = '반도체';

UPDATE themes
SET theme_name = '희토류',
    description = '희토류 채굴, 가공, 영구자석, 핵심 소재'
WHERE theme_name = '희토류/비철금속';

UPDATE themes
SET theme_name = '원자력',
    description = '원전 건설, SMR, 원전 해체, 핵연료'
WHERE theme_name = '원자력/전력';


-- ─────────────────────────────────────────────────────
-- STEP 3: 반도체(옛 AI/반도체)에서 삭제됐던 매핑 복원
-- ─────────────────────────────────────────────────────

INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('035420'),  -- NAVER
  ('035720'),  -- 카카오
  ('034730'),  -- SK
  ('017670')   -- SK텔레콤
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = 'AI/반도체'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ─────────────────────────────────────────────────────
-- STEP 4: 기존 테마에 추가했던 새 매핑 삭제
-- (희토류/비철금속, 원자력/전력에 추가한 종목들은
--  이미 STEP 1 & 2에서 처리됨)
-- ─────────────────────────────────────────────────────

-- 로봇/자동화에 추가한 종목들 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '로봇/자동화')
  AND stock_code IN ('277810', '267270');

-- 바이오/제약 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '바이오/제약')
  AND stock_code IN ('000250', '298380', '950160', '028300', '141080');

-- 조선/해운 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '조선/해운')
  AND stock_code IN ('009540', '010140', '443060');

-- 방위산업 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '방위산업')
  AND stock_code IN ('079550');

-- 건설/인프라 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '건설/인프라')
  AND stock_code IN ('028050');

-- 화장품/K뷰티 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '화장품/K뷰티')
  AND stock_code IN ('278470');

-- 희토류(원상복구) 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '희토류')
  AND stock_code IN ('010130');

-- 원자력(원상복구) 추가 종목 제거
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '원자력')
  AND stock_code IN ('010120', '001440');


-- ─────────────────────────────────────────────────────
-- STEP 5: 카테고리 원상복구
-- ─────────────────────────────────────────────────────

UPDATE themes
SET category = '산업/방산'
WHERE category = '산업/인프라';

-- 검증: 카테고리별 테마 수 (원래대로 5개 카테고리 × 4개)
-- SELECT category, COUNT(*) FROM themes GROUP BY category;
