import { regressionLine, type ReturnPair } from '../../lib/fxStats';

// 환율 민감도 산점도 (SVG 직접 — 점 + 0기준선 + 회귀선)
// x = 원/달러 일변동률, y = 주가 일변동률 (둘 다 단순수익률, 소수)

interface FxScatterChartProps {
  points: ReturnPair[];
}

// viewBox 기준 좌표 (컨테이너 폭에 맞춰 반응형)
const W = 340;
const H = 260;
const M = { left: 46, right: 14, top: 14, bottom: 38 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

/** [min, max]에 0을 포함하고 8% 패딩. 퇴화(동일값)는 ε로 확장. */
function domain(vals: number[]): [number, number] {
  let lo = Math.min(0, ...vals);
  let hi = Math.max(0, ...vals);
  if (hi === lo) { hi += 0.001; lo -= 0.001; }
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

export default function FxScatterChart({ points }: FxScatterChartProps) {
  const xs = points.map((p) => p.fxRet);
  const ys = points.map((p) => p.stockRet);
  const [xMin, xMax] = domain(xs);
  const [yMin, yMax] = domain(ys);

  const sx = (v: number) => M.left + ((v - xMin) / (xMax - xMin)) * PLOT_W;
  const sy = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * PLOT_H;

  const reg = regressionLine(points);
  const regLine = reg
    ? { x1: sx(xMin), y1: sy(reg.slope * xMin + reg.intercept), x2: sx(xMax), y2: sy(reg.slope * xMax + reg.intercept) }
    : null;

  const zeroX = sx(0);
  const zeroY = sy(0);

  return (
    <svg className="fx-scatter" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id="fxScatterClip">
          <rect x={M.left} y={M.top} width={PLOT_W} height={PLOT_H} />
        </clipPath>
      </defs>

      {/* 플롯 테두리 */}
      <rect className="fx-scatter-frame" x={M.left} y={M.top} width={PLOT_W} height={PLOT_H} />

      {/* 0 기준선 (점선) */}
      <line className="fx-scatter-zero" x1={zeroX} y1={M.top} x2={zeroX} y2={M.top + PLOT_H} />
      <line className="fx-scatter-zero" x1={M.left} y1={zeroY} x2={M.left + PLOT_W} y2={zeroY} />

      {/* 회귀선 */}
      {regLine && (
        <line
          className="fx-scatter-reg"
          x1={regLine.x1} y1={regLine.y1} x2={regLine.x2} y2={regLine.y2}
          clipPath="url(#fxScatterClip)"
        />
      )}

      {/* 점 (반투명, 겹침 대비) */}
      <g clipPath="url(#fxScatterClip)">
        {points.map((p, i) => (
          <circle key={i} className="fx-scatter-point" cx={sx(p.fxRet)} cy={sy(p.stockRet)} r={3} />
        ))}
      </g>

      {/* 축 눈금 라벨 (양 끝 %) */}
      <text className="fx-scatter-tick" x={M.left} y={H - M.bottom + 14} textAnchor="start">{pct(xMin)}</text>
      <text className="fx-scatter-tick" x={M.left + PLOT_W} y={H - M.bottom + 14} textAnchor="end">{pct(xMax)}</text>
      <text className="fx-scatter-tick" x={M.left - 6} y={M.top + 8} textAnchor="end">{pct(yMax)}</text>
      <text className="fx-scatter-tick" x={M.left - 6} y={M.top + PLOT_H} textAnchor="end">{pct(yMin)}</text>

      {/* 축 이름 */}
      <text className="fx-scatter-axis-label" x={M.left + PLOT_W / 2} y={H - 6} textAnchor="middle">
        원/달러 일변동률
      </text>
      <text
        className="fx-scatter-axis-label"
        x={12} y={M.top + PLOT_H / 2}
        textAnchor="middle"
        transform={`rotate(-90 12 ${M.top + PLOT_H / 2})`}
      >
        주가 일변동률
      </text>
    </svg>
  );
}
