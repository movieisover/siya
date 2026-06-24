// DB 스키마 기반 TypeScript 타입 정의

export interface Stock {
  stock_code: string;
  stock_name: string;
  market: 'KOSPI' | 'KOSDAQ';
  sector: string | null;
  sector_code: string | null;
  is_active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface PriceDaily {
  id: number;
  stock_code: string;
  trade_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
  change_pct: number | null;
  source: string;
}

export interface Valuation {
  id: number;
  stock_code: string;
  trade_date: string;
  per: number | null;
  pbr: number | null;
  eps: number | null;
  bps: number | null;
  div_yield: number | null;
  dps: number | null;
  eps_basis: string | null;  // 'ttm' | 'annual' | null — PER 산정 기준
  source: string;
}

export interface Financials {
  id: number;
  stock_code: string;
  fiscal_year: number;
  fiscal_quarter: string;
  revenue: number | null;
  operating_income: number | null;
  net_income: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
  total_equity: number | null;
  roe: number | null;
  roa: number | null;
  debt_ratio: number | null;
  operating_margin: number | null;
  source: string;
}

export interface InvestorTrading {
  id: number;
  stock_code: string;
  trade_date: string;
  inst_net_buy: number;
  foreign_net_buy: number;
  source: string;
}

export interface Theme {
  theme_id: number;
  theme_name: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
}

export interface StockTheme {
  id: number;
  stock_code: string;
  theme_id: number;
  mapped_by: string;
}

export interface Technical {
  id: number;
  stock_code: string;
  trade_date: string;
  rsi_14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  source: string;
}

export interface User {
  id: string;
  email: string | null;
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: number;
  user_id: string;
  stock_code: string;
  memo: string | null;
  added_at: string;
}

// ── 앱에서 사용하는 계산 타입 ──

/** 종합 점수 (스크리너/테마 분석에서 계산) */
export interface StockScore {
  stock_code: string;
  quality_score: number;      // 품질 (50점 만점)
  valuation_score: number;    // 밸류에이션 (20점 만점)
  improvement_score: number;  // 개선 (30점 만점)
  total_score: number;        // 종합 (100점 만점)
}

/** 테마 신뢰도 */
export interface ThemeReliability {
  theme_id: number;
  volume_score: number;       // 거래량 (30점 만점)
  flow_score: number;         // 수급 (50점 만점)
  breadth_score: number;      // 동반상승 (20점 만점)
  total_score: number;        // 신뢰도 총점 (100점 만점)
  grade: 'HIGH' | 'MEDIUM' | 'LOW';
  direction: 'up' | 'up_possible' | 'neutral';
}

/** 타이밍 지표 */
export interface ThemeTiming {
  theme_id: number;
  avg_rsi: number;
  golden_cross_ratio: number; // MACD 골든크로스 비율 (%)
  signal: 'green' | 'yellow' | 'red';
}

/** 스크리너 필터 설정 */
export interface ScreenerFilters {
  market: 'ALL' | 'KOSPI' | 'KOSDAQ';
  perMax: number;       // PER ≤ (기본 15)
  pbrMax: number;       // PBR ≤ (기본 1.5)
  roeMin: number;       // ROE ≥ (기본 10%)
  debtMax: number;      // 부채비율 ≤ (기본 100%)
  divYieldMin: number;  // 배당수익률 ≥ (기본 0%)
}

export const DEFAULT_SCREENER_FILTERS: ScreenerFilters = {
  market: 'ALL',
  perMax: 15,
  pbrMax: 1.5,
  roeMin: 10,
  debtMax: 100,
  divYieldMin: 0,
};

/** 종목 리스트에 표시할 데이터 */
export interface StockListItem {
  stock_code: string;
  stock_name: string;
  market: string;
  close: number;
  change_pct: number;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  debt_ratio: number | null;
  div_yield: number | null;
  eps_basis: string | null;  // PER 산정 기준 (ttm/annual) — 배지 표시용
  total_score: number;
}

/** 종목 상세 화면 데이터 */
export interface StockDetail {
  stock: Stock;
  latestPrice: PriceDaily;
  latestValuation: Valuation;
  financials: Financials[];         // 최근 3년
  score: StockScore;
  sectorAvg: {
    per: number;
    pbr: number;
    roe: number;
  };
}
