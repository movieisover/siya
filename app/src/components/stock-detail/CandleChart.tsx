import { useRef, useEffect, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, type IChartApi, type ISeriesApi, ColorType } from 'lightweight-charts';
import { useChartData, type ChartPeriod, type RealtimePriceData } from '../../hooks/useChartData';
import Tooltip from '../common/Tooltip';

const PERIODS: { label: string; value: ChartPeriod }[] = [
  { label: '1개월', value: '1M' },
  { label: '3개월', value: '3M' },
  { label: '6개월', value: '6M' },
  { label: '1년', value: '1Y' },
  { label: '3년', value: '3Y' },
];

interface CandleChartProps {
  stockCode: string;
  stockName?: string;
  height?: number;
  realtimePrice?: RealtimePriceData | null;
}

// ── SMA 계산 + 골든/데드크로스 감지 ──

interface MAData {
  time: string;
  value: number;
}

interface CrossStatus {
  type: 'golden' | 'dead' | null;
  days: number;
}

function calcSMA(closes: { time: string; close: number }[], period: number): MAData[] {
  const result: MAData[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j].close;
    result.push({ time: closes[i].time, value: Math.round((sum / period) * 100) / 100 });
  }
  return result;
}

function getCurrentCrossStatus(ma20: MAData[], ma120: MAData[]): CrossStatus {
  const map120 = new Map(ma120.map((d) => [d.time, d.value]));
  const aligned = ma20.filter((d) => map120.has(d.time));
  if (aligned.length === 0) return { type: null, days: 0 };

  const last = aligned[aligned.length - 1];
  const lastDiff = last.value - map120.get(last.time)!;
  const currentType: 'golden' | 'dead' = lastDiff > 0 ? 'golden' : 'dead';

  let days = 0;
  for (let i = aligned.length - 1; i >= 0; i--) {
    const diff = aligned[i].value - map120.get(aligned[i].time)!;
    if ((currentType === 'golden' && diff > 0) || (currentType === 'dead' && diff < 0)) {
      days++;
    } else break;
  }

  return { type: currentType, days };
}

