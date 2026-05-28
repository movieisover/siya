// 수급 차트 — 기관(막대) + 외국인(꺾은선)
import { useRef, useEffect, useState } from 'react';
import { createChart, HistogramSeries, LineSeries, type IChartApi, ColorType } from 'lightweight-charts';
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
  isModal?: boolean;
}

export default function SupplyChart({ stockCode, stockName, height = 300, isModal = false }: SupplyChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { data, loading } = useInvestorData(stockCode);
  const [period, setPeriod] = useState<SupplyPeriod>('1M');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.daily.length === 0) return;

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
        attributionLogo: false,
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
      leftPriceScale: {
        visible: true,
        borderColor: '#2a2e3a',
      },
      crosshair: {
        horzLine: { color: '#4a9eff', style: 2 },
        vertLine: { color: '#4a9eff', style: 2 },
      },
    });

    chartRef.current = chart;

    const periodDays = PERIODS.find((p) => p.value === period)?.days || 20;
    const sliced = data.daily.slice(0, periodDays).reverse();

    // 기관 — 막대차트 (우측 Y축)
    const instSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'custom', formatter: (v: number) => formatBillion(v) },
      priceScaleId: 'right',
    });

    instSeries.setData(
      sliced.map((d) => ({
        time: d.trade_date,
        value: d.inst_net_buy,
        color: 'rgba(34, 197, 94, 0.7)',
      }))
    );

    // 외국인 — 꺾은선 (좌측 Y축)
    const frgnSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceFormat: { type: 'custom', formatter: (v: number) => formatBillion(v) },
      priceScaleId: 'left',
      crosshairMarkerRadius: 4,
    });

    frgnSeries.setData(
      sliced.map((d) => ({
        time: d.trade_date,
        value: d.foreign_net_buy,
      }))
    );

    chart.timeScale().fitContent();

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
        {!isModal && (
          <button className="chart-expand-btn" onClick={() => setShowModal(true)}>⛶</button>
        )}
      </div>

      <div className="chart-container" style={{ position: 'relative' }}>
        {stockName && (
          <div className="chart-stock-name">{stockName}</div>
        )}
        <div className="supply-legend">
          <span className="supply-legend-item">
            <span className="supply-legend-dot" style={{ background: '#22c55e' }} />
            기관 (우)
          </span>
          <span className="supply-legend-item">
            <span className="supply-legend-line" style={{ background: '#3b82f6' }} />
            외국인 (좌)
          </span>
        </div>
        <div ref={chartContainerRef} />
        {loading && (
          <div className="chart-loading">로딩 중...</div>
        )}
      </div>

      {showModal && (
        <div className="chart-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="chart-modal-close" onClick={() => setShowModal(false)}>✕</button>
            <SupplyChart stockCode={stockCode} stockName={stockName} height={500} isModal />
          </div>
        </div>
      )}
    </div>
  );
}

function formatBillion(val: number): string {
  const billions = val / 100;
  if (Math.abs(billions) >= 10000) {
    return (billions / 10000).toFixed(1) + '조';
  }
  return Math.round(billions).toLocaleString() + '억';
}
