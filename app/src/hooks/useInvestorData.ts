// 기관/외국인 수급 데이터 fetch 훅
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface InvestorDayData {
  trade_date: string;
  inst_net_buy: number;   // 기관 순매수 (백만원)
  foreign_net_buy: number; // 외국인 순매수 (백만원)
  close: number | null;
  change_pct: number | null;
}

export interface InvestorSummary {
  inst_5d: number;
  inst_20d: number;
  foreign_5d: number;
  foreign_20d: number;
  inst_streak: number;   // 연속 매수일 (음수=매도)
  foreign_streak: number;
}

export interface InvestorData {
  daily: InvestorDayData[];
  summary: InvestorSummary;
}

function calcStreak(values: number[]): number {
  if (values.length === 0) return 0;
  const first = values[0];
  if (first === 0) return 0;
  const sign = first > 0 ? 1 : -1;
  let count = 0;
  for (const v of values) {
    if ((sign > 0 && v > 0) || (sign < 0 && v < 0)) {
      count++;
    } else break;
  }
  return count * sign;
}

export function useInvestorData(stockCode: string | null) {
  const [data, setData] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stockCode) { setData(null); return; }

    let cancelled = false;
    setLoading(true);

    async function fetch() {
      // investor_trading + price_daily 조인 대신 각각 조회
      const [invRes, priceRes] = await Promise.all([
        supabase
          .from('investor_trading')
          .select('trade_date, inst_net_buy, foreign_net_buy')
          .eq('stock_code', stockCode)
          .order('trade_date', { ascending: false })
          .limit(60),
        supabase
          .from('price_daily')
          .select('trade_date, close, change_pct')
          .eq('stock_code', stockCode)
          .order('trade_date', { ascending: false })
          .limit(60),
      ]);

      if (cancelled) return;

      const invData = invRes.data || [];
      const priceMap = new Map(
        (priceRes.data || []).map((p) => [p.trade_date, p])
      );

      // 합치기 (최신순)
      const daily: InvestorDayData[] = invData.map((d) => {
        const price = priceMap.get(d.trade_date);
        return {
          trade_date: d.trade_date,
          inst_net_buy: d.inst_net_buy || 0,
          foreign_net_buy: d.foreign_net_buy || 0,
          close: price?.close ?? null,
          change_pct: price?.change_pct ?? null,
        };
      });

      // 요약 계산
      const inst5 = daily.slice(0, 5).reduce((s, d) => s + d.inst_net_buy, 0);
      const inst20 = daily.slice(0, 20).reduce((s, d) => s + d.inst_net_buy, 0);
      const frgn5 = daily.slice(0, 5).reduce((s, d) => s + d.foreign_net_buy, 0);
      const frgn20 = daily.slice(0, 20).reduce((s, d) => s + d.foreign_net_buy, 0);

      const instStreak = calcStreak(daily.map((d) => d.inst_net_buy));
      const frgnStreak = calcStreak(daily.map((d) => d.foreign_net_buy));

      setData({
        daily,
        summary: {
          inst_5d: inst5,
          inst_20d: inst20,
          foreign_5d: frgn5,
          foreign_20d: frgn20,
          inst_streak: instStreak,
          foreign_streak: frgnStreak,
        },
      });
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [stockCode]);

  return { data, loading };
}
