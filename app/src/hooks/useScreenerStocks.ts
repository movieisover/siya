import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateStockScore } from '../lib/scoring';
import type { ScreenerFilters, StockListItem } from '../types/stock';

export function useScreenerStocks(filters: ScreenerFilters | null) {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (filters) {
      loadScreenerStocks(filters);
    } else {
      setStocks([]);
      setTotalCount(0);
    }
  }, [JSON.stringify(filters)]);

  async function loadScreenerStocks(f: ScreenerFilters) {
    setLoading(true);

    // 1. 종목 마스터 (시장 필터)
    let stockQuery = supabase
      .from('stocks')
      .select('stock_code, stock_name, market')
      .eq('is_active', true);

    if (f.market !== 'ALL') {
      stockQuery = stockQuery.eq('market', f.market);
    }

    const { data: allStocks } = await stockQuery;
    if (!allStocks || allStocks.length === 0) {
      setStocks([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const stockMap = new Map(allStocks.map((s) => [s.stock_code, s]));
    const allCodes = allStocks.map((s) => s.stock_code);

    // 2. 재무제표 (최신 FY) — 배치 처리
    const financials = await fetchAllFinancials(allCodes);

    // 3. 밸류에이션 (최신) — 배치 처리
    const valuations = await fetchAllValuations(allCodes);

    // 4. 필터 적용 (Stage 1: 자격 필터)
    const passingCodes: string[] = [];
    for (const code of allCodes) {
      const fin = financials[code];
      const val = valuations[code];

      const roe = fin?.current?.roe ?? null;
      const per = val?.per ?? null;
      const pbr = val?.pbr ?? null;
      const debtRatio = fin?.current?.debt_ratio ?? null;
      const divYield = val?.div_yield ?? null;

      // 필터 조건: null 값은 해당 필터 통과 불가
      if (roe === null || roe < f.roeMin) continue;
      if (per === null || per <= 0 || per > f.perMax) continue;
      if (pbr === null || pbr > f.pbrMax) continue;
      if (debtRatio === null || debtRatio > f.debtMax) continue;
      if (divYield !== null && divYield < f.divYieldMin) continue;
      // divYield === null이고 divYieldMin === 0이면 통과

      passingCodes.push(code);
    }

    setTotalCount(passingCodes.length);

    if (passingCodes.length === 0) {
      setStocks([]);
      setLoading(false);
      return;
    }

    // 5. 통과 종목의 최신 시세 fetch
    const prices = await fetchLatestPricesBatch(passingCodes);

    // 6. 전체 시장 평균 PER 계산 (필터 전 전체 종목 기준, 이상치 제외: 0 < PER ≤ 100)
    const validPers: number[] = [];
    for (const code of allCodes) {
      const per = valuations[code]?.per;
      if (per && per > 0 && per <= 100) {
        validPers.push(per);
      }
    }
    const marketAvgPer = validPers.length > 0
      ? validPers.reduce((a, b) => a + b, 0) / validPers.length
      : 15;

    // 7. 종합점수 계산 + StockListItem 생성
    const items: StockListItem[] = passingCodes.map((code) => {
      const stock = stockMap.get(code)!;
      const fin = financials[code];
      const val = valuations[code];
      const price = prices[code];

      const score = calculateStockScore(code, {
        roe: fin?.current?.roe ?? null,
        roa: fin?.current?.roa ?? null,
        operatingMargin: fin?.current?.operating_margin ?? null,
        pbr: val?.pbr ?? null,
        per: val?.per ?? null,
        sectorAvgPer: marketAvgPer,
        prevRoe: fin?.prev?.roe ?? null,
        prevOperatingMargin: fin?.prev?.operating_margin ?? null,
        prevPbr: null,
      });

      return {
        stock_code: code,
        stock_name: stock.stock_name,
        market: stock.market,
        close: price?.close ?? 0,
        change_pct: price?.changePct ?? 0,
        per: val?.per ?? null,
        pbr: val?.pbr ?? null,
        roe: fin?.current?.roe ?? null,
        debt_ratio: fin?.current?.debt_ratio ?? null,
        div_yield: val?.div_yield ?? null,
        eps_basis: val?.eps_basis ?? null,
        total_score: score.total_score,
      };
    });

    items.sort((a, b) => b.total_score - a.total_score);
    setStocks(items);
    setLoading(false);
  }

  return { stocks, loading, totalCount };
}

// ── 데이터 fetch 헬퍼 (전체 종목용, 배치 처리) ──

interface FinInfo {
  current: { roe: number | null; roa: number | null; operating_margin: number | null; debt_ratio: number | null };
  prev: { roe: number | null; operating_margin: number | null } | null;
}

async function fetchAllFinancials(codes: string[]): Promise<Record<string, FinInfo>> {
  const result: Record<string, FinInfo> = {};

  // 배치 처리 (Supabase IN 절 한계 대응)
  const batches = chunk(codes, 500);
  for (const batch of batches) {
    const { data } = await supabase
      .from('financials')
      .select('stock_code, fiscal_year, roe, roa, operating_margin, debt_ratio')
      .in('stock_code', batch)
      .eq('fiscal_quarter', 'FY')
      .order('fiscal_year', { ascending: false });

    if (data) {
      const byCode: Record<string, Array<typeof data[0]>> = {};
      for (const row of data) {
        if (!byCode[row.stock_code]) byCode[row.stock_code] = [];
        if (byCode[row.stock_code].length < 2) {
          byCode[row.stock_code].push(row);
        }
      }
      for (const [code, rows] of Object.entries(byCode)) {
        const curr = rows[0];
        const prev = rows[1] || null;
        result[code] = {
          current: { roe: curr.roe, roa: curr.roa, operating_margin: curr.operating_margin, debt_ratio: curr.debt_ratio },
          prev: prev ? { roe: prev.roe, operating_margin: prev.operating_margin } : null,
        };
      }
    }
  }
  return result;
}

interface ValInfo {
  per: number | null;
  pbr: number | null;
  div_yield: number | null;
  eps_basis: string | null;
}

async function fetchAllValuations(codes: string[]): Promise<Record<string, ValInfo>> {
  const result: Record<string, ValInfo> = {};

  const batches = chunk(codes, 500);
  for (const batch of batches) {
    const { data } = await supabase
      .from('valuation')
      .select('stock_code, per, pbr, div_yield, eps_basis, trade_date')
      .in('stock_code', batch)
      .order('trade_date', { ascending: false });

    if (data) {
      for (const row of data) {
        if (!result[row.stock_code]) {
          result[row.stock_code] = { per: row.per, pbr: row.pbr, div_yield: row.div_yield, eps_basis: row.eps_basis };
        }
      }
    }
  }
  return result;
}

interface PriceInfo {
  close: number;
  changePct: number;
}

async function fetchLatestPricesBatch(codes: string[]): Promise<Record<string, PriceInfo>> {
  const result: Record<string, PriceInfo> = {};

  const batches = chunk(codes, 500);
  for (const batch of batches) {
    const { data } = await supabase
      .from('price_daily')
      .select('stock_code, close, change_pct, trade_date')
      .in('stock_code', batch)
      .order('trade_date', { ascending: false });

    if (data) {
      for (const row of data) {
        if (!result[row.stock_code]) {
          result[row.stock_code] = {
            close: row.close,
            changePct: row.change_pct ?? 0,
          };
        }
      }
    }
  }
  return result;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
