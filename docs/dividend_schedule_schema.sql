-- ============================================================
-- 시야 (Siya) — 배당 일정 (dividend_schedule) 테이블
-- KIS API /uapi/domestic-stock/v1/ksdinfo/dividend 응답 기반
-- ============================================================

CREATE TABLE IF NOT EXISTS dividend_schedule (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,               -- 종목코드 (6자리)
  record_date DATE NOT NULL,              -- 배당기준일 (API: record_date YYYYMMDD)
  payment_date DATE,                      -- 배당지급일 (API: divi_pay_dt YYYY/MM/DD, 미확정 시 NULL)
  dividend_per_share NUMERIC,             -- 주당배당금 원 (API: per_sto_divi_amt, 미확정 시 0)
  dividend_type TEXT,                     -- 배당종류: 결산/분기/중간/특별 등 (API: divi_kind)
  stock_kind TEXT DEFAULT '보통',          -- 주식종류: 보통/우선 (API: stk_kind)
  source TEXT DEFAULT 'kis_api',
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stock_code, record_date, dividend_type)
);

-- 인덱스
CREATE INDEX idx_ds_stock ON dividend_schedule(stock_code);
CREATE INDEX idx_ds_record_date ON dividend_schedule(record_date DESC);
CREATE INDEX idx_ds_payment_date ON dividend_schedule(payment_date DESC);

-- RLS: 모든 인증 사용자 read-only (다른 테이블과 동일 패턴)
ALTER TABLE dividend_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON dividend_schedule FOR SELECT USING (true);
