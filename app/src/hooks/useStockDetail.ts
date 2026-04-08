import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateStockScore } from '../lib/scoring';
import type { Stock, PriceDaily, Valuation, Financials, StockScore, Technical } from '../types/stock';

type AppMode = 'theme' | 'screener' | 'watchlist';

export interface SectorAvg {
  per: number | null;
  pbr: number | null;
  roe: number | null;
}

export interface StockDetailData {
  stock: Stock;
  price: PriceDaily | null;
  valuation: Valuation | null;
  financials: Financials[];   // 최근 3년 (FY)
  technical: Technical | null;
  score: StockScore;
  sectorAvg: SectorAvg;
}

export function useStockDetail(stockCode: string | null, mode?: AppMode, themeId?: number | null) {
  const [data, setData] = useState<StockDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stockCode) {
      loadDetail(stockCode, mode, themeId ?? null);
    } else {
      setData(null);
    }
  }, [stockCode, mode, themeId]);

  async function loadDetail(code: string, currentMode?: AppMode, currentThemeId?: number | null) {
    setLoading(true);

    // 1. 기본 데이터 병렬 fetch
    const [stockRes, priceRes, valRes, finRes, techRes] = await Promise.all([
      supabase.from('stocks').select('*').eq('stock_code', code).single(),
      supabase.from('price_daily').select('*').eq('stock_code', code).order('trade_date', { ascending: false }).limit(1).single(),
      supabase.from('valuation').select('*').eq('stock_code', code).order('trade_date', { ascending: false }).limit(1).single(),
      supabase.from('financials').select('*').eq('stock_code', code).eq('fiscal_quarter', 'FY').order('fiscal_year', { ascending: false }).limit(3),
      supabase.from('technical').select('*').eq('stock_code', code).order('trade_date', { ascending: false }).limit(1).single(),
    ]);

    if (!stockRes.data) {
      setData(null);
      setLoading(false);
      return;
    }

    const stock = stockRes.data as Stock;
    const price = (priceRes.data as PriceDaily) ?? null;
    const valuation = (valRes.data as Valuation) ?? null;
    const financials = (finRes.data as Financials[]) ?? [];
    const technical = (techRes.data as Technical) ?? null;
    const latestFin = financials[0] ?? null;
    const prevFin = financials[1] ?? null;

    // 2. 업종 평균 계산 (동종업계 비교용 — 항상 KRX 업종 기준)
    const sectorAvg = await fetchSectorAvg(stock.sector);

    // 3. 모드별 평균 PER 계산 (종합점수용)
    let scoreAvgPer: number | null = sectorAvg.per;
    if (currentMode === 'theme' && currentThemeId) {
      scoreAvgPer = await fetchThemeAvgPer(currentThemeId);
    } else if (currentMode === 'screener') {
      scoreAvgPer = await fetchMarketAvgPer();
    }

    // 4. 종합점수 계산
    const score = calculateStockScore(code, {
      roe: latestFin?.roe ?? null,
      roa: latestFin?.roa ?? null,
      operatingMargin: latestFin?.operating_margin ?? null,
      pbr: valuation?.pbr ?? null,
      per: valuation?.per ?? null,
      sectorAvgPer: scoreAvgPer,
      prevRoe: prevFin?.roe ?? null,
      prevOperatingMargin: prevFin?.operating_margin ?? null,
      prevPbr: null,
    });

    setData({ stock, price, valuation, financials, technical, score, sectorAvg });
    setLoading(false);
  }

  return { data, loading };
}

