// 환율 민감도 순수 계산 함수 (UI 무관)
//
// 파이프라인: dailyReturns → alignByDate → computeFxSensitivity → windowSensitivity
// - 단순수익률 사용 (로그수익률 아님): "환율 +1% → 주가 +X%" 직관 해석을 위해.

export interface DatedValue {
  date: string; // 'YYYY-MM-DD'
  value: number;
}

export interface ReturnPair {
  date: string;
  stockRet: number;
  fxRet: number;
}

export interface FxSensitivity {
  n: number;
  correlation: number;
  beta: number | null;
}

/**
 * 단순 일별수익률 (v[i] - v[i-1]) / v[i-1].
 * 입력은 날짜 오름차순 가정. 분모 0/비유한값은 건너뜀.
 */
export function dailyReturns(series: DatedValue[]): DatedValue[] {
  const out: DatedValue[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    const cur = series[i].value;
    if (prev !== 0 && Number.isFinite(prev) && Number.isFinite(cur)) {
      out.push({ date: series[i].date, value: (cur - prev) / prev });
    }
  }
  return out;
}

/**
 * trade_date 기준 inner join. 양쪽 다 있는 날만 남기고(환율 결측일/거래정지일 제거)
 * 오름차순 정렬해 (stockRet, fxRet) 쌍 배열로 반환.
 * 종목 수익률 시계열과 환율 변동률 시계열을 넘긴다.
 */
export function alignByDate(stockRows: DatedValue[], fxRows: DatedValue[]): ReturnPair[] {
  const fxMap = new Map(fxRows.map((r) => [r.date, r.value]));
  const pairs: ReturnPair[] = [];
  for (const s of stockRows) {
    const fx = fxMap.get(s.date);
    if (fx !== undefined) {
      pairs.push({ date: s.date, stockRet: s.value, fxRet: fx });
    }
  }
  pairs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return pairs;
}

/**
 * ECOS 매매기준율 보고 시차(1일) 보정.
 *
 * ECOS 매매기준율(rate)은 "전 영업일 은행간 거래 가중평균"을 다음날 아침 고시한다.
 * 즉 rate[T]는 T-1일 외환시장을 반영한다. 따라서 일별변동률 fxRet[T](= rate[T] 대비
 * rate[T-1])는 실제로는 "T-1일에 일어난 환율 변동"이다.
 * 주가 종가 수익률 stockRet[T](T일 시장)와 "경제적 동일 시점"으로 맞추려면 fxRet를
 * 한 영업일 앞당겨(= 이전 fx 날짜로 재라벨) 정렬해야 한다.
 *   fxRet[d_i] (= d_{i-1}일 시장의 변동)  →  날짜 d_{i-1} 로 재라벨.
 *
 * 검증(2026-06-18): 동일날짜 join은 1일 어긋나 상관이 상쇄됨(삼성 +0.19).
 * 본 보정 적용 시 삼성 60일 corr ≈ -0.69 로 실제 신호(외국인 자금흐름 기반 음의 동조) 회복.
 *
 * 입력: 오름차순 일별변동률. 출력: 한 칸 앞 날짜로 재라벨된 변동률(오름차순).
 */
export function applyFxReportingLag(fxReturns: DatedValue[]): DatedValue[] {
  const out: DatedValue[] = [];
  for (let i = 1; i < fxReturns.length; i++) {
    out.push({ date: fxReturns[i - 1].date, value: fxReturns[i].value });
  }
  return out;
}

/**
 * 정렬된 공통구간 (stockRet, fxRet) 쌍으로 민감도 계산.
 * - correlation = 피어슨 상관계수
 * - beta = cov(stock, fx) / var(fx)  ("환율 1% 변동 시 주가 몇 % 변동"의 기울기)
 * - var(fx) == 0 또는 비유한이면 beta = null (분모 0/NaN 방어)
 */
export function computeFxSensitivity(pairs: ReturnPair[]): FxSensitivity {
  const n = pairs.length;
  if (n < 2) return { n, correlation: 0, beta: null };

  let sumX = 0; // fxRet
  let sumY = 0; // stockRet
  for (const p of pairs) {
    sumX += p.fxRet;
    sumY += p.stockRet;
  }
  const mx = sumX / n;
  const my = sumY / n;

  let cov = 0;
  let vx = 0; // var(fx)
  let vy = 0; // var(stock)
  for (const p of pairs) {
    const dx = p.fxRet - mx;
    const dy = p.stockRet - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  // 모두 같은 n으로 나누므로 beta/correlation에서 1/n은 약분됨 → 합으로 계산 무방
  const beta = vx > 0 && Number.isFinite(vx) ? cov / vx : null;
  const denom = Math.sqrt(vx * vy);
  const correlation = denom > 0 && Number.isFinite(denom) ? cov / denom : 0;

  return { n, correlation, beta };
}

/**
 * 가장 최근 거래일부터 역으로 windowSize 공통거래일을 슬라이스해 민감도 계산.
 * 유효 데이터가 창 요구일의 70% 미만이면 null (부족).
 */
export function windowSensitivity(pairs: ReturnPair[], windowSize: number): FxSensitivity | null {
  const slice = pairs.slice(-windowSize); // 오름차순이므로 끝쪽이 최근
  if (slice.length < windowSize * 0.7) return null;
  return computeFxSensitivity(slice);
}
