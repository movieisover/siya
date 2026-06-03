import { useState, useEffect } from 'react';
import CandleChart from '../stock-detail/CandleChart';
import SupplyChart from '../stock-detail/SupplyChart';

interface MobileChartLayerProps {
  stockCode: string;
  stockName?: string;
  onClose: () => void;
}

export default function MobileChartLayer({ stockCode, stockName, onClose }: MobileChartLayerProps) {
  const [chartMode, setChartMode] = useState<'candle' | 'supply'>('candle');
  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches
  );

  // 화면 방향 감지 (가로/세로)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 뒤로가기로 닫기: 열 때 history 항목 추가 → 뒤로가기(popstate) 시 onClose.
  // cleanup에서 back()을 호출하지 않는다 — StrictMode 이중 마운트 시 즉시 닫히는 문제 방지.
  useEffect(() => {
    window.history.pushState({ chartLayer: true }, '');
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [onClose]);

  // X 버튼: onClose 직접 호출 대신 뒤로가기 → 위 popstate 핸들러가 onClose 실행 (추가한 history 항목 정리)
  const handleClose = () => window.history.back();

  // 차트 높이: 가로면 화면을 크게, 세로면 적당히
  const chartHeight = isLandscape
    ? Math.round(window.innerHeight * 0.72)
    : Math.round(window.innerHeight * 0.5);

  return (
    <div className="mobile-chart-layer">
      <div className="mobile-chart-layer-bar">
        <div className="mobile-chart-layer-toggle">
          <button
            className={`mobile-chart-toggle-btn ${chartMode === 'candle' ? 'active' : ''}`}
            onClick={() => setChartMode('candle')}
          >
            시세
          </button>
          <button
            className={`mobile-chart-toggle-btn ${chartMode === 'supply' ? 'active' : ''}`}
            onClick={() => setChartMode('supply')}
          >
            수급
          </button>
        </div>
        <button className="mobile-chart-layer-close" onClick={handleClose} aria-label="닫기">
          ✕
        </button>
      </div>

      {!isLandscape && (
        <div className="mobile-chart-layer-hint">
          ↻ 가로로 돌리면 더 넓게 볼 수 있어요
        </div>
      )}

      <div className="mobile-chart-layer-body">
        {chartMode === 'candle' ? (
          <CandleChart stockCode={stockCode} stockName={stockName} height={chartHeight} />
        ) : (
          <SupplyChart stockCode={stockCode} stockName={stockName} height={chartHeight} />
        )}
      </div>
    </div>
  );
}
