-- ============================================================
-- 시야 (Siya) — 테마 구조 v2 마이그레이션
-- 작성일: 2026-04-17
-- 전략: 증분 업데이트 (기존 theme_id/매핑 유지 + 추가만)
--
-- 변경 요약:
--   ① 카테고리 개명: '산업/방산' → '산업/인프라'
--      + 신규 카테고리 '소비재/유통' 추가
--   ② 기존 테마 개명 (theme_id 유지 → 모든 매핑 그대로 보존):
--      - 'AI/반도체' → '반도체'  (AI는 신규 테마로 분리)
--      - '희토류'     → '희토류/비철금속'
--      - '원자력'     → '원자력/전력'
--   ③ 신규 테마 7개:
--      AI, 자동차/모빌리티, 증권/보험, 화학/정유,
--      음식료/필수소비재, 유통/무역, 통신/미디어
--   ④ '반도체'(옛 AI/반도체)에서 NAVER/카카오/SK/SKT 제거
--      (AI 전담 테마로 이관)
--   ⑤ 신규/누락 매핑 약 40~50개 추가 (시총 TOP 100 분석 기반)
--
-- 실행 방법: Supabase SQL Editor에서 전체 복붙 후 Run
-- 모든 INSERT는 ON CONFLICT DO NOTHING으로 멱등성 보장
-- ============================================================


-- ─────────────────────────────────────────────────────
-- STEP 1: 카테고리 재편
-- ─────────────────────────────────────────────────────

-- 1-1. 기존 '산업/방산' → '산업/인프라'
UPDATE themes
SET category = '산업/인프라'
WHERE category = '산업/방산';


-- ─────────────────────────────────────────────────────
-- STEP 2: 기존 테마 개명 (theme_id 유지 → 매핑 보존)
-- ─────────────────────────────────────────────────────

-- 2-1. 'AI/반도체' → '반도체'
UPDATE themes
SET theme_name = '반도체',
    description = '메모리·파운드리·팹리스 + 장비·소재, 반도체 밸류체인 전반'
WHERE theme_name = 'AI/반도체';

-- 2-2. '희토류' → '희토류/비철금속'
UPDATE themes
SET theme_name = '희토류/비철금속',
    description = '희토류·비철금속(아연·구리 등) 채굴·가공, 영구자석, 특수합금 소재'
WHERE theme_name = '희토류';

-- 2-3. '원자력' → '원자력/전력'
UPDATE themes
SET theme_name = '원자력/전력',
    description = '원전·SMR·핵연료 + 전력기기·변압기·케이블, 전력 인프라 전반'
WHERE theme_name = '원자력';


-- ─────────────────────────────────────────────────────
-- STEP 3: '반도체'(옛 AI/반도체)에서 AI 성격 종목 제거
--         → 신규 'AI' 테마로 이관 예정
-- ─────────────────────────────────────────────────────

DELETE FROM stock_themes
WHERE theme_id = (SELECT theme_id FROM themes WHERE theme_name = '반도체')
  AND stock_code IN (
    '035420',  -- NAVER
    '035720',  -- 카카오
    '034730',  -- SK
    '017670'   -- SK텔레콤
  );


-- ─────────────────────────────────────────────────────
-- STEP 4: 신규 테마 7개 추가
-- ─────────────────────────────────────────────────────

INSERT INTO themes (theme_name, category, description) VALUES
-- 첨단기술
('AI', '첨단기술',
 'AI 서비스·플랫폼, 대형언어모델, AI 클라우드, AI SI/클라우드 인프라'),

-- 에너지/소재
('화학/정유', '에너지/소재',
 '석유 정제·화학, 특수가스, 정밀화학 등 전통 화학 섹터'),

-- 산업/인프라
('자동차/모빌리티', '산업/인프라',
 '완성차·부품·타이어, 전기차·자율주행, 모빌리티 SW·물류'),

-- 금융/소비
('증권/보험', '금융/소비',
 '증권·자산운용, 생명·손해보험, 종합금융지주 (은행 중심 금융/핀테크와 구분)'),

-- 소비재/유통 (신규 카테고리)
('음식료/필수소비재', '소비재/유통',
 '식품·음료·담배 등 필수소비재, K-푸드 글로벌 확장'),
('유통/무역', '소비재/유통',
 '종합상사·무역, 대형 유통, e커머스'),
('통신/미디어', '소비재/유통',
 '이동통신 3사, 미디어·콘텐츠 플랫폼 (양자암호 테마와는 별개)')

ON CONFLICT (theme_name) DO NOTHING;


-- ─────────────────────────────────────────────────────
-- STEP 5: 신규 테마 매핑
-- ─────────────────────────────────────────────────────

