import { useWatchlist } from '../../hooks/useWatchlist';
import type { AppMode } from '../../App';
import RightPanel from '../layout/RightPanel';

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

  return (
    <div className="mobile-detail-screen">
      {/* 뒤로가기 헤더 — 별★은 RightPanel 내부 것을 사용하므로 여기선 제거 */}
      <div className="mobile-back-bar">
        <button className="mobile-back-btn" onClick={onBack}>
          ← 목록
        </button>
        <span className="mobile-back-title">{stockName || stockCode}</span>
      </div>

      {/* RightPanel 재활용 */}
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
        />
      </div>
    </div>
  );
}