function ChartCore({ stockCode, stockName, height = 250, period, onPeriodChange, showExpand, onExpand, realtimePrice, showMA, onToggleMA }: {
  stockCode: string;
  stockName?: string;
  height: number;
  period: ChartPeriod;
  onPeriodChange: (p: ChartPeriod) => void;
  showExpand?: boolean;
  onExpand?: () => void;
  realtimePrice?: RealtimePriceData | null;
  showMA: boolean;
  onToggleMA: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma120Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const { data, loading, visibleStartDate } = useChartData(stockCode, period, realtimePrice);

  // SMA 계산 (데이터 변경 시)
  const closes = data.map((d) => ({ time: d.time, close: d.close }));
  const sma20 = calcSMA(closes, 20);
  const sma60 = calcSMA(closes, 60);
  const sma120 = calcSMA(closes, 120);
  const crossStatus = sma20.length > 0 && sma120.length > 0 ? getCurrentCrossStatus(sma20, sma120) : { type: null, days: 0 };

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1d27' },
        textColor: '#8b8fa3',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: '#2a2e3a' },
        horzLines: { color: '#2a2e3a' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#2a2e3a' },
      timeScale: { borderColor: '#2a2e3a', timeVisible: false },
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
      ma20Ref.current = null;
      ma60Ref.current = null;
      ma120Ref.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || data.length === 0) return;

    candleRef.current.setData(
      data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }))
    );

    volumeRef.current.setData(
      data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
      }))
    );

    chartRef.current?.timeScale().setVisibleRange({
      from: visibleStartDate,
      to: data[data.length - 1]?.time ?? visibleStartDate,
    });
  }, [data, visibleStartDate]);

  // MA 시리즈 관리 (showMA 토글 시)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (showMA) {
      // MA 시리즈 생성
      if (!ma20Ref.current && sma20.length > 0) {
        const s = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        s.setData(sma20.map((d) => ({ time: d.time, value: d.value })));
        ma20Ref.current = s;
      }
      if (!ma60Ref.current && sma60.length > 0) {
        const s = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        s.setData(sma60.map((d) => ({ time: d.time, value: d.value })));
        ma60Ref.current = s;
      }
      if (!ma120Ref.current && sma120.length > 0) {
        const s = chart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        s.setData(sma120.map((d) => ({ time: d.time, value: d.value })));
        ma120Ref.current = s;
      }

      // 골든/데드크로스는 이평선 교차 지점에서 시각적으로 확인 가능 + 상태 뽃지로 표시
    } else {
      // MA 시리즈 제거
      if (ma20Ref.current) { chart.removeSeries(ma20Ref.current); ma20Ref.current = null; }
      if (ma60Ref.current) { chart.removeSeries(ma60Ref.current); ma60Ref.current = null; }
      if (ma120Ref.current) { chart.removeSeries(ma120Ref.current); ma120Ref.current = null; }
    }
  }, [showMA, sma20, sma60, sma120]);

  return (
    <div className="candle-chart-wrapper">
      <div className="chart-period-btns">
        {PERIODS.map(p => (
          <button
            key={p.value}
            className={`chart-period-btn ${period === p.value ? 'active' : ''}`}
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
        {showExpand && (
          <button className="chart-expand-btn" onClick={onExpand} title="크게 보기">
            ⛶
          </button>
        )}
        <button
          className={`chart-ma-btn ${showMA ? 'active' : ''}`}
          onClick={onToggleMA}
          title="이동평균선 (20/60/120일) 표시"
        >
          이동평균선
        </button>
        {showMA && crossStatus.type && (
          <span className={`chart-cross-badge ${crossStatus.type === 'golden' ? 'cross-golden' : 'cross-dead'}`}>
            {crossStatus.type === 'golden' ? '🟢 골든크로스' : '🔴 데드크로스'} ({crossStatus.days}일째)
          </span>
        )}
        <Tooltip text={`일봉 캔들차트 (OHLCV + 거래량)

빨간색 캔들 = 상승
파란색 캔들 = 하락

이동평균선 (MA 버튼 클릭 시 표시):
🟢 20일선(초록): 단기 추세
🟠 60일선(주황): 중기 추세
🟣 120일선(보라): 장기 추세

골든크로스(GC): 20일선이 120일선을 위로 돌파 → 상승 전환 신호
데드크로스(DC): 20일선이 120일선을 아래로 돌파 → 하락 전환 신호

데이터: 한국투자증권 API, 매일 16:00 자동 갱신`} />
      </div>
      <div ref={containerRef} className="chart-container">
        {loading && <div className="chart-loading">로딩 중...</div>}
        {stockName && (
          <div className="chart-stock-name">{stockName}</div>
        )}
        {showMA && (
          <div className="chart-ma-legend">
            <span className="ma-legend-item"><span className="ma-legend-line" style={{background:'#22c55e'}} />20일</span>
            <span className="ma-legend-item"><span className="ma-legend-line" style={{background:'#f59e0b'}} />60일</span>
            <span className="ma-legend-item"><span className="ma-legend-line" style={{background:'#a78bfa'}} />120일</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CandleChart({ stockCode, stockName, height = 300, realtimePrice }: CandleChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>('3M');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPeriod, setModalPeriod] = useState<ChartPeriod>('3M');
  const [showMA, setShowMA] = useState(false);

  const openModal = useCallback(() => {
    setModalPeriod(period);
    setModalOpen(true);
  }, [period]);

  const toggleMA = useCallback(() => setShowMA((v) => !v), []);

  return (
    <>
      <ChartCore
        stockCode={stockCode}
        stockName={stockName}
        height={height}
        period={period}
        onPeriodChange={setPeriod}
        showExpand
        onExpand={openModal}
        realtimePrice={realtimePrice}
        showMA={showMA}
        onToggleMA={toggleMA}
      />

      {modalOpen && (
        <div className="chart-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="chart-modal-content" onClick={e => e.stopPropagation()}>
            <button className="chart-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <ChartCore
              stockCode={stockCode}
              stockName={stockName}
              height={Math.round(window.innerHeight * 0.65)}
              period={modalPeriod}
              onPeriodChange={setModalPeriod}
              realtimePrice={realtimePrice}
              showMA={showMA}
              onToggleMA={toggleMA}
            />
          </div>
        </div>
      )}
    </>
  );
}
