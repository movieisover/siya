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

export interface RealtimePriceData {
  price: number;
  volume: number;
}

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

/** 이평선 계산을 위해 6개월(120거래일) 버퍼 추가 */
function getBufferedStartDate(period: ChartPeriod): string {
  const d = new Date();
  switch (period) {
    case '1M': d.setMonth(d.getMonth() - 1); break;
    case '3M': d.setMonth(d.getMonth() - 3); break;
    case '6M': d.setMonth(d.getMonth() - 6); break;
    case '1Y': d.setFullYear(d.getFullYear() - 1); break;
    case '3Y': d.setFullYear(d.getFullYear() - 3); break;
  }
  d.setDate(d.getDate() - 180);
  return d.toISOString().slice(0, 10);
}

function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function useChartData(stockCode: string | null, period: ChartPeriod, realtimePrice?: RealtimePriceData | null) {
  const [data, setData] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState(false);
  const visibleStartDate = getStartDate(period);

  useEffect(() => {
    if (!stockCode) { setData([]); return; }

    let cancelled = false;
    setLoading(true);

    const startDate = getBufferedStartDate(period);

    async function fetchData() {
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

    fetchData();
    return () => { cancelled = true; };
  }, [stockCode, period]);

  // 실시간가 반영: 마지막 봉 업데이트
  const finalData = applyRealtimePrice(data, realtimePrice);

  return { data: finalData, loading, visibleStartDate };
}

function applyRealtimePrice(data: ChartCandle[], realtimePrice?: RealtimePriceData | null): ChartCandle[] {
  if (!realtimePrice || data.length === 0) return data;

  const today = getTodayKST();
  const last = data[data.length - 1];

  if (last.time === today) {
    // 오늘 봉이 있으면 close/high/low/volume 업데이트
    const updated = [...data];
    updated[updated.length - 1] = {
      ...last,
      close: realtimePrice.price,
      high: Math.max(last.high, realtimePrice.price),
      low: Math.min(last.low, realtimePrice.price),
      volume: realtimePrice.volume,
    };
    return updated;
  } else {
    // 오늘 봉이 없으면 추가
    return [...data, {
      time: today,
      open: realtimePrice.price,
      high: realtimePrice.price,
      low: realtimePrice.price,
      close: realtimePrice.price,
      volume: realtimePrice.volume,
    }];
  }
}
