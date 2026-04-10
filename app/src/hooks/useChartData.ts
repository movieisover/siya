import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ChartCandle {
  time: string;       // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartPeriod = '1M' | '3M' | '6M' | '1Y' | '3Y';

function getStartDate(period: ChartPeriod): string {
  const d = new Date();
  switch (period) {
    case '1M': d.setMonth(d.getMonth() - 1); break;
    case '3M': d.setMonth(d.getMonth() - 3); break;
    case '6M': d.setMonth(d.getMonth() - 6); break;
    case '1Y': d.setFullYear(d.getFullYear() - 1); break;
    case '3Y': d.setFullYear(d.getFullYear() - 3); break;
  }
  return d.toISOString().slice(0, 10);
}

export function useChartData(stockCode: string | null, period: ChartPeriod) {
  const [data, setData] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stockCode) { setData([]); return; }

    let cancelled = false;
    setLoading(true);

    const startDate = getStartDate(period);

    async function fetch() {
      const all: ChartCandle[] = [];
      let offset = 0;
      const pageSize = 1000;

      while (true) {
        const { data: rows } = await supabase
          .from('price_daily')
          .select('trade_date, open, high, low, close, volume')
          .eq('stock_code', stockCode!)
          .gte('trade_date', startDate)
          .order('trade_date', { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (!rows || cancelled) break;

        for (const r of rows) {
          if (r.open && r.high && r.low && r.close) {
            all.push({
              time: r.trade_date,
              open: r.open,
              high: r.high,
              low: r.low,
              close: r.close,
              volume: r.volume ?? 0,
            });
          }
        }

        if (rows.length < pageSize) break;
        offset += pageSize;
      }

      if (!cancelled) {
        setData(all);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [stockCode, period]);

  return { data, loading };
}
