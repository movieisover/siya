import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  calculateThemeReliability,
  calculateThemeTiming,
  calculateStockScore,
} from '../lib/scoring';
import type {
  ThemeReliability,
  ThemeTiming,
  StockListItem,
} from '../types/stock';

// ── 테마별 신뢰도 + 타이밍 데이터 ──

export interface ThemeAnalysis {
  reliability: ThemeReliability;
  timing: ThemeTiming;
}

/** 모든 테마의 신뢰도/타이밍을 한번에 계산 */
export function useThemeAnalysis(themeIds: number[]) {
  const [analyses, setAnalyses] = useState<Record<number, ThemeAnalysis>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (themeIds.length === 0) return;
    loadAllThemeAnalyses(themeIds);
  }, [themeIds.join(',')]);

  async function loadAllThemeAnalyses(ids: number[]) {
    setLoading(true);
    const result: Record<number, ThemeAnalysis> = {};

    // 각 테마에 매핑된 종목코드 조회
    const { data: allMappings } = await supabase
      .from('stock_themes')
      .select('theme_id, stock_code')
      .in('theme_id', ids);

    if (!allMappings || allMappings.length === 0) {
      setAnalyses({});
      setLoading(false);
      return;
    }

    // 테마별 종목코드 그룹핑
    const themeStocks: Record<number, string[]> = {};
    for (const m of allMappings) {
      if (!themeStocks[m.theme_id]) themeStocks[m.theme_id] = [];
      themeStocks[m.theme_id].push(m.stock_code);
    }

    const allCodes = [...new Set(allMappings.map((m) => m.stock_code))];

    // 병렬로 데이터 fetch
    const [priceResult, techResult, investorResult] = await Promise.all([
      fetchLatestPrices(allCodes),
      fetchLatestTechnical(allCodes),
      fetchInvestorTrading(allCodes),
    ]);

    // 20일 평균 거래량 fetch (별도)
    const avgVolumes = await fetchAvgVolumes(allCodes);

    for (const themeId of ids) {
      const codes = themeStocks[themeId] || [];
      if (codes.length === 0) {
        result[themeId] = {
          reliability: calculateThemeReliability(themeId, 0, 0, 0),
          timing: calculateThemeTiming(themeId, 50, 50),
        };
        continue;
      }

      // 거래량 증가율 계산 (테마 평균)
      let volumeIncreases: number[] = [];
      for (const code of codes) {
        const latest = priceResult[code];
        const avg = avgVolumes[code];
        if (latest && avg && avg > 0) {
          volumeIncreases.push(((latest.volume - avg) / avg) * 100);
        }
      }
      const avgVolumeIncrease = volumeIncreases.length > 0
        ? volumeIncreases.reduce((a, b) => a + b, 0) / volumeIncreases.length
        : 0;

      // 수급 점수: 5일 누적 순매수 합계 (억원)
      let totalNetBuy = 0;
      for (const code of codes) {
        const trading = investorResult[code];
        if (trading) {
          totalNetBuy += trading.totalNetBuy;
        }
      }
      const netBuyBillion = totalNetBuy / 100_000_000; // 원 → 억원

      // 동반상승 비율
      let risingCount = 0;
      for (const code of codes) {
        const p = priceResult[code];
        if (p && p.changePct > 0) risingCount++;
      }
      const risingPercent = codes.length > 0 ? (risingCount / codes.length) * 100 : 0;

      const reliability = calculateThemeReliability(themeId, avgVolumeIncrease, netBuyBillion, risingPercent);

      // 타이밍: RSI 평균, MACD 골든크로스 비율
      let rsiValues: number[] = [];
      let goldenCrossCount = 0;
      let techCount = 0;
      for (const code of codes) {
        const tech = techResult[code];
        if (tech) {
          if (tech.rsi !== null) rsiValues.push(tech.rsi);
          if (tech.macd !== null && tech.macdSignal !== null) {
            techCount++;
            if (tech.macd > tech.macdSignal) goldenCrossCount++;
          }
        }
      }
      const avgRsi = rsiValues.length > 0
        ? rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length
        : 50;
      const gcRatio = techCount > 0 ? (goldenCrossCount / techCount) * 100 : 50;

      const timing = calculateThemeTiming(themeId, avgRsi, gcRatio);

      result[themeId] = { reliability, timing };
    }

    setAnalyses(result);
    setLoading(false);
  }

  return { analyses, loading };
}

