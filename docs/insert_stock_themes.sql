-- ============================================================
-- 시야 (Siya) — 테마별 핵심 종목 매핑 (MVP)
-- theme_name으로 theme_id를 조회하고, stocks에 있는 종목만 매핑
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1. AI/반도체
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('005930'),('000660'),('042700'),('403870'),('036930'),
  ('460850'),('357780'),('058470'),('240810'),('039030'),
  ('035420'),('035720'),('034730'),('017670'),('036540')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = 'AI/반도체'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 2. 로봇/자동화
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('267260'),('454910'),('272110'),('012450'),('298040'),
  ('241560'),('042660'),('064350')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '로봇/자동화'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 3. 우주항공
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('012450'),('047810'),('272210'),('064350'),('006260'),
  ('082740'),('103590')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '우주항공'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 4. 양자컴퓨팅
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('005930'),('000660'),('017670'),('030200'),('032640'),
  ('035420'),('357780'),('036930')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '양자컴퓨팅'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 5. 2차전지
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('373220'),('006400'),('051910'),('086520'),('247540'),
  ('003670'),('066970'),('005490'),('006110')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '2차전지'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 6. 신재생에너지
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('322000'),('298040'),('034020'),('009830'),('336260'),
  ('015760'),('006260')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '신재생에너지'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 7. 수소경제
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('336260'),('298040'),('009830'),('034020'),('117580')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '수소경제'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 8. 희토류
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('005490'),('003670'),('004020'),('001230'),('103590'),
  ('104700')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '희토류'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 9. 바이오/제약
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('207940'),('068270'),('128940'),('302440'),('326030'),
  ('196170'),('145020'),('195940'),('000100'),('185750'),
  ('006280'),('003060')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '바이오/제약'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 10. 의료기기
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('043150'),('041830'),('253840'),('290650'),('046210')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '의료기기'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 11. 디지털헬스
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('035420'),('035720'),('041830'),('263750')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '디지털헬스'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 12. 고령화/실버
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('128940'),('185750'),('006280'),('145020'),('000100'),
  ('041830'),('290650')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '고령화/실버'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 13. 방위산업
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('012450'),('047810'),('272210'),('064350'),('042660'),
  ('000880'),('003570'),('329180')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '방위산업'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 14. 조선/해운
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('329180'),('042660'),('010620'),('082740'),('011200'),
  ('028670'),('267250')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '조선/해운'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 15. 건설/인프라
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('000720'),('047040'),('006360'),('000210'),('012630'),
  ('004980')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '건설/인프라'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 16. 원자력
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('034020'),('015760'),('298040'),('006260'),('267260')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '원자력'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 17. 금융/핀테크
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('105560'),('055550'),('086790'),('316140'),('024110'),
  ('377300'),('323410'),('138930'),('175330')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '금융/핀테크'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 18. 게임/엔터
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('259960'),('036570'),('251270'),('263750'),('112040'),
  ('041510'),('352820'),('122870'),('293490')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '게임/엔터'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 19. 리츠/부동산
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('395400'),('330590'),('432320'),('365550'),('334890'),
  ('357120')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '리츠/부동산'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- 20. 화장품/K뷰티
INSERT INTO stock_themes (stock_code, theme_id, mapped_by)
SELECT s.stock_code, t.theme_id, 'manual'
FROM (VALUES 
  ('090430'),('002790'),('051900'),('192820'),('044820'),
  ('950170')
) AS v(stock_code)
JOIN stocks s ON s.stock_code = v.stock_code
CROSS JOIN themes t WHERE t.theme_name = '화장품/K뷰티'
ON CONFLICT (stock_code, theme_id) DO NOTHING;

-- ============================================================
-- 결과 확인
-- ============================================================
SELECT t.theme_name, t.category, COUNT(st.stock_code) AS 종목수
FROM themes t
LEFT JOIN stock_themes st ON t.theme_id = st.theme_id
GROUP BY t.theme_id, t.theme_name, t.category
ORDER BY t.category, t.theme_name;
