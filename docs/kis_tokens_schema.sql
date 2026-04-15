-- 시야 (Siya) — KIS API 토큰 공유 테이블
-- Python(daily_update.py)과 Edge Function(kis-price)이 토큰을 공유하기 위한 테이블
-- KIS API는 1일 1회 토큰 발급 원칙이므로, 양쪽에서 중복 발급 시 403 에러 발생

CREATE TABLE IF NOT EXISTS kis_tokens (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- 항상 1행만 유지
    access_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE kis_tokens ENABLE ROW LEVEL SECURITY;

-- authenticated 사용자 읽기 허용 (service_role은 RLS 우회)
CREATE POLICY "토큰_읽기" ON kis_tokens
    FOR SELECT TO authenticated USING (true);
