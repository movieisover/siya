import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RealtimePrice {
  price: number;
  changePct: number;
  changePrice: number;
  volume: number;
  timestamp: string;
}

function isMarketOpen(): boolean {
  const now = new Date();
  // UTC+9 한국시간
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay(); // 0=일, 6=토
  if (day === 0 || day === 6) return false;
  const hhmm = kst.getUTCHours() * 100 + kst.getUTCMinutes();
  return hhmm >= 900 && hhmm <= 1530;
}

export function useRealtimePrice(stockCode: string | null) {
  const [data, setData] = useState<RealtimePrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!stockCode) {
      setData(null);
      setIsLive(false);
      return;
    }

    if (!isMarketOpen()) {
      setData(null);
      setIsLive(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchPrice() {
      try {
        const { data: resp, error } = await supabase.functions.invoke('kis-price', {
          body: { stock_code: stockCode },
        });

        if (cancelled) return;

        if (error || !resp || resp.error) {
          setData(null);
          setIsLive(false);
          return;
        }

        setData({
          price: resp.price,
          changePct: resp.change_pct,
          changePrice: resp.change_price,
          volume: resp.volume,
          timestamp: resp.timestamp,
        });
        setIsLive(true);
      } catch {
        setData(null);
        setIsLive(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPrice();
    return () => { cancelled = true; };
  }, [stockCode]);

  return { data, loading, isLive };
}
