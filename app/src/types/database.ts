// Supabase Database 타입 정의

// Row 타입을 먼저 정의하여 순환 참조 방지
interface StocksRow {
  stock_code: string;
  stock_name: string;
  market: string;
  sector: string | null;
  sector_code: string | null;
  is_active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

interface PriceDailyRow {
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
  created_at: string;
}

interface ValuationRow {
  id: number;
  stock_code: string;
  trade_date: string;
  per: number | null;
  pbr: number | null;
  eps: number | null;
  bps: number | null;
  div_yield: number | null;
  dps: number | null;
  source: string;
  created_at: string;
}

interface FinancialsRow {
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
  created_at: string;
}

interface InvestorTradingRow {
  id: number;
  stock_code: string;
  trade_date: string;
  inst_net_buy: number;
  foreign_net_buy: number;
  source: string;
  created_at: string;
}

interface ThemesRow {
  theme_id: number;
  theme_name: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface StockThemesRow {
  id: number;
  stock_code: string;
  theme_id: number;
  mapped_by: string;
  created_at: string;
}

interface TechnicalRow {
  id: number;
  stock_code: string;
  trade_date: string;
  rsi_14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  source: string;
  created_at: string;
}

interface UsersRow {
  id: string;
  email: string | null;
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

interface WatchlistRow {
  id: number;
  user_id: string;
  stock_code: string;
  memo: string | null;
  added_at: string;
}

export interface Database {
  public: {
    Tables: {
      stocks: {
        Row: StocksRow;
        Insert: Omit<StocksRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StocksRow, 'created_at' | 'updated_at'>>;
      };
      price_daily: {
        Row: PriceDailyRow;
        Insert: Omit<PriceDailyRow, 'id' | 'created_at'>;
        Update: Partial<Omit<PriceDailyRow, 'id' | 'created_at'>>;
      };
      valuation: {
        Row: ValuationRow;
        Insert: Omit<ValuationRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ValuationRow, 'id' | 'created_at'>>;
      };
      financials: {
        Row: FinancialsRow;
        Insert: Omit<FinancialsRow, 'id' | 'created_at'>;
        Update: Partial<Omit<FinancialsRow, 'id' | 'created_at'>>;
      };
      investor_trading: {
        Row: InvestorTradingRow;
        Insert: Omit<InvestorTradingRow, 'id' | 'created_at'>;
        Update: Partial<Omit<InvestorTradingRow, 'id' | 'created_at'>>;
      };
      themes: {
        Row: ThemesRow;
        Insert: Omit<ThemesRow, 'theme_id' | 'created_at'>;
        Update: Partial<Omit<ThemesRow, 'theme_id' | 'created_at'>>;
      };
      stock_themes: {
        Row: StockThemesRow;
        Insert: Omit<StockThemesRow, 'id' | 'created_at'>;
        Update: Partial<Omit<StockThemesRow, 'id' | 'created_at'>>;
      };
      technical: {
        Row: TechnicalRow;
        Insert: Omit<TechnicalRow, 'id' | 'created_at'>;
        Update: Partial<Omit<TechnicalRow, 'id' | 'created_at'>>;
      };
      users: {
        Row: UsersRow;
        Insert: Omit<UsersRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UsersRow, 'created_at' | 'updated_at'>>;
      };
      watchlist: {
        Row: WatchlistRow;
        Insert: Omit<WatchlistRow, 'id' | 'added_at'>;
        Update: Partial<Omit<WatchlistRow, 'id' | 'added_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
