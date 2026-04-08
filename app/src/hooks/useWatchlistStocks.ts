import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateStockScore } from '../lib/scoring';
import type { StockListItem } from '../types/stock';

/** 관심종목 코드 목록으로 종목 데이터 fetch */
export function useWatchlistStocks(codes: string[]) {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codes.length > 0) {
      loadStocks(codes);
    } else {
      setStocks([]);
    }
  }, [codes.join(',')]);

  async function loadStocks(stockCodes: string[]) {
    setLoading(true);

    // 병렬 fetch
    const [stockRes, priceRes, valRes, finRes] = await Promise.all([
      supabase.from('stocks').select('stock_code, stock_name, market').in('stock_code', stockCodes),
      fetchLatestPrices(stockCodes),
      fetchLatestValuations(stockCodes),
      fetchLatestFinancials(stockCodes),
    ]);

    if (!stockRes.data) {
      setStocks([]);
      setLoading(false);
      return;
    }

    const items: StockListItem[] = stockRes.data.map((s) => {
      const price = priceRes[s.stock_code];
      const val = valRes[s.stock_code];
      const fin = finRes[s.stock_code];

      const score = calculateStockScore(s.stock_code, {
        roe: fin?.roe ?? null,
        roa: fin?.roa ?? null,
        operatingMargin: fin?.operating_margin ?? null,
        pbr: val?.pbr ?? null,
        per: val?.per ?? null,
        sectorAvgPer: null,
        prevRoe: null,
        prevOperatingMargin: null,
        prevPbr: null,
      });

      return {
        stock_code: s.stock_code,
        stock_name: s.stock_name,
        market: s.market,
        close: price?.close ?? 0,
        change_pct: price?.changePct ?? 0,
        per: val?.per ?? null,
        pbr: val?.pbr ?? null,
        roe: fin?.roe ?? null,
        debt_ratio: fin?.debt_ratio ?? null,
        div_yield: val?.div_yield ?? null,
        total_score: score.total_score,
      };
    });

    items.sort((a, b) => b.total_score - a.total_score);
    setStocks(items);
    setLoading(false);
  }

  return { stocks, loading };
}

// ── 헬퍼 함수 ──

async function fetchLatestPrices(codes: string[]) {
  const result: Record<string, { close: number; changePct: number }> = {};
  const { data } = await supabase
    .from('price_daily')
    .select('stock_code, close, change_pct, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false });

  if (data) {
    for (const row of data) {
      if (!result[row.stock_code]) {
        result[row.stock_code] = { close: row.close, changePct: row.change_pct ?? 0 };
      }
    }
  }
  return result;
}

async function fetchLatestValuations(codes: string[]) {
  const result: Record<string, { per: number | null; pbr: number | null; div_yield: number | null }> = {};
  const { data } = await supabase
    .from('valuation')
    .select('stock_code, per, pbr, div_yield, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false });

  if (data) {
    for (const row of data) {
      if (!result[row.stock_code]) {
        result[row.stock_code] = { per: row.per, pbr: row.pbr, div_yield: row.div_yield };
      }
    }
  }
  return result;
}

async function fetchLatestFinancials(codes: string[]) {
  const result: Record<string, { roe: number | null; roa: number | null; operating_margin: number | null; debt_ratio: number | null }> = {};
  const { data } = await supabase
    .from('financials')
    .select('stock_code, roe, roa, operating_margin, debt_ratio, fiscal_year')
    .in('stock_code', codes)
    .eq('fiscal_quarter', 'FY')
    .order('fiscal_year', { ascending: false });

  if (data) {
    for (const row of data) {
      if (!result[row.stock_code]) {
        result[row.stock_code] = { roe: row.roe, roa: row.roa, operating_margin: row.operating_margin, debt_ratio: row.debt_ratio };
      }
    }
  }
  return result;
}
