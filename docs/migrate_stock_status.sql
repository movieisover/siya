-- ============================================================
-- migrate_stock_status.sql — 종목 상태(관리종목·거래정지 등) 일별 스냅샷 테이블
-- ============================================================
-- 목적: 시야트레이더 배제 게이트 B-2 ①단계.
--       KIS 주식현재가(FHKST01010100) 응답의 상태 플래그를 매일 스냅샷으로 적재.
--       (핸드오프: docs/핸드오프_배제게이트_B2.md / 답변: docs/회신_배제게이트_B2_답변.md)
--
-- 원칙 (답변서 §6):
--   · 시야는 **배제 여부를 판정하지 않는다.** KIS 원값을 그대로 싣는다.
--     판정 규칙은 소비자(시야트레이더)에서 바뀔 수 있고, 그때 시야를 건드리지 않기 위함.
--     (B-1 "시야는 원자료만 채운다"와 같은 원칙)
--   · 상태 코드는 문자열로 풀지 않고 KIS 원값 그대로('51'/'53'/'58'/'Y'/'N'/'02' ...).
--   · 덮어쓰기가 아니라 **날짜별 스냅샷 이력**으로 쌓는다 — 상태 변화가 사라지지 않게.
--     (과거 상태는 어느 소스로도 소급 복원 불가 → 오늘부터 쌓는 것 자체가 산출물)
--
-- 적용: Supabase SQL 에디터에 붙여넣어 실행
-- 작성: 시야 (2026-08-27)
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_status (
    stock_code          VARCHAR(10) NOT NULL REFERENCES stocks(stock_code),
    snapshot_date       DATE NOT NULL,            -- 관측일 (KST 기준 수집일)

    -- ── KIS 원값 (해석 금지, 그대로 저장) ──────────────────
    iscd_stat_cls_code  VARCHAR(4),   -- 종목상태구분: 00그외 51관리 52투자위험 53투자경고
                                      --              54투자주의 55신용가능 57증거금100% 58거래정지 59단기과열
    mang_issu_cls_code  VARCHAR(4),   -- 관리종목 여부 Y/N
    mrkt_warn_cls_code  VARCHAR(4),   -- 시장경고구분: 00없음 01주의 02경고 03위험
    sltr_yn             VARCHAR(4),   -- 정리매매 여부 Y/N
    short_over_yn       VARCHAR(4),   -- 단기과열 여부 Y/N

    source              VARCHAR(20) DEFAULT 'kis_api',
    observed_at         TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (stock_code, snapshot_date)
);

-- 조회 패턴: ①"오늘 상태 전종목" ②"이 종목의 상태 변화 이력"
CREATE INDEX IF NOT EXISTS idx_stock_status_date ON stock_status (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_status_code_date ON stock_status (stock_code, snapshot_date DESC);

-- 플래그가 선 종목만 빠르게 뽑는 부분 인덱스 (전종목의 ~2%)
CREATE INDEX IF NOT EXISTS idx_stock_status_flagged ON stock_status (snapshot_date DESC, stock_code)
    WHERE mang_issu_cls_code = 'Y'
       OR sltr_yn = 'Y'
       OR iscd_stat_cls_code IN ('51', '52', '53', '58')
       OR mrkt_warn_cls_code IN ('01', '02', '03');

-- ------------------------------------------------------------
-- RLS — price_daily / fx_daily와 동일 정책 (공용 읽기전용 SELECT)
--   · 인증된 사용자: SELECT 허용
--   · service_role: RLS 자동 우회 → 수집기는 별도 정책 불필요
-- ------------------------------------------------------------
ALTER TABLE stock_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "시장데이터_읽기_stock_status" ON stock_status
    FOR SELECT TO authenticated USING (true);

-- PostgREST 스키마 캐시 reload (신규 테이블 인식)
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 소비자 참고 — 시야트레이더가 쓰는 두 종류의 게이트 (답변서 §1)
--   · 체결 게이트("살 수 있는가") : iscd_stat_cls_code='58'(거래정지), sltr_yn='Y'(정리매매)
--   · 팩터 배제 게이트("부실한가") : mang_issu_cls_code='Y'(관리종목)
--   · 배제 아님, 값만 소비      : mrkt_warn_cls_code(투자경고 — 실행 레이어 포지션 산정용)
--
-- ⚠️ 거래정지는 관리종목의 부분집합이 아니다.
--    2026-08-27 실측(684종목): 거래정지 5 중 3(진흥기업·대유에이텍·한국첨단소재)이 관리종목 아님.
--
-- 최신 스냅샷 조회 예:
--   SELECT DISTINCT ON (stock_code) *
--     FROM stock_status ORDER BY stock_code, snapshot_date DESC;
-- ============================================================
