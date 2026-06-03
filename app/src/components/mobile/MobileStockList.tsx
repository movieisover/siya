import { useState } from 'react';
import type { StockListItem } from '../../types/stock';

// 정렬 칩 옵션
type SortKey = 'total_score' | 'change_pct' | 'close' | 'per' | 'pbr' | 'roe';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'total_score', label: '점수순' },
  { key: 'change_pct',  label: '등락률' },
  { key: 'roe',         label: 'ROE' },
  { key: 'per',         label: 'PER' },
  { key: 'pbr',         label: 'PBR' },
];

interface MobileStockListProps {
  stocks: StockListItem[];
  loading: boolean;
  title: string;
  selectedCode: string | null;
  onStockSelect: (code: string) => void;
  emptyMessage?: string;
  /** 편집 모드: 행에 ✕ 제거 버튼 표시 */
  editMode?: boolean;
  onRemoveStock?: (code: string) => void;
  /** 정렬 칩 아래, 리스트 위에 끼워넣을 노드 (종목 추가 검색바 등) */
  addBar?: React.ReactNode;
}

export default function MobileStockList({
  stocks, loading, title, selectedCode, onStockSelect, emptyMessage = '종목이 없습니다',
  editMode = false, onRemoveStock, addBar,
}: MobileStockListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('total_score');
  const [sortDesc, setSortDesc] = useState(true);

  function handleSortChange(key: SortKey) {
    if (sortKey === key) {
      setSortDesc(!sortDesc); // 같은 키 재클릭 시 방향 전환
    } else {
      setSortKey(key);
      setSortDesc(key !== 'per' && key !== 'pbr'); // PER·PBR은 낮을수록 좋으니 기본 오름차순
    }
  }

  const sorted = [...stocks].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const cmp = (av as number) - (bv as number);
    return sortDesc ? -cmp : cmp;
  });

  if (loading) {
    return (
      <div className="mobile-stock-list">
        <div className="mobile-list-header"><span>{title}</span></div>
        <div className="mobile-list-loading">
          <span>⏳ 분석 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-stock-list">
      {/* 헤더: 제목 + 종목 수 */}
      <div className="mobile-list-header">
        <span>{title}</span>
        <span className="mobile-list-count">{stocks.length}개</span>
      </div>

      {/* 정렬 칩 (종목이 있을 때만) */}
      {stocks.length > 0 && (
        <div className="mobile-sort-chips">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`mobile-sort-chip ${sortKey === key ? 'active' : ''}`}
              onClick={() => handleSortChange(key)}
            >
              {label}
              {sortKey === key && (
                <span className="mobile-sort-dir">{sortDesc ? ' ▼' : ' ▲'}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 편집 모드: 종목 추가 검색바 (부모가 주입) */}
      {addBar}

      {/* 종목 리스트 */}
      <div className="mobile-stock-rows">
        {stocks.length === 0 ? (
          <div className="mobile-list-empty">{emptyMessage}</div>
        ) : (
          sorted.map((stock) => (
            <MobileStockRow
              key={stock.stock_code}
              stock={stock}
              selected={selectedCode === stock.stock_code}
              onSelect={() => onStockSelect(stock.stock_code)}
              editMode={editMode}
              onRemove={onRemoveStock ? () => onRemoveStock(stock.stock_code) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── 종목 행 ──

function MobileStockRow({
  stock, selected, onSelect, editMode, onRemove,
}: {
  stock: StockListItem;
  selected: boolean;
  onSelect: () => void;
  editMode?: boolean;
  onRemove?: () => void;
}) {
  const changePct = stock.change_pct;
  const isUp = changePct !== null && changePct >= 0;
  const changeClass = changePct === null ? '' : isUp ? 'change-up' : 'change-down';
  const changeStr = changePct !== null
    ? `${isUp ? '+' : ''}${changePct.toFixed(2)}%`
    : '-';

  const score = stock.total_score;
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';

  return (
    <div
      className={`mobile-stock-row ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {/* 왼쪽: 종목명 + 점수·PER·PBR·ROE */}
      <div className="mobile-row-left">
        <span className="mobile-row-name">{stock.stock_name}</span>
        <span className="mobile-row-meta">
          {score > 0 && (
            <span className={`mobile-row-score ${scoreClass}`}>
              점수 {score.toFixed(1)}
            </span>
          )}
          {stock.per !== null && stock.per !== undefined && (
            <span className="mobile-row-metric">PER {stock.per.toFixed(1)}</span>
          )}
          {stock.pbr !== null && stock.pbr !== undefined && (
            <span className="mobile-row-metric">PBR {stock.pbr.toFixed(2)}</span>
          )}
          {stock.roe !== null && stock.roe !== undefined && (
            <span className="mobile-row-metric">ROE {stock.roe}%</span>
          )}
        </span>
      </div>

      {/* 오른쪽: 현재가 + 등락률 */}
      <div className="mobile-row-right">
        <span className="mobile-row-price">
          {stock.close > 0 ? stock.close.toLocaleString() : '-'}
        </span>
        <span className={`mobile-row-change ${changeClass}`}>{changeStr}</span>
      </div>

      {/* 편집 모드: 제거 버튼 */}
      {editMode && onRemove && (
        <button
          className="mobile-row-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="테마에서 제거"
        >
          ✕
        </button>
      )}
    </div>
  );
}
