// 테마 신뢰도, 타이밍, 종합점수 계산 함수
import type { ThemeReliability, ThemeTiming, StockScore } from '../types/stock';

// ── 테마 신뢰도 계산 ──

/** 거래량 점수 (30점 만점): 20일 평균 대비 증가율 */
export function calcVolumeScore(increasePercent: number): number {
  if (increasePercent < 50) return 0;
  return Math.min(Math.round((increasePercent - 50) / 5), 30);
}

/** 수급 점수 (50점 만점): 5일 누적 순매수 (억원) */
export function calcFlowScore(netBuyBillion: number): number {
  if (netBuyBillion <= 0) return 0;
  return Math.min(Math.round(netBuyBillion / 10), 50);
}

/** 동반상승 점수 (20점 만점): 테마 내 상승 종목 비율 */
export function calcBreadthScore(risingPercent: number): number {
  if (risingPercent < 50) return 0;
  return Math.min(Math.round((risingPercent - 50) * 0.67), 20);
}

/** 신뢰도 등급 */
export function getReliabilityGrade(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/** 방향 예측 */
export function getDirection(
  grade: 'HIGH' | 'MEDIUM' | 'LOW',
  netBuy: number
): 'up' | 'up_possible' | 'neutral' {
  if (grade === 'HIGH' && netBuy > 0) return 'up';
  if (grade === 'MEDIUM' && netBuy > 0) return 'up_possible';
  return 'neutral';
}

/** 테마 신뢰도 종합 계산 */
export function calculateThemeReliability(
  themeId: number,
  volumeIncreasePercent: number,
  netBuyBillion: number,
  risingPercent: number
): ThemeReliability {
  const volume_score = calcVolumeScore(volumeIncreasePercent);
  const flow_score = calcFlowScore(netBuyBillion);
  const breadth_score = calcBreadthScore(risingPercent);
  const total_score = volume_score + flow_score + breadth_score;
  const grade = getReliabilityGrade(total_score);
  const direction = getDirection(grade, netBuyBillion);

  return {
    theme_id: themeId,
    volume_score,
    flow_score,
    breadth_score,
    total_score,
    grade,
    direction,
  };
}

// ── 타이밍 지표 계산 ──

/** 타이밍 시그널: RSI + MACD 골든크로스 비율 */
export function getTimingSignal(avgRsi: number, goldenCrossRatio: number): 'green' | 'yellow' | 'red' {
  if (avgRsi < 70 && goldenCrossRatio >= 60) return 'green';
  if (avgRsi >= 70 || goldenCrossRatio < 40) return 'red';
  return 'yellow';
}

/** 테마 타이밍 계산 */
export function calculateThemeTiming(
  themeId: number,
  avgRsi: number,
  goldenCrossRatio: number
): ThemeTiming {
  return {
    theme_id: themeId,
    avg_rsi: avgRsi,
    golden_cross_ratio: goldenCrossRatio,
    signal: getTimingSignal(avgRsi, goldenCrossRatio),
  };
}

// ── 종합 점수 계산 (스크리너/테마 공용) ──

interface ScoreInput {
  roe: number | null;
  roa: number | null;
  operatingMargin: number | null;
  pbr: number | null;
  per: number | null;
  sectorAvgPer: number | null;
  prevRoe: number | null;
  prevOperatingMargin: number | null;
  prevPbr: number | null;
}

/** 품질 점수 (50점 만점) */
export function calcQualityScore(roe: number | null, roa: number | null, opMargin: number | null): number {
  const roeScore = Math.min((roe ?? 0) * 1, 20);
  const roaScore = Math.min((roa ?? 0) * 1.5, 15);
  const opScore = Math.min((opMargin ?? 0) * 1, 15);
  return Math.max(roeScore, 0) + Math.max(roaScore, 0) + Math.max(opScore, 0);
}

/** 밸류에이션 점수 (20점 만점) */
export function calcValuationScore(pbr: number | null, per: number | null, sectorAvgPer: number | null): number {
  const pbrScore = Math.max(10 - (pbr ?? 2) * 5, 0);
  const avgPer = sectorAvgPer ?? 15;
  const perScore = avgPer > 0 ? Math.max(10 - ((per ?? avgPer) / avgPer) * 5, 0) : 0;
  return Math.min(pbrScore, 10) + Math.min(perScore, 10);
}

/** 개선 점수 (30점 만점) */
export function calcImprovementScore(
  roe: number | null, prevRoe: number | null,
  opMargin: number | null, prevOpMargin: number | null,
  pbr: number | null, prevPbr: number | null
): number {
  const roeChange = (roe ?? 0) - (prevRoe ?? 0);
  const opChange = (opMargin ?? 0) - (prevOpMargin ?? 0);
  const pbrDecline = (prevPbr ?? 0) - (pbr ?? 0); // 감소가 양수

  const roeScore = Math.min(Math.max(roeChange * 2, 0), 12);
  const opScore = Math.min(Math.max(opChange * 2, 0), 12);
  const pbrScore = Math.min(Math.max(pbrDecline * 10, 0), 6);

  return roeScore + opScore + pbrScore;
}

/** 종합 점수 계산 */
export function calculateStockScore(stockCode: string, input: ScoreInput): StockScore {
  const quality_score = calcQualityScore(input.roe, input.roa, input.operatingMargin);
  const valuation_score = calcValuationScore(input.pbr, input.per, input.sectorAvgPer);
  const improvement_score = calcImprovementScore(
    input.roe, input.prevRoe,
    input.operatingMargin, input.prevOperatingMargin,
    input.pbr, input.prevPbr
  );

  return {
    stock_code: stockCode,
    quality_score: Math.round(quality_score * 100) / 100,
    valuation_score: Math.round(valuation_score * 100) / 100,
    improvement_score: Math.round(improvement_score * 100) / 100,
    total_score: Math.round((quality_score + valuation_score + improvement_score) * 100) / 100,
  };
}
