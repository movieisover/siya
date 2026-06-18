// 환율 민감도 fetch + 계산 훅
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  dailyReturns,
  alignByDate,
  applyFxReportingLag,
  windowSensitivity,
  type DatedValue,
  type FxSensitivity,
} from '../lib/fxStats';

export interface FxSensitivityData {
  window60: FxSensitivity | null;
  window120: FxSensitivity | null;
}

// 120일 창 + 수익률 계산 여유를 위해 최근 ~180거래일 확보
const PRICE_LIMIT = 180;

export function useFxSensitivity(stockCode: string | null) {
  const [data, setData] = useState<FxSensitivityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stockCode) { setData(null); return; }

    let cancelled = false;
    setLoading(true);

    async function fetchData() {
      // 1. 종목 종가 최근 180거래일 (내림차순으로 가져와 오름차순으로 뒤집음)
      const { data: priceRows } = await supabase
        .from('price_daily')
        .select('trade_date, close')
        .eq('stock_code', stockCode!)
        .order('trade_date', { ascending: false })
        .limit(PRICE_LIMIT);

      if (cancelled) return;

      const priceAsc = (priceRows || [])
        .filter((r) => r.close && r.close > 0)
        .map((r) => ({ date: r.trade_date, value: r.close as number }))
        .reverse(); // 오름차순

      if (priceAsc.length < 2) {
        if (!cancelled) { setData({ window60: null, window120: null }); setLoading(false); }
        return;
      }

      // 2. 같은 기간 원/달러 환율 (단일 시계열, 종목필터 없음 / 732행이라 페이지네이션 불필요)
      const startDate = priceAsc[0].date;
      const { data: fxRows } = await supabase
        .from('fx_daily')
        .select('trade_date, rate')
        .gte('trade_date', startDate)
        .order('trade_date', { ascending: true });

      if (cancelled) return;

      const fxAsc: DatedValue[] = (fxRows || [])
        .filter((r) => r.rate && r.rate > 0)
        .map((r) => ({ date: r.trade_date, value: r.rate as number }));

      // 3. 수익률/변동률 → ECOS 1일 시차 보정 → 날짜 정렬 → 60/120일 민감도
      const stockRet = dailyReturns(priceAsc);
      const fxRet = applyFxReportingLag(dailyReturns(fxAsc)); // rate[T]=T-1 시장 반영분 보정
      const aligned = alignByDate(stockRet, fxRet);

      if (!cancelled) {
        setData({
          window60: windowSensitivity(aligned, 60),
          window120: windowSensitivity(aligned, 120),
        });
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [stockCode]);

  return { data, loading };
}
