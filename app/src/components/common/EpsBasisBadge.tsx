// PER 산정 기준(TTM/연간) 배지 — valuation.eps_basis 기반
// ttm = 최근 4개 분기 합산 이익 / annual = 직전 사업연도 이익. null/미상이면 숨김.

const LABELS: Record<string, { text: string; cls: string }> = {
  ttm: { text: 'TTM', cls: 'eps-basis-ttm' },
  annual: { text: '연간', cls: 'eps-basis-annual' },
};

export const EPS_BASIS_TITLE =
  'PER 산정 기준 — TTM: 최근 4개 분기 합산 이익 / 연간: 직전 사업연도 이익';

export function EpsBasisBadge({ basis }: { basis?: string | null }) {
  if (!basis) return null;
  const m = LABELS[basis];
  if (!m) return null;
  return (
    <span className={`eps-basis-badge ${m.cls}`} title={EPS_BASIS_TITLE}>
      {m.text}
    </span>
  );
}
