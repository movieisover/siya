-- ============================================================
-- 시야 테마 개인화 스키마
-- Date: 2026-05-19
--
-- 기존 themes/stock_themes = 시스템 기본 템플릿 (유지)
-- user_themes/user_stock_themes = 사용자별 개인화 복사본
-- ============================================================

-- 1. 사용자별 테마 테이블
CREATE TABLE IF NOT EXISTS user_themes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, theme_name)
);

-- 2. 사용자별 테마-종목 매핑 테이블
CREATE TABLE IF NOT EXISTS user_stock_themes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_theme_id INT NOT NULL REFERENCES user_themes(id) ON DELETE CASCADE,
  stock_code VARCHAR(20) NOT NULL REFERENCES stocks(stock_code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_theme_id, stock_code)
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stock_themes_user_id ON user_stock_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stock_themes_theme_id ON user_stock_themes(user_theme_id);

-- 4. RLS 정책
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stock_themes ENABLE ROW LEVEL SECURITY;

-- user_themes: 자기 데이터만 CRUD
CREATE POLICY "user_themes_select" ON user_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_themes_insert" ON user_themes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_themes_update" ON user_themes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_themes_delete" ON user_themes FOR DELETE USING (auth.uid() = user_id);

-- user_stock_themes: 자기 데이터만 CRUD
CREATE POLICY "user_stock_themes_select" ON user_stock_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stock_themes_insert" ON user_stock_themes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_stock_themes_update" ON user_stock_themes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_stock_themes_delete" ON user_stock_themes FOR DELETE USING (auth.uid() = user_id);

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_user_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_themes_updated_at
  BEFORE UPDATE ON user_themes
  FOR EACH ROW EXECUTE FUNCTION update_user_themes_updated_at();
