// 수급 차트 — 기관/외국인 순매수 막대차트
import { useRef, useEffect, useState } from 'react';
import { createChart, HistogramSeries, type IChartApi, ColorType } from 'lightweight-charts';
import { useInvestorData } from '../../hooks/useInvestorData';

type SupplyPeriod = '1M' | '3M' | '6M' | '1Y';

const PERIODS: { label: string; value: SupplyPeriod; days: number }[] = [
  { label: '1개월', value: '1M', days: 20 },
  { label: '3개월', value: '3M', days: 60 },
  { label: '6개월', value: '6M', days: 120 },
  { label: '1년', value: '1Y', days: 250 },
];

interface SupplyChartProps {
  stockCode: string;
  stockName?: string;
  height?: number;
}

export default function SupplyChart({ stockCode, stockName, height = 300 }: SupplyChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { data, loading } = useInvestorData(stockCode);
  const [period, setPeriod] = useState<SupplyPeriod>('1M');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.daily.length === 0) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b8fa3',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 58, 0.4)' },
        horzLines: { color: 'rgba(42, 46, 58, 0.4)' },
      },
      timeScale: {
        borderColor: '#2a2e3a',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2e3a',
      },
      crosshair: {
        horzLine: { color: '#4a9eff', style: 2 },
        vertLine: { color: '#4a9eff', style: 2 },
      },
    });

    chartRef.current = chart;

    // 기간에 맞는 데이터 슬라이스 (daily는 최신순이므로 reverse)
    const periodDays = PERIODS.find((p) => p.value === period)?.days || 20;
    const sliced = data.daily.slice(0, periodDays).reverse();

    // 기관 순매수 (초록/빨강)
    const instSeries = chart.addSeries(HistogramSeries, {
      color: '#22c55e',
      priceFormat: { type: 'custom', formatter: (v: number) => formatBillion(v) },
      priceScaleId: 'right',
    });

    instSeries.setData(
      sliced.map((d) => ({
        time: d.trade_date,
        value: d.inst_net_buy,
        color: d.inst_net_buy >= 0
          ? 'rgba(34, 197, 94, 0.7)'
          : 'rgba(239, 68, 68, 0.5)',
      }))
    );

    // 외국인 순매수 (파랑/주황) — 별도 price scale
    const frgnSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'custom', formatter: (v: number) => formatBillion(v) },
      priceScaleId: 'left',
    });

    frgnSeries.setData(
      sliced.map((d) => ({
        time: d.trade_date,
        value: d.foreign_net_buy,
        color: d.foreign_net_buy >= 0
          ? 'rgba(59, 130, 246, 0.7)'
          : 'rgba(251, 146, 60, 0.5)',
      }))
    );

    // 왼쪽 price scale 활성화
    chart.applyOptions({
      leftPriceScale: {
        visible: true,
        borderColor: '#2a2e3a',
      },
    });

    chart.timeScale().fitContent();

    // 리사이즈
    const observer = new ResizeObserver(() => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, period, height]);

  return (
    <div className="candle-chart-wrapper">
      <div className="chart-period-btns">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`chart-period-btn ${period === p.value ? 'active' : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
        <button className="chart-expand-btn" onClick={() => setShowModal(true)}>⛶</button>
      </div>

      <div className="chart-container" style={{ position: 'relative' }}>
        {stockName && (
          <div className="chart-stock-name">{stockName}</div>
        )}
        <div className="supply-legend">
          <span className="supply-legend-item">
            <span className="supply-legend-dot" style={{ background: '#22c55e' }} />
            기관 (좌)
          </span>
          <span className="supply-legend-item">
            <span className="supply-legend-dot" style={{ background: '#3b82f6' }} />
            외국인 (우)
          </span>
        </div>
        <div ref={chartContainerRef} />
        {loading && (
          <div className="chart-loading">로딩 중...</div>
        )}
      </div>

      {/* 확대 모달 */}
      {showModal && (
        <div className="chart-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="chart-modal-close" onClick={() => setShowModal(false)}>✕</button>
            <SupplyChart stockCode={stockCode} stockName={stockName} height={500} />
          </div>
        </div>
      )}
    </div>
  );
}

function formatBillion(val: number): string {
  // 백만원 → 억 단위
  const billions = val / 100;
  if (Math.abs(billions) >= 1000) {
    return (billions / 10000).toFixed(1) + '조';
  }
  return Math.round(billions).toLocaleString() + '억';
}
