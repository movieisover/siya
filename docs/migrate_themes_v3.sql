-- ============================================================
-- Siya Theme Structure v3 Migration (최종)
-- Date: 2026-05-19
-- Strategy: Incremental (existing data preserved, additions only)
--
-- Summary:
--   A) Theme splits (3): 화학/정유→정유+석유화학, 조선/해운→조선+해운, 원자력/전력→전력기기+원자력
--   B) New themes (4): 석유화학, 해운, 원자력, 지주사
--   C) 69 new stock-theme mappings (기존테마 41 + 신규테마 24 + 우선주 4)
--   D) Category 전면 제거 (전체 NULL)
--   E) 우선주 보통주 테마 편입 (삼성전자우, 현대차2우B)
--   F) 미매핑 TOP 100: 0개 (전원 해소)
--
-- Result: 27 -> 31 themes, 198 -> 267 mappings, 카테고리 없음
-- Execute in: Supabase SQL Editor
-- ============================================================


-- ==========================================================
-- STEP 1: Theme structural changes (splits & renames)
-- ==========================================================

-- 1-1. '화학/정유' -> '정유' (keep theme_id, all existing mappings preserved)
UPDATE themes
SET theme_name = '정유',
    description = '석유 정제, 연료 생산/유통, 정유 밸류체인'
WHERE theme_name = '화학/정유';

-- 1-2. '조선/해운' -> '조선' (keep theme_id)
UPDATE themes
SET theme_name = '조선',
    description = '선박 건조, LNG선, 해양플랜트, 조선 기자재'
WHERE theme_name = '조선/해운';

-- 1-3. '원자력/전력' -> '전력기기' (keep theme_id, most stocks stay here)
--      원자력은 신규 테마로 분리, 두산에너빌리티만 이관
UPDATE themes
SET theme_name = '전력기기',
    description = '변압기, 차단기, 케이블, 전력 인프라, 스마트그리드'
WHERE theme_name = '원자력/전력';


-- ==========================================================
-- STEP 2: New themes (3)
-- ==========================================================

INSERT INTO themes (theme_name, category, description) VALUES
('석유화학', '에너지/소재',
 '올레핀, 폴리머, 합성고무, 합성수지, 화학 원료 생산'),
('해운', '산업/인프라',
 '컨테이너/벌크/LNG/LPG 해운, 원자재/화학제품 운송'),
('원자력', '에너지/소재',
 '원전 건설, SMR, 핵연료, 원전 기자재, 원전 유지보수'),
('지주사', NULL,
 '투자지주회사, 순수지주회사, 자회사 포트폴리오')
ON CONFLICT (theme_name) DO NOTHING;


-- ==========================================================
-- STEP 3: Move stocks between split themes
-- ==========================================================

-- 3-1. Move HMM and 팬오션 from '조선' to '해운'
-- First add to 해운
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('011200'),  -- HMM
  ('028670')   -- 팬오션
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '해운'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- Then remove from 조선
DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '조선')
  AND stock_code IN ('011200', '028670');

-- 3-2. Move 두산에너빌리티 from '전력기기' to '원자력'
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('034020')   -- 두산에너빌리티
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '원자력'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '전력기기')
  AND stock_code = '034020';


-- ==========================================================
-- STEP 4: New mappings - existing themes
-- ==========================================================