-- 5-1. ★ AI (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('005930'),  -- 삼성전자 (AI 반도체 + 자체 AI 투자)
  ('000660'),  -- SK하이닉스 (HBM)
  ('035420'),  -- NAVER (하이퍼클로바X)
  ('035720'),  -- 카카오 (카카오브레인)
  ('034730'),  -- SK (지주, AI 자회사 지배)
  ('017670'),  -- SK텔레콤 (에이닷)
  ('018260')   -- 삼성SDS (AI 클라우드/SI)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = 'AI'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-2. ★ 자동차/모빌리티 (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('005380'),  -- 현대차
  ('000270'),  -- 기아
  ('012330'),  -- 현대모비스
  ('086280'),  -- 현대글로비스 (자동차 물류)
  ('307950'),  -- 현대오토에버 (차량 SW)
  ('161390')   -- 한국타이어앤테크놀로지
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '자동차/모빌리티'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-3. ★ 증권/보험 (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  -- 보험
  ('032830'),  -- 삼성생명
  ('000810'),  -- 삼성화재
  ('005830'),  -- DB손해보험
  -- 증권
  ('006800'),  -- 미래에셋증권
  ('005940'),  -- NH투자증권
  ('039490'),  -- 키움증권
  ('016360'),  -- 삼성증권
  -- 금융지주 (증권 성격)
  ('138040'),  -- 메리츠금융지주
  ('071050')   -- 한국금융지주
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '증권/보험'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-4. ★ 화학/정유 (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('096770'),  -- SK이노베이션
  ('010950')   -- S-Oil
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '화학/정유'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-5. ★ 음식료/필수소비재 (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('033780'),  -- KT&G
  ('003230')   -- 삼양식품
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '음식료/필수소비재'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-6. ★ 유통/무역 (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('028260'),  -- 삼성물산
  ('047050')   -- 포스코인터내셔널
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '유통/무역'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5-7. ★ 통신/미디어 (신규)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('017670'),  -- SK텔레콤
  ('030200'),  -- KT
  ('032640')   -- LG유플러스
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '통신/미디어'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ─────────────────────────────────────────────────────
-- STEP 6: 기존 테마에 신규 종목 추가
-- ─────────────────────────────────────────────────────

-- 6-1. 로봇/자동화
-- ※ 454910은 두산로보틱스(실제) — 이미 매핑되어 있음 (이름 혼동 수정)
-- ※ 277810 레인보우로보틱스(실제)를 신규 추가
-- ※ 267270 HD건설기계 추가
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('277810'),  -- 레인보우로보틱스 (실제)
  ('267270')   -- HD건설기계
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '로봇/자동화'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-2. 바이오/제약
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('000250'),  -- 삼천당제약
  ('298380'),  -- 에이비엘바이오
  ('950160'),  -- 코오롱티슈진
  ('028300'),  -- HLB
  ('141080')   -- 리가켐바이오
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '바이오/제약'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-3. 조선/해운
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('009540'),  -- HD한국조선해양
  ('010140'),  -- 삼성중공업
  ('443060')   -- HD현대마린솔루션
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '조선/해운'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-4. 방위산업
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('079550')   -- LIG디펜스앤에어로스페이스
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '방위산업'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-5. 건설/인프라
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('028050')   -- 삼성E&A
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '건설/인프라'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-6. 화장품/K뷰티
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('278470')   -- 에이피알 (뷰티 디바이스)
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '화장품/K뷰티'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-7. 희토류/비철금속 (개명 후 추가)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('010130')   -- 고려아연
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '희토류/비철금속'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6-8. 원자력/전력 (개명 후 추가)
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES
  ('010120'),  -- LS ELECTRIC
  ('001440')   -- 대한전선
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '원자력/전력'
ON CONFLICT (stock_code, theme_id) DO NOTHING;


-- ============================================================
-- STEP 7: 검증 쿼리 (수동으로 따로 실행해서 확인)
-- ============================================================

-- 7-1. 전체 테마 개수 (기대값: 27)
-- SELECT COUNT(*) AS total_themes FROM themes;

-- 7-2. 카테고리별 테마 개수
-- SELECT category, COUNT(*) AS theme_count
-- FROM themes GROUP BY category ORDER BY category;
-- 기대값:
--   금융/소비: 5
--   바이오/헬스: 4
--   산업/인프라: 5
--   소비재/유통: 3
--   에너지/소재: 5
--   첨단기술: 5
--   → 합계 27

-- 7-3. 테마별 매핑 종목 수
-- SELECT t.category, t.theme_name, COUNT(st.stock_code) AS stock_count
-- FROM themes t
-- LEFT JOIN stock_themes st ON t.theme_id = st.theme_id
-- GROUP BY t.theme_id, t.category, t.theme_name
-- ORDER BY t.category, t.theme_name;

-- 7-4. 총 매핑 수 (기대값: 약 190~200)
-- SELECT COUNT(*) AS total_mappings FROM stock_themes;

-- 7-5. 시총 TOP 100 중 미매핑 종목 수 확인
-- → scripts/analyze_top100.py 재실행