// ── 테마 종목 리스트 (재무지표 포함) ──

export function useThemeStocks(themeId: number | null) {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (themeId) {
      loadThemeStocks(themeId);
    } else {
      setStocks([]);
    }
  }, [themeId]);

  async function loadThemeStocks(id: number) {
    setLoading(true);

    // 1. 테마에 속한 종목코드
    const { data: mappings } = await supabase
      .from('stock_themes')
      .select('stock_code')
      .eq('theme_id', id);

    if (!mappings || mappings.length === 0) {
      setStocks([]);
      setLoading(false);
      return;
    }

    const codes = mappings.map((m) => m.stock_code);

    // 2. 병렬 fetch: 종목정보 + 최신 시세 + 최신 밸류에이션 + 최신 재무
    const [stockRes, prices, valuations, financialsMap] = await Promise.all([
      supabase.from('stocks').select('stock_code, stock_name, market').in('stock_code', codes),
      fetchLatestPrices(codes),
      fetchLatestValuations(codes),
      fetchLatestFinancials(codes),
    ]);

    if (!stockRes.data) {
      setStocks([]);
      setLoading(false);
      return;
    }

    // 테마 내 평균 PER 계산 (이상치 제외: 0 < PER ≤ 100)
    const validThemePers = Object.values(valuations)
      .filter((v) => v?.per && v.per > 0 && v.per <= 100)
      .map((v) => v!.per!);
    const themeAvgPer = validThemePers.length > 0
      ? validThemePers.reduce((a, b) => a + b, 0) / validThemePers.length
      : null;

    const items: StockListItem[] = stockRes.data.map((s) => {
      const price = prices[s.stock_code];
      const val = valuations[s.stock_code];
      const fin = financialsMap[s.stock_code];

      // 종합점수 계산
      const score = calculateStockScore(s.stock_code, {
        roe: fin?.current?.roe ?? null,
        roa: fin?.current?.roa ?? null,
        operatingMargin: fin?.current?.operating_margin ?? null,
        pbr: val?.pbr ?? null,
        per: val?.per ?? null,
        sectorAvgPer: themeAvgPer, // 테마 내 평균 PER
        prevRoe: fin?.prev?.roe ?? null,
        prevOperatingMargin: fin?.prev?.operating_margin ?? null,
        prevPbr: null, // 전년 PBR은 추후
      });

      return {
        stock_code: s.stock_code,
        stock_name: s.stock_name,
        market: s.market,
        close: price?.close ?? 0,
        change_pct: price?.changePct ?? 0,
        per: val?.per ?? null,
        pbr: val?.pbr ?? null,
        roe: fin?.current?.roe ?? null,
        debt_ratio: null,
        div_yield: null,
        total_score: score.total_score,
      };
    });

    // 종합점수 내림차순 정렬
    items.sort((a, b) => b.total_score - a.total_score);
    setStocks(items);
    setLoading(false);
  }

  return { stocks, loading };
}

// ── 데이터 fetch 헬퍼 함수 ──

interface PriceInfo {
  close: number;
  volume: number;
  changePct: number;
}