-- 4-1. 반도체 +2
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('000990'),  -- DB하이텍 (파운드리)
  ('108320')   -- LX세미콘 (팹리스)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '반도체'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-2. 우주항공 +3
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('099320'),  -- 쎄트렉아이 (소형위성)
  ('079550'),  -- LIG디펜스앤에어로스페이스 (미사일/항공전자) - 방위산업과 중복OK
  ('003490')   -- 대한항공 (MRO/군용기) - 기존 미매핑 종목 해소
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '우주항공'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-3. 2차전지 +6
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('005070'),  -- 코스모신소재 (양극재)
  ('078600'),  -- 대주전자재료 (실리콘 음극재)
  ('096770'),  -- SK이노베이션 (배터리 셀, SK온) - 정유와 중복OK
  ('020150'),  -- 롯데에너지머티리얼즈 (동박)
  ('011790'),  -- SKC (동박/소재)
  ('014680')   -- 한솔케미칼 (전해액/소재)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '2차전지'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-4. 신재생에너지 +5
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('010060'),  -- OCI홀딩스 (폴리실리콘)
  ('096770'),  -- SK이노베이션 (ESS/에너지전환) - 2차전지/정유와 중복OK
  ('267260'),  -- HD현대일렉트릭 (변압기/전력망) - 로봇/자동화와 중복OK
  ('010120'),  -- LS Electric (스마트그리드/ESS) - 전력기기와 중복OK
  ('112610')   -- 씨에스윈드 (풍력 글로벌 대표)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '신재생에너지'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-5. 바이오/제약 +2
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('039200'),  -- 오스코텍 (합성신약, 알츠하이머)
  ('226950')   -- 올릭스 (RNAi 플랫폼)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '바이오/제약'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-6. 방위산업 +1
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('103140')   -- 풍산 (탄약, NATO 수혜)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '방위산업'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-7. 로봇/자동화 +3 (휴머노이드/물류자동화)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('319400'),  -- 현대무벡스 (물류자동화, 창고자동화)
  ('108490'),  -- 로보티즈 (서비스로봇, 액츄에이터)
  ('348340')   -- 뉴로메카 (협동로봇)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '로봇/자동화'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-8. 양자컴퓨팅 +3 (광케이블/보안 인프라 포함)
-- NOTE: 효성ITX(094280)는 양자보안 직접 연계가 약할 수 있음 (팀원 근거 확인 권장)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('001440'),  -- 대한전선 (양자통신 인프라, 광통신)
  ('010120'),  -- LS Electric (양자보안 인프라, 스마트그리드)
  ('094280')   -- 효성ITX (양자보안 연계) - 연결 근거 약할 수 있음
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '양자컴퓨팅'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-9. 수소경제 +2 (수소인프라/수소모빌리티 범위 확대)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('005490'),  -- POSCO홀딩스 (수소환원제철, 그린수소) - 2차전지와 중복OK
  ('005380')   -- 현대차 (수소차, 연료전지) - 자동차/모빌리티와 중복OK
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '수소경제'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-10. 희토류/비철금속 +5 (니켈 범위 포함)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('006260'),  -- LS (구리/전선/전력인프라) - 신재생/우주항공과 중복OK
  ('103140'),  -- 풍산 (구리/동합금) - 방위산업과 중복OK
  ('000670'),  -- 영풍 (아연/제련, 비철금속)
  ('001440'),  -- 대한전선 (구리/전선, 초고압 케이블) - 전력기기와 중복OK
  ('002710')   -- TCC스틸 (니켈/소재, 2차전지 소재)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '희토류/비철금속'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-11. 자동차/모빌리티 +1
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('011210')   -- 현대위아 (4WD, 엔진, 섀시)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '자동차/모빌리티'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4-12. 화장품/K뷰티 +4
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('483650'),  -- 달바글로벌 (K뷰티 수출)
  ('257720'),  -- 실리콘투 (화장품 유통 플랫폼)
  ('214450'),  -- 파마리서치 (리쥬란 스킨부스터)
  ('352480')   -- 씨앤씨인터내셔널 (색조 ODM)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '화장품/K뷰티'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ==========================================================
-- STEP 5: New mappings - new themes
-- ==========================================================

-- 5-1. 석유화학 (new theme)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('006650'),  -- 대한유화 (PE, 에틸렌, 올레핀)
  ('051910'),  -- LG화학 (석유화학, 배터리 소재) - 2차전지와 중복OK
  ('011780'),  -- 금호석유화학 (합성고무, 합성수지)
  ('011170')   -- 롯데케미칼 (올레핀, 폴리머)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '석유화학'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-2. 해운 (new theme) - HMM/팬오션은 STEP 3에서 이동됨 + 3종목 추가
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('005880'),  -- 대한해운 (벌크, LNG, 원자재)
  ('044450'),  -- KSS해운 (LPG, 화학제품 운송)
  ('003280')   -- 흥아해운 (동남아 단거리 특화)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '해운'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-3. 원자력 (new theme) - 두산에너빌리티는 STEP 3에서 이동됨 + 12종목 추가
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('096350'),  -- 대창솔루션 (밸브, 기자재)
  ('006910'),  -- 보성파워텍 (전력, 소재)
  ('086670'),  -- 비엠티 (밸브, 기자재)
  ('083650'),  -- 비에이치아이 (기자재, 원전수주)
  ('036640'),  -- HRS (전력, 소재)
  ('032820'),  -- 우리기술 (전력, 소재)
  ('094820'),  -- 일진파워 (전력, 소재)
  ('051600'),  -- 한전KPS (원전 유지보수)
  ('130660'),  -- 한전산업 (원전 유지보수, 운영)
  ('105840'),  -- 우진 (밸브, 기자재, 원전수주)
  ('019990'),  -- 에너토크 (밸브, 기자재, 원전수주)
  ('052690')   -- 한전기술 (원전 대장주, 원전수출 수혜)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '원자력'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-4. 전력기기 +2 (기존 원자력/전력에서 rename된 테마)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('062040'),  -- 산일전기 (PAD형 변압기, ESS, 북미수출)
  ('036460')   -- 한국가스공사 (LNG 공급, 수소 인프라)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '전력기기'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ==========================================================
