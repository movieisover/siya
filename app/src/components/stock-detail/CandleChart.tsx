import { useRef, useEffect, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, ColorType } from 'lightweight-charts';
import { useChartData, type ChartPeriod } from '../../hooks/useChartData';

const PERIODS: { label: string; value: ChartPeriod }[] = [
  { label: '1개월', value: '1M' },
  { label: '3개월', value: '3M' },
  { label: '6개월', value: '6M' },
  { label: '1년', value: '1Y' },
  { label: '3년', value: '3Y' },
];

interface CandleChartProps {
  stockCode: string;
}

export default function CandleChart({ stockCode }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>('3M');
  const { data, loading } = useChartData(stockCode, period);

  // 차트 생성/파괴
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 250,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1d27' },
        textColor: '#8b8fa3',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#2a2e3a' },
        horzLines: { color: '#2a2e3a' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#2a2e3a',
      },
      timeScale: {
        borderColor: '#2a2e3a',
        timeVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // 데이터 업데이트
  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || data.length === 0) return;

    candleRef.current.setData(
      data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    volumeRef.current.setData(
      data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
      }))
    );

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="candle-chart-wrapper">
      <div className="chart-period-btns">
        {PERIODS.map(p => (
          <button
            key={p.value}
            className={`chart-period-btn ${period === p.value ? 'active' : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="chart-container">
        {loading && <div className="chart-loading">로딩 중...</div>}
      </div>
    </div>
  );
}
