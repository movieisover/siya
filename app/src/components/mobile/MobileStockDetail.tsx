import { useState } from 'react';
import { useWatchlist } from '../../hooks/useWatchlist';
import type { AppMode } from '../../App';
import RightPanel from '../layout/RightPanel';
import MobileChartLayer from './MobileChartLayer';

interface MobileStockDetailProps {
  stockCode: string;
  mode: AppMode;
  selectedThemeId: number | null;
  stockName?: string;
  onBack: () => void;
}

export default function MobileStockDetail({
  stockCode, mode, selectedThemeId, stockName, onBack,
}: MobileStockDetailProps) {
  const watchlist = useWatchlist();
  const isWatched = watchlist.isWatched(stockCode);
  const watchMemo = watchlist.getMemo(stockCode);
  const [chartOpen, setChartOpen] = useState(false);

  return (
    <div className="mobile-detail-screen">
      {/* 뒤로가기 헤더 — 별★은 RightPanel 내부 것을 사용하므로 여기선 제거 */}
      <div className="mobile-back-bar">
        <button className="mobile-back-btn" onClick={onBack}>
          ← 목록
        </button>
        <span className="mobile-back-title">{stockName || stockCode}</span>
      </div>

      {/* RightPanel 재활용 — onChartOpen을 넘기면 주가 옆에 "차트보기" 버튼이 표시됨 (모바일 전용) */}
      <div className="mobile-detail-content">
        <RightPanel
          stockCode={stockCode}
          mode={mode}
          selectedThemeId={selectedThemeId}
          isWatched={isWatched}
          watchMemo={watchMemo}
          onWatchToggle={(code, watched) =>
            watched ? watchlist.remove(code) : watchlist.add(code)
          }
          onMemoUpdate={(code, memo) => watchlist.updateMemo(code, memo)}
          onChartOpen={() => setChartOpen(true)}
        />
      </div>

      {/* 차트 전체화면 레이어 (세로 기본, 가로 보너스) */}
      {chartOpen && (
        <MobileChartLayer
          stockCode={stockCode}
          stockName={stockName}
          onClose={() => setChartOpen(false)}
        />
      )}
    </div>
  );
}
