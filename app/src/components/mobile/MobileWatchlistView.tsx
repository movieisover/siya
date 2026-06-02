import { useWatchlist } from '../../hooks/useWatchlist';
import { useWatchlistStocks } from '../../hooks/useWatchlistStocks';
import MobileStockList from './MobileStockList';

interface MobileWatchlistViewProps {
  selectedStockCode: string | null;
  onStockSelect: (code: string, name?: string) => void;
}

export default function MobileWatchlistView({ selectedStockCode, onStockSelect }: MobileWatchlistViewProps) {
  // useWatchlist를 직접 써서 새로 추가한 데이터가 즉시 반영되도록
  const watchlist = useWatchlist();
  const { stocks, loading } = useWatchlistStocks(watchlist.codes);

  if (watchlist.codes.length === 0) {
    return (
      <div className="mobile-watchlist-view">
        <div className="mobile-list-header">관심종목</div>
        <div className="mobile-list-empty" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⭐</div>
          <div style={{ marginBottom: '8px' }}>관심종목이 없습니다</div>
          <div style={{ fontSize: '13px', color: 'var(--color-accent)' }}>
            종목 상세에서 ☆을 눌러 추가해보세요
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-watchlist-view">
      <MobileStockList
        stocks={stocks}
        loading={loading}
        title="관심종목"
        selectedCode={selectedStockCode}
        onStockSelect={(code) => {
          const name = stocks.find(s => s.stock_code === code)?.stock_name;
          onStockSelect(code, name);
        }}
        emptyMessage="관심종목을 불러오는 중 오류가 발생했습니다"
      />
    </div>
  );
}