async function fetchSectorAvg(sector: string | null): Promise<SectorAvg> {
  const defaultAvg: SectorAvg = { per: null, pbr: null, roe: null };
  if (!sector) return defaultAvg;

  // 같은 업종 종목 코드 조회
  const { data: sectorStocks } = await supabase
    .from('stocks')
    .select('stock_code')
    .eq('sector', sector)
    .eq('is_active', true);

  if (!sectorStocks || sectorStocks.length === 0) return defaultAvg;

  const codes = sectorStocks.map((s) => s.stock_code);

  // 병렬: 밸류에이션 + 재무
  const [valData, finData] = await Promise.all([
    fetchSectorValuations(codes),
    fetchSectorFinancials(codes),
  ]);

  // PER 평균 (이상치 제외: 0 < PER ≤ 100)
  const validPers = valData.filter((v) => v.per && v.per > 0 && v.per <= 100).map((v) => v.per!);
  const avgPer = validPers.length > 0 ? validPers.reduce((a, b) => a + b, 0) / validPers.length : null;

  // PBR 평균 (0 < PBR ≤ 10)
  const validPbrs = valData.filter((v) => v.pbr && v.pbr > 0 && v.pbr <= 10).map((v) => v.pbr!);
  const avgPbr = validPbrs.length > 0 ? validPbrs.reduce((a, b) => a + b, 0) / validPbrs.length : null;

  // ROE 평균 (-100 < ROE < 100)
  const validRoes = finData.filter((f) => f.roe !== null && f.roe > -100 && f.roe < 100).map((f) => f.roe!);
  const avgRoe = validRoes.length > 0 ? validRoes.reduce((a, b) => a + b, 0) / validRoes.length : null;

  return {
    per: avgPer ? Math.round(avgPer * 10) / 10 : null,
    pbr: avgPbr ? Math.round(avgPbr * 100) / 100 : null,
    roe: avgRoe ? Math.round(avgRoe * 10) / 10 : null,
  };
}

async function fetchSectorValuations(codes: string[]): Promise<Array<{ per: number | null; pbr: number | null }>> {
  const result: Array<{ per: number | null; pbr: number | null }> = [];
  const seen = new Set<string>();

  // 배치 처리
  const batchSize = 500;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const { data } = await supabase
      .from('valuation')
      .select('stock_code, per, pbr, trade_date')
      .in('stock_code', batch)
      .order('trade_date', { ascending: false });

    if (data) {
      for (const row of data) {
        if (!seen.has(row.stock_code)) {
          seen.add(row.stock_code);
          result.push({ per: row.per, pbr: row.pbr });
        }
      }
    }
  }
  return result;
}

// ── 모드별 평균 PER 계산 ──

/** 테마 내 평균 PER */
async function fetchThemeAvgPer(themeId: number): Promise<number | null> {
  const { data: mappings } = await supabase
    .from('stock_themes')
    .select('stock_code')
    .eq('theme_id', themeId);

  if (!mappings || mappings.length === 0) return null;

  const codes = mappings.map((m) => m.stock_code);
  const vals = await fetchSectorValuations(codes);
  const validPers = vals.filter((v) => v.per && v.per > 0 && v.per <= 100).map((v) => v.per!);

  if (validPers.length === 0) return null;
  return Math.round((validPers.reduce((a, b) => a + b, 0) / validPers.length) * 10) / 10;
}

/** 전체 시장 평균 PER (종목별 최신 1건만, 이상치 제외) */
async function fetchMarketAvgPer(): Promise<number | null> {
  const { data } = await supabase
    .from('valuation')
    .select('stock_code, per, trade_date')
    .gt('per', 0)
    .lte('per', 100)
    .order('trade_date', { ascending: false });

  if (!data || data.length === 0) return null;

  // 종목별 최신 1건만
  const seen = new Set<string>();
  const validPers: number[] = [];
  for (const row of data) {
    if (!seen.has(row.stock_code)) {
      seen.add(row.stock_code);
      validPers.push(row.per);
    }
  }

  if (validPers.length === 0) return null;
  return Math.round((validPers.reduce((a, b) => a + b, 0) / validPers.length) * 10) / 10;
}

async function fetchSectorFinancials(codes: string[]): Promise<Array<{ roe: number | null }>> {
  const result: Array<{ roe: number | null }> = [];
  const seen = new Set<string>();

  const batchSize = 500;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const { data } = await supabase
      .from('financials')
      .select('stock_code, roe, fiscal_year')
      .in('stock_code', batch)
      .eq('fiscal_quarter', 'FY')
      .order('fiscal_year', { ascending: false });

    if (data) {
      for (const row of data) {
        if (!seen.has(row.stock_code)) {
          seen.add(row.stock_code);
          result.push({ roe: row.roe });
        }
      }
    }
  }
  return result;
}
