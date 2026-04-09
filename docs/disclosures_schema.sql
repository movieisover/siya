-- ============================================================
-- 11. disclosures — 공시 목록 (DART API)
-- 추가일: 2026-04-09
-- ============================================================
CREATE TABLE disclosures (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rcept_no        VARCHAR(20) NOT NULL UNIQUE,       -- DART 접수번호 (고유키)
    corp_code       VARCHAR(10),                       -- DART 기업코드
    stock_code      VARCHAR(10),                       -- 종목코드 (stocks FK, nullable)
    corp_name       VARCHAR(100) NOT NULL,             -- 기업명
    report_name     TEXT NOT NULL,                      -- 공시 제목
    rcept_date      DATE NOT NULL,                     -- 접수일
    report_type     VARCHAR(10),                       -- 보고서 유형 코드
    flr_name        VARCHAR(100),                      -- 공시 제출인
    dart_url        TEXT,                              -- DART 원문 링크
    collected_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 날짜별 조회 최적화
CREATE INDEX idx_disclosures_date ON disclosures(rcept_date DESC);
-- 인덱스: 기업명 검색
CREATE INDEX idx_disclosures_corp ON disclosures(corp_name);
-- 인덱스: 종목코드 조회
CREATE INDEX idx_disclosures_stock ON disclosures(stock_code);

-- RLS
ALTER TABLE disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "공시_읽기" ON disclosures FOR SELECT TO authenticated USING (true);