-- STEP 6: 추가 매핑 — 기존 테마 보완
-- ==========================================================

-- 6-1. 통신/미디어 +2 (콘텐츠/광고)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('035760'),  -- CJ ENM (콘텐츠, 미디어)
  ('030000')   -- 제일기획 (광고)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '통신/미디어'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ==========================================================
-- STEP 7: 신규 매핑 — 지주사 테마 (5종목)
-- ==========================================================

INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('402340'),  -- SK스퀘어 (투자지주회사)
  ('000150'),  -- 두산 (지주사)
  ('003550'),  -- LG (지주사)
  ('012630'),  -- 삼성에피스 (투자지주회사)
  ('180640')   -- 한진칼 (지주회사)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '지주사'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ==========================================================
-- STEP 8: 우선주 보통주 테마 편입
-- ==========================================================

-- 8-1. 삼성전자우 (005935) → AI, 반도체 (보통주 삼성전자와 동일)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT '005935', t.theme_id, 'manual'
FROM themes t
WHERE t.theme_name IN ('AI', '반도체')
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 8-2. 현대차 2우B (005387) → 자동차/모빌리티, 수소경제 (보통주 현대차와 동일)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT '005387', t.theme_id, 'manual'
FROM themes t
WHERE t.theme_name IN ('자동차/모빌리티', '수소경제')
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ==========================================================
-- STEP 9: 카테고리 전면 제거
-- ==========================================================

UPDATE themes SET category = NULL;


-- ==========================================================
-- STEP 10: Verification queries (run manually after migration)
-- ==========================================================

-- 10-1. Total themes (expected: 31)
-- SELECT COUNT(*) AS total_themes FROM themes;

-- 10-2. 카테고리 제거 확인 (expected: 전체 NULL)
-- SELECT DISTINCT category FROM themes;

-- 10-3. 테마별 종목 수
-- SELECT t.theme_name, COUNT(st.stock_code) AS stock_count
-- FROM themes t
-- LEFT JOIN stock_themes st ON t.theme_id = st.theme_id
-- GROUP BY t.theme_id, t.theme_name
-- ORDER BY t.theme_name;

-- 10-4. Total mappings (expected: 267)
-- SELECT COUNT(*) AS total_mappings FROM stock_themes;

-- 10-5. 지주사 테마 확인 (expected: 5)
-- SELECT s.stock_name FROM stock_themes st
-- JOIN stocks s ON st.stock_code = s.stock_code
-- WHERE st.theme_id = (SELECT theme_id FROM themes WHERE theme_name = '지주사');

-- 10-6. 우선주 편입 확인
-- SELECT s.stock_name, t.theme_name FROM stock_themes st
-- JOIN stocks s ON st.stock_code = s.stock_code
-- JOIN themes t ON st.theme_id = t.theme_id
-- WHERE s.stock_code IN ('005935', '005387')
-- ORDER BY s.stock_name, t.theme_name;

-- 10-7. 미매핑 TOP 100 확인 (expected: 0)
-- WITH top100 AS (
--   SELECT stock_code FROM stocks
--   WHERE market IN ('KOSPI','KOSDAQ')
--   ORDER BY market_cap DESC NULLS LAST LIMIT 100
-- )
-- SELECT t.stock_code, s.stock_name
-- FROM top100 t
-- JOIN stocks s ON t.stock_code = s.stock_code
-- LEFT JOIN stock_themes st ON t.stock_code = st.stock_code
-- WHERE st.stock_code IS NULL;
