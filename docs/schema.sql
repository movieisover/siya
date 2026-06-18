-- ============================================================
-- 시야 (Siya) DB 스키마 — Supabase (PostgreSQL)
-- 생성일: 2026-04-01
-- ============================================================

-- ============================================================
-- 1. stocks — 종목 마스터
-- ============================================================
CREATE TABLE stocks (
    stock_code  VARCHAR(10) PRIMARY KEY,          -- 종목코드 (예: '005930')
    stock_name  VARCHAR(100) NOT NULL,             -- 종목명 (예: '삼성전자')
    market      VARCHAR(10) NOT NULL,              -- 시장 ('KOSPI' / 'KOSDAQ')
    sector      VARCHAR(100),                      -- 업종 (예: '반도체')
    sector_code VARCHAR(20),                       -- 업종코드
    is_active   BOOLEAN DEFAULT TRUE,              -- 상장 여부
    source      VARCHAR(20) DEFAULT 'fdr',         -- 데이터 출처 ('fdr' / 'kis_api')
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. price_daily — 일별 시세 (3년 보관, 종목당 ~750행)
-- ============================================================
CREATE TABLE price_daily (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_code  VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    trade_date  DATE NOT NULL,                     -- 거래일
    open        INTEGER,                           -- 시가
    high        INTEGER,                           -- 고가
    low         INTEGER,                           -- 저가
    close       INTEGER NOT NULL,                  -- 종가
    volume      BIGINT,                            -- 거래량
    change_pct  NUMERIC(8,4),                      -- 등락률 (%)
    source      VARCHAR(20) DEFAULT 'pykrx',       -- 데이터 출처
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (stock_code, trade_date)
);

-- 인덱스: 종목+날짜 조회 최적화
CREATE INDEX idx_price_daily_code_date ON price_daily(stock_code, trade_date DESC);

-- ============================================================
-- 2-1. fx_daily — 원/달러 일별 환율 (매매기준율)
--      소스: ECOS 731Y001 / 0000001 (원/미국달러 매매기준율, 주기 D)
-- ============================================================
CREATE TABLE fx_daily (
    trade_date  DATE PRIMARY KEY,                 -- 거래일 (KRX 영업일 기준)
    rate        NUMERIC(10,2) NOT NULL            -- 원/달러 매매기준율
);

-- ============================================================
-- 3. valuation — 밸류에이션 (PER, PBR 등, 일별 저장)
-- ============================================================
CREATE TABLE valuation (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_code  VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    trade_date  DATE NOT NULL,                     -- 기준일
    per         NUMERIC(10,2),                     -- 주가수익비율
    pbr         NUMERIC(10,2),                     -- 주가순자산비율
    eps         NUMERIC(12,2),                     -- 주당순이익
    bps         NUMERIC(12,2),                     -- 주당순자산
    div_yield   NUMERIC(6,2),                      -- 배당수익률 (%)
    dps         NUMERIC(10,2),                     -- 주당배당금
    source      VARCHAR(20) DEFAULT 'pykrx',
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (stock_code, trade_date)
);

CREATE INDEX idx_valuation_code_date ON valuation(stock_code, trade_date DESC);

-- ============================================================
-- 4. financials — 재무제표 (연간, 백만원 단위)
-- ============================================================
CREATE TABLE financials (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_code      VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    fiscal_year     INTEGER NOT NULL,              -- 회계연도 (예: 2025)
    fiscal_quarter  VARCHAR(4) DEFAULT 'FY',       -- 'FY' / 'Q1' / 'Q2' / 'Q3'
    revenue         BIGINT,                        -- 매출액 (백만원)
    operating_income BIGINT,                       -- 영업이익 (백만원)
    net_income      BIGINT,                        -- 당기순이익(전체) (백만원)
    net_income_owners BIGINT,                      -- 지배주주 순이익 (백만원) — EPS/PER·ROE용
    total_assets    BIGINT,                        -- 자산총계 (백만원)
    total_liabilities BIGINT,                      -- 부채총계 (백만원)
    total_equity    BIGINT,                        -- 자본총계(전체) (백만원)
    equity_owners   BIGINT,                        -- 지배주주지분(자기자본) (백만원) — BPS/PBR·ROE용
    roe             NUMERIC(8,2),                  -- 자기자본이익률 (%)
    roa             NUMERIC(8,2),                  -- 총자산이익률 (%)
    debt_ratio      NUMERIC(8,2),                  -- 부채비율 (%)
    operating_margin NUMERIC(8,2),                 -- 영업이익률 (%)
    source          VARCHAR(20) DEFAULT 'dart',
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (stock_code, fiscal_year, fiscal_quarter)
);

CREATE INDEX idx_financials_code_year ON financials(stock_code, fiscal_year DESC);

-- ============================================================
-- 5. investor_trading — 기관/외국인 매매 (30일 보관)
-- ============================================================
CREATE TABLE investor_trading (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_code      VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    trade_date      DATE NOT NULL,
    inst_net_buy    BIGINT DEFAULT 0,              -- 기관 순매수 (원)
    foreign_net_buy BIGINT DEFAULT 0,              -- 외국인 순매수 (원)
    source          VARCHAR(20) DEFAULT 'pykrx',
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (stock_code, trade_date)
);

CREATE INDEX idx_investor_code_date ON investor_trading(stock_code, trade_date DESC);

-- ============================================================
-- 6. themes — 테마 목록 (20개)
-- ============================================================
CREATE TABLE themes (
    theme_id    SERIAL PRIMARY KEY,
    theme_name  VARCHAR(50) NOT NULL UNIQUE,        -- 테마명 (예: 'AI/반도체')
    category    VARCHAR(30),                        -- 카테고리 (예: '첨단기술')
    description TEXT,                               -- 테마 설명
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. stock_themes — 종목-테마 매핑 (다대다)
-- ============================================================
CREATE TABLE stock_themes (
    id          SERIAL PRIMARY KEY,
    stock_code  VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    theme_id    INTEGER NOT NULL REFERENCES themes(theme_id),
    mapped_by   VARCHAR(20) DEFAULT 'manual',      -- 'auto' (업종코드) / 'manual' (수동)
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (stock_code, theme_id)
);

CREATE INDEX idx_stock_themes_theme ON stock_themes(theme_id);
CREATE INDEX idx_stock_themes_stock ON stock_themes(stock_code);

-- ============================================================
-- 8. technical — 기술지표 (RSI, MACD 등, 30일 보관)
-- ============================================================
CREATE TABLE technical (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_code      VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    trade_date      DATE NOT NULL,
    rsi_14          NUMERIC(6,2),                  -- RSI 14일
    macd            NUMERIC(12,4),                 -- MACD 값
    macd_signal     NUMERIC(12,4),                 -- MACD Signal 값
    macd_histogram  NUMERIC(12,4),                 -- MACD 히스토그램
    source          VARCHAR(20) DEFAULT 'tradingview',
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (stock_code, trade_date)
);

CREATE INDEX idx_technical_code_date ON technical(stock_code, trade_date DESC);

-- ============================================================
-- 9. users — 사용자 (Supabase Auth 연동)
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       VARCHAR(255),
    nickname    VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. watchlist — 관심종목
-- ============================================================
CREATE TABLE watchlist (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_code  VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    memo        TEXT,                              -- 사용자 메모
    added_at    TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, stock_code)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- 시장 데이터 테이블: 모든 인증된 사용자 읽기 가능, 수정은 서버만
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_trading ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical ENABLE ROW LEVEL SECURITY;

-- 시장 데이터: 인증된 사용자 SELECT 허용
CREATE POLICY "시장데이터_읽기" ON stocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON price_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기_fx" ON fx_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON valuation FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON financials FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON investor_trading FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON stock_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "시장데이터_읽기" ON technical FOR SELECT TO authenticated USING (true);

-- 사용자 테이블: 본인 데이터만 접근
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인_프로필_읽기" ON users FOR SELECT TO authenticated
    USING (auth.uid() = id);
CREATE POLICY "본인_프로필_수정" ON users FOR UPDATE TO authenticated
    USING (auth.uid() = id);
CREATE POLICY "프로필_생성" ON users FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- 관심종목: 본인 데이터만 접근
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인_관심종목_읽기" ON watchlist FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "본인_관심종목_추가" ON watchlist FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인_관심종목_삭제" ON watchlist FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
CREATE POLICY "본인_관심종목_수정" ON watchlist FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================
-- 서버(service_role)용 데이터 수집 정책
-- 시장 데이터는 service_role 키로 수집 스크립트에서 INSERT/UPDATE
-- service_role은 RLS를 바이패스하므로 별도 정책 불필요
-- ============================================================

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_stocks_updated_at
    BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
