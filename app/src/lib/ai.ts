// 시야 AI — Supabase Edge Function 프록시 호출
// DB 데이터 + 일반 지식 + 웹 검색 활용

import { supabase } from './supabase';
import type { StockDetailData } from '../hooks/useStockDetail';

/** 종목 DB 데이터를 시스템 프롬프트용 컨텍스트로 변환 */
function buildStockContext(detail: StockDetailData): string {
  const { stock, price, valuation, financials, score, sectorAvg } = detail;
  const latestFin = financials[0];

  let ctx = `## 분석 대상 종목\n`;
  ctx += `- 종목명: ${stock.stock_name}\n`;
  ctx += `- 종목코드: ${stock.stock_code}\n`;
  ctx += `- 시장: ${stock.market}\n`;
  ctx += `- 업종: ${stock.sector || '미분류'}\n\n`;

  if (price) {
    ctx += `## 현재 시세\n`;
    ctx += `- 현재가: ${price.close.toLocaleString()}원\n`;
    ctx += `- 등락률: ${price.change_pct !== null ? `${price.change_pct >= 0 ? '+' : ''}${price.change_pct.toFixed(2)}%` : '없음'}\n\n`;
  }

  ctx += `## 종합 점수 (100점 만점)\n`;
  ctx += `- 총점: ${score.total_score.toFixed(1)}점\n`;
  ctx += `- 품질 (50점 만점): ${score.quality_score.toFixed(1)}점\n`;
  ctx += `- 밸류에이션 (20점 만점): ${score.valuation_score.toFixed(1)}점\n`;
  ctx += `- 개선 (30점 만점): ${score.improvement_score.toFixed(1)}점\n\n`;

  if (latestFin) {
    ctx += `## 최신 재무지표 (${latestFin.fiscal_year}년)\n`;
    ctx += `- ROE: ${latestFin.roe ?? '-'}%\n`;
    ctx += `- ROA: ${latestFin.roa ?? '-'}%\n`;
    ctx += `- 영업이익률: ${latestFin.operating_margin ?? '-'}%\n`;
    ctx += `- 부채비율: ${latestFin.debt_ratio ?? '-'}%\n\n`;
  }

  if (valuation) {
    ctx += `## 밸류에이션\n`;
    ctx += `- PER: ${valuation.per ?? '-'}\n`;
    ctx += `- PBR: ${valuation.pbr ?? '-'}\n`;
    ctx += `- 배당수익률: ${valuation.div_yield ?? '-'}%\n`;
    ctx += `- DPS: ${valuation.dps ? valuation.dps.toLocaleString() + '원' : '-'}\n\n`;
  }

  if (sectorAvg.per !== null || sectorAvg.pbr !== null || sectorAvg.roe !== null) {
    ctx += `## 업종 평균\n`;
    ctx += `- 업종 평균 PER: ${sectorAvg.per ?? '-'}\n`;
    ctx += `- 업종 평균 PBR: ${sectorAvg.pbr ?? '-'}\n`;
    ctx += `- 업종 평균 ROE: ${sectorAvg.roe ?? '-'}%\n\n`;
  }

  if (financials.length > 1) {
    ctx += `## 재무 추이\n`;
    for (const f of financials) {
      const rev = f.revenue !== null ? `${(f.revenue / 1_000_000).toFixed(1)}조` : '-';
      const op = f.operating_income !== null ? `${(f.operating_income / 1_000_000).toFixed(1)}조` : '-';
      ctx += `- ${f.fiscal_year}년: 매출 ${rev}, 영업이익 ${op}, ROE ${f.roe ?? '-'}%\n`;
    }
    ctx += '\n';
  }

  return ctx;
}

const SYSTEM_PROMPT = `당신은 "시야"라는 한국 주식 가치투자 분석 AI 어시스턴트입니다.

## 역할
- 장기(6개월~) 가치/퀄리티 투자 관점에서 종목을 분석합니다.
- 아래 제공된 DB 재무 데이터를 최우선으로 활용하되, 당신이 알고 있는 일반적인 지식과 판단력도 함께 활용하세요.
- 필요하면 웹 검색을 통해 최신 뉴스, 공시, 애널리스트 의견 등을 찾아 답변에 포함하세요.
- 투자 판단은 사용자의 몫이므로, 분석과 근거를 제시하되 "사세요/파세요" 같은 직접적 매매 권유는 하지 않습니다.

## 답변 범위
- 종목 재무 분석 (DB 데이터 기반)
- 업종/산업 전망, 시장 동향 (일반 지식 + 웹 검색)
- 투자 용어 설명, 투자 전략 조언
- 경쟁사 비교, 사업 모델 분석
- 최신 뉴스, 공시, 실적 발표 (웹 검색)
- 기타 주식 투자 관련 모든 질문

## 분석 기준
- 품질: ROE, ROA, 영업이익률 (높을수록 좋음)
- 밸류에이션: PER, PBR (업종 대비 낮을수록 저평가)
- 개선 추세: 전년 대비 ROE/영업이익률 개선, PBR 하락
- 재무 안정성: 부채비율 (100% 이하 안전)
- 배당: 배당수익률, DPS

## 답변 스타일
- 한국어로 답변합니다.
- 간결하고 핵심적으로 답변합니다.
- 숫자와 데이터를 근거로 들어 설명합니다.
- 긍정적/부정적 포인트를 균형있게 제시합니다.
- DB 데이터로 답변할 수 없는 질문도 거절하지 말고, 알고 있는 지식이나 웹 검색을 활용해 최선의 답변을 제공하세요.`;

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Supabase Edge Function을 통해 Claude API 호출 */
export async function askSiyaAi(
  question: string,
  stockDetail: StockDetailData,
  history: AiMessage[],
  signal?: AbortSignal
): Promise<string> {
  const stockContext = buildStockContext(stockDetail);

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: question },
  ];

  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const funcUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/siya-ai`;

  const res = await fetch(funcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({
      system: `${SYSTEM_PROMPT}\n\n---\n\n${stockContext}`,
      messages,
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`시야 AI 오류: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data?.error) {
    throw new Error(`Claude API 오류: ${data.error}`);
  }

  // 웹 검색 시 여러 content 블록이 올 수 있음 → 텍스트만 추출
  if (data?.content && Array.isArray(data.content)) {
    const texts = data.content
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text);
    if (texts.length > 0) {
      return texts.join('\n\n');
    }
  }

  return '응답을 받지 못했습니다.';
}