async function fetchLatestPrices(codes: string[]): Promise<Record<string, PriceInfo>> {
  const result: Record<string, PriceInfo> = {};
  // 최신 1일치 시세 - stock_code별 최신 레코드
  const { data } = await supabase
    .from('price_daily')
    .select('stock_code, close, volume, change_pct, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false });

  if (data) {
    for (const row of data) {
      if (!result[row.stock_code]) {
        result[row.stock_code] = {
          close: row.close,
          volume: row.volume ?? 0,
          changePct: row.change_pct ?? 0,
        };
      }
    }
  }
  return result;
}

async function fetchAvgVolumes(codes: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  // 최근 20일 거래량 평균을 계산하기 위해 최근 20일 데이터 fetch
  const { data } = await supabase
    .from('price_daily')
    .select('stock_code, volume, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false })
    .limit(codes.length * 25); // 종목당 ~25일분

  if (data) {
    const volumesByCode: Record<string, number[]> = {};
    for (const row of data) {
      if (!volumesByCode[row.stock_code]) volumesByCode[row.stock_code] = [];
      if (volumesByCode[row.stock_code].length < 20) {
        volumesByCode[row.stock_code].push(row.volume ?? 0);
      }
    }
    for (const [code, volumes] of Object.entries(volumesByCode)) {
      // 최신 1일은 제외하고 나머지로 평균 (최신일 대비 비교용)
      if (volumes.length > 1) {
        const past = volumes.slice(1);
        result[code] = past.reduce((a, b) => a + b, 0) / past.length;
      }
    }
  }
  return result;
}

interface TechInfo {
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
}

async function fetchLatestTechnical(codes: string[]): Promise<Record<string, TechInfo>> {
  const result: Record<string, TechInfo> = {};
  const { data } = await supabase
    .from('technical')
    .select('stock_code, rsi_14, macd, macd_signal, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false });

  if (data) {
    for (const row of data) {
      if (!result[row.stock_code]) {
        result[row.stock_code] = {
          rsi: row.rsi_14,
          macd: row.macd,
          macdSignal: row.macd_signal,
        };
      }
    }
  }
  return result;
}

interface InvestorInfo {
  totalNetBuy: number; // 5일 누적 (기관+외국인) 원 단위
}

async function fetchInvestorTrading(codes: string[]): Promise<Record<string, InvestorInfo>> {
  const result: Record<string, InvestorInfo> = {};
  // 최근 5일 수급 데이터
  const { data } = await supabase
    .from('investor_trading')
    .select('stock_code, inst_net_buy, foreign_net_buy, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false })
    .limit(codes.length * 5);

  if (data) {
    const byCode: Record<string, number> = {};
    const countByCode: Record<string, number> = {};
    for (const row of data) {
      if (!countByCode[row.stock_code]) countByCode[row.stock_code] = 0;
      if (countByCode[row.stock_code] >= 5) continue;
      countByCode[row.stock_code]++;
      byCode[row.stock_code] = (byCode[row.stock_code] ?? 0) + row.inst_net_buy + row.foreign_net_buy;
    }
    for (const [code, total] of Object.entries(byCode)) {
      result[code] = { totalNetBuy: total };
    }
  }
  return result;
}

interface ValInfo {
  per: number | null;
  pbr: number | null;
}

async function fetchLatestValuations(codes: string[]): Promise<Record<string, ValInfo>> {
  const result: Record<string, ValInfo> = {};
  const { data } = await supabase
    .from('valuation')
    .select('stock_code, per, pbr, trade_date')
    .in('stock_code', codes)
    .order('trade_date', { ascending: false });

  if (data) {
    for (const row of data) {
      if (!result[row.stock_code]) {
        result[row.stock_code] = { per: row.per, pbr: row.pbr };
      }
    }
  }
  return result;
}

interface FinInfo {
  current: { roe: number | null; roa: number | null; operating_margin: number | null };
  prev: { roe: number | null; operating_margin: number | null } | null;
}

async function fetchLatestFinancials(codes: string[]): Promise<Record<string, FinInfo>> {
  const result: Record<string, FinInfo> = {};
  const { data } = await supabase
    .from('financials')
    .select('stock_code, fiscal_year, roe, roa, operating_margin')
    .in('stock_code', codes)
    .eq('fiscal_quarter', 'FY')
    .order('fiscal_year', { ascending: false });

  if (data) {
    const byCode: Record<string, Array<{ fiscal_year: number; roe: number | null; roa: number | null; operating_margin: number | null }>> = {};
    for (const row of data) {
      if (!byCode[row.stock_code]) byCode[row.stock_code] = [];
      if (byCode[row.stock_code].length < 2) {
        byCode[row.stock_code].push(row);
      }
    }
    for (const [code, rows] of Object.entries(byCode)) {
      const current = rows[0];
      const prev = rows[1] || null;
      result[code] = {
        current: { roe: current.roe, roa: current.roa, operating_margin: current.operating_margin },
        prev: prev ? { roe: prev.roe, operating_margin: prev.operating_margin } : null,
      };
    }
  }
  return result;
}
