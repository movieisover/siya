-- 시야 (Siya) — kis_tokens 테이블에 app_key/app_secret 컬럼 추가
-- 이유: KIS_APP_SECRET에 / = 등 특수문자가 포함되어
--       Supabase Edge Function secrets에서 깨지는 문제 발생.
--       DB에 원본 키를 저장해서 Edge Function이 안전하게 읽도록 함.

ALTER TABLE kis_tokens ADD COLUMN IF NOT EXISTS app_key TEXT;
ALTER TABLE kis_tokens ADD COLUMN IF NOT EXISTS app_secret TEXT;
