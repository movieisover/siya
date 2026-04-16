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

export interface Week52Range {
  high: number;
  low: number;
}

export interface CompetitorItem {
  stock_code: string;
  stock_name: string;
  roe: number | null;
  per: number | null;
  pbr: number | null;
  operating_margin: number | null;
  isSelf: boolean;
}

export interface CompetitorsData {
  items: CompetitorItem[];
  sectorAverage: {
    roe: number | null;
    per: number | null;
    pbr: number | null;
    operating_margin: number | null;
  };
}

export interface StockDetailData {
  stock: Stock;
  price: PriceDaily | null;
  valuation: Valuation | null;
  financials: Financials[];   // 최근 3년 (FY)
  technical: Technical | null;
  score: StockScore;
  sectorAvg: SectorAvg;
  week52: Week52Range | null;
  competitors: CompetitorsData | null;
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
    const [stockRes, priceRes, valRes, finRes, techRes, week52Res] = await Promise.all([
      supabase.from('stocks').select('*').eq('stock_code', code).single(),
      supabase.from('price_daily').select('*').eq('stock_code', code).order('trade_date', { ascending: false }).limit(1).single(),
      supabase.from('valuation').select('*').eq('stock_code', code).order('trade_date', { ascending: false }).limit(1).single(),
      supabase.from('financials').select('*').eq('stock_code', code).eq('fiscal_quarter', 'FY').order('fiscal_year', { ascending: false }).limit(3),
      supabase.from('technical').select('*').eq('stock_code', code).order('trade_date', { ascending: false }).limit(1).single(),
      supabase.from('price_daily').select('high, low').eq('stock_code', code).order('trade_date', { ascending: false }).limit(252),
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

    // 52주 고/저 계산 (최근 252거래일 ≈ 52주)
    const week52 = computeWeek52(week52Res.data as Array<{ high: number | null; low: number | null }> | null);

    // 2. 업종 평균 계산 (동종업계 비교용 — 항상 KRX 업종 기준)
    const sectorAvg = await fetchSectorAvg(stock.sector);

    // 2-1. 경쟁사 개별 비교 (업종 기준 점수 상위, 선택 종목 보장)
    const competitors = await fetchSectorCompetitors(stock.sector, code, sectorAvg.per);

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

    setData({ stock, price, valuation, financials, technical, score, sectorAvg, week52, competitors });
    setLoading(false);
  }

  return { data, loading };
}

function computeWeek52(
  rows: Array<{ high: number | null; low: number | null }> | null
): Week52Range | null {
  if (!rows || rows.length === 0) return null;
  const highs = rows.map((r) => r.high).filter((v): v is number => v !== null && v > 0);
  const lows = rows.map((r) => r.low).filter((v): v is number => v !== null && v > 0);
  if (highs.length === 0 || lows.length === 0) return null;
  return { high: Math.max(...highs), low: Math.min(...lows) };
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

// ── 경쟁사 개별 비교 ──

/** 업종 내 점수 상위 경쟁사 5개 (선택 종목 보장) + 업종 전체 평균 */
async function fetchSectorCompetitors(
  sector: string | null,
  currentStockCode: string,
  sectorAvgPer: number | null
): Promise<CompetitorsData | null> {
  if (!sector) return null;

  // 1. 같은 업종 종목 코드 + 이름 조회
  const { data: sectorStocks } = await supabase
    .from('stocks')
    .select('stock_code, stock_name')
    .eq('sector', sector)
    .eq('is_active', true);

  if (!sectorStocks || sectorStocks.length === 0) return null;

  const codes = sectorStocks.map((s) => s.stock_code);

  // 2. 밸류 + 재무 최신본 가져오기 (종목별 매핑)
  const [valMap, finMap] = await Promise.all([
    fetchLatestValuationByStock(codes),
    fetchLatestFinancialsByStock(codes),
  ]);

  type ItemWithScore = CompetitorItem & { _score: number };

  // 3. 각 종목 데이터 조립 + 간이 점수 계산 (품질50 + 밸류에이션 20 = 70)
  const allItems: ItemWithScore[] = sectorStocks.map((s) => {
    const val = valMap.get(s.stock_code);
    const fin = finMap.get(s.stock_code);
    const roe = fin?.roe ?? null;
    const roa = fin?.roa ?? null;
    const operating_margin = fin?.operating_margin ?? null;
    const per = val?.per ?? null;
    const pbr = val?.pbr ?? null;

    const quality =
      Math.min(Math.max(roe ?? 0, 0), 20) +
      Math.min(Math.max((roa ?? 0) * 1.5, 0), 15) +
      Math.min(Math.max(operating_margin ?? 0, 0), 15);

    const pbrScore = pbr !== null && pbr > 0 ? Math.max(10 - pbr * 5, 0) : 0;
    const perScore =
      per !== null && per > 0 && sectorAvgPer !== null && sectorAvgPer > 0
        ? Math.max(10 - (per / sectorAvgPer) * 5, 0)
        : 0;
    const valuationScore = pbrScore + perScore;

    return {
      stock_code: s.stock_code,
      stock_name: s.stock_name,
      roe,
      per,
      pbr,
      operating_margin,
      isSelf: s.stock_code === currentStockCode,
      _score: quality + valuationScore,
    };
  });

  // 4. 점수 내림차순 정렬
  allItems.sort((a, b) => b._score - a._score);

  // 5. 상위 5개 + 선택 종목 보장
  const top5 = allItems.slice(0, 5);
  const hasSelf = top5.some((it) => it.isSelf);

  let selected: ItemWithScore[];
  if (hasSelf) {
    selected = top5;
  } else {
    const self = allItems.find((it) => it.isSelf);
    selected = self ? [...top5.slice(0, 4), self] : top5;
  }

  const items: CompetitorItem[] = selected.map((it) => ({
    stock_code: it.stock_code,
    stock_name: it.stock_name,
    roe: it.roe,
    per: it.per,
    pbr: it.pbr,
    operating_margin: it.operating_margin,
    isSelf: it.isSelf,
  }));

  // 6. 업종 전체 평균 (이상치 제외)
  const validRoes = allItems.map((it) => it.roe).filter((v): v is number => v !== null && v > -100 && v < 100);
  const validPers = allItems.map((it) => it.per).filter((v): v is number => v !== null && v > 0 && v <= 100);
  const validPbrs = allItems.map((it) => it.pbr).filter((v): v is number => v !== null && v > 0 && v <= 10);
  const validOms = allItems.map((it) => it.operating_margin).filter((v): v is number => v !== null && v > -100 && v < 100);

  const mean = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const round1 = (n: number | null) => (n !== null ? Math.round(n * 10) / 10 : null);
  const round2 = (n: number | null) => (n !== null ? Math.round(n * 100) / 100 : null);

  return {
    items,
    sectorAverage: {
      roe: round1(mean(validRoes)),
      per: round1(mean(validPers)),
      pbr: round2(mean(validPbrs)),
      operating_margin: round1(mean(validOms)),
    },
  };
}

async function fetchLatestValuationByStock(
  codes: string[]
): Promise<Map<string, { per: number | null; pbr: number | null }>> {
  const map = new Map<string, { per: number | null; pbr: number | null }>();
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
        if (!map.has(row.stock_code)) {
          map.set(row.stock_code, { per: row.per, pbr: row.pbr });
        }
      }
    }
  }
  return map;
}

async function fetchLatestFinancialsByStock(
  codes: string[]
): Promise<Map<string, { roe: number | null; roa: number | null; operating_margin: number | null }>> {
  const map = new Map<string, { roe: number | null; roa: number | null; operating_margin: number | null }>();
  const batchSize = 500;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const { data } = await supabase
      .from('financials')
      .select('stock_code, roe, roa, operating_margin, fiscal_year')
      .in('stock_code', batch)
      .eq('fiscal_quarter', 'FY')
      .order('fiscal_year', { ascending: false });

    if (data) {
      for (const row of data) {
        if (!map.has(row.stock_code)) {
          map.set(row.stock_code, {
            roe: row.roe,
            roa: row.roa,
            operating_margin: row.operating_margin,
          });
        }
      }
    }
  }
  return map;
}
