import { useState } from 'react';
import type { AppMode } from '../../App';
import type { ScreenerFilters } from '../../types/stock';
import { useThemeStocks } from '../../hooks/useThemeData';
import { useScreenerStocks } from '../../hooks/useScreenerStocks';
import { useWatchlistStocks } from '../../hooks/useWatchlistStocks';
import { useRealtimePrice } from '../../hooks/useRealtimePrice';
import CandleChart from '../stock-detail/CandleChart';

interface CenterPanelProps {
  mode: AppMode;
  selectedThemeId: number | null;
  selectedStockCode: string | null;
  screenerFilters: ScreenerFilters | null;
  watchlistCodes: string[];
  onStockSelect: (code: string) => void;
}

type SortKey = 'stock_name' | 'total_score' | 'per' | 'pbr' | 'roe' | 'close' | 'change_pct' | 'debt_ratio' | 'div_yield';
type SortDir = 'asc' | 'desc';

export default function CenterPanel({ mode, selectedThemeId, selectedStockCode, screenerFilters, watchlistCodes, onStockSelect }: CenterPanelProps) {
  const { stocks: themeStocks, loading: themeLoading } = useThemeStocks(mode === 'theme' ? selectedThemeId : null);
  const { stocks: screenerStocks, loading: screenerLoading, totalCount } = useScreenerStocks(mode === 'screener' ? screenerFilters : null);
  const { stocks: watchStocks, loading: watchLoading } = useWatchlistStocks(mode === 'watchlist' ? watchlistCodes : []);
  const { data: realtimePrice, isLive } = useRealtimePrice(selectedStockCode);

  const stocks = mode === 'theme' ? themeStocks : mode === 'screener' ? screenerStocks : watchStocks;
  const loading = mode === 'theme' ? themeLoading : mode === 'screener' ? screenerLoading : watchLoading;

  const [sortKey, setSortKey] = useState<SortKey>('total_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir(key === 'stock_name' ? 'asc' : 'desc');
    }
  }

  const sorted = [...stocks].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // 테마 모드: 테마 미선택
  if (mode === 'theme' && !selectedThemeId) {
    return (
      <main className="panel center-panel">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div>좌측에서 테마를 선택하세요</div>
        </div>
      </main>
    );
  }

  const isScreener = mode === 'screener';
  const isWatchlist = mode === 'watchlist';
  const showExtraCols = isScreener || isWatchlist;

  const title = isScreener
    ? `필터 결과 (${totalCount}개 종목)`
    : isWatchlist
    ? `관심종목 (${stocks.length}개)`
    : `종목 리스트 (${stocks.length}개)`;

  return (
    <main className="panel center-panel">
      {selectedStockCode && (
        <div className="center-chart-area">
          <CandleChart
            stockCode={selectedStockCode}
            height={300}
            realtimePrice={isLive && realtimePrice ? { price: realtimePrice.price, volume: realtimePrice.volume } : null}
          />
        </div>
      )}

      <div className="section-title">{title}</div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div>분석 중...</div>
        </div>
      ) : stocks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{isWatchlist ? '⭐' : '📭'}</div>
          <div>
            {isWatchlist
              ? '관심종목이 없습니다'
              : isScreener
              ? '조건에 맞는 종목이 없습니다'
              : '매핑된 종목이 없습니다'}
          </div>
          {isWatchlist && <div style={{ fontSize: '12px', marginTop: '4px' }}>종목 상세에서 관심종목을 추가해 보세요</div>}
          {isScreener && <div style={{ fontSize: '12px', marginTop: '4px' }}>필터 조건을 완화해 보세요</div>}
        </div>
      ) : (
        <div className="stock-table">
          {/* 테이블 헤더 */}
          <div className="stock-table-header">
            <SortHeader label="종목명" sortKey="stock_name" current={sortKey} dir={sortDir} onClick={handleSort} className="col-name" />
            <SortHeader label="점수" sortKey="total_score" current={sortKey} dir={sortDir} onClick={handleSort} className="col-score" />
            <SortHeader label="PER" sortKey="per" current={sortKey} dir={sortDir} onClick={handleSort} className="col-metric" />
            <SortHeader label="PBR" sortKey="pbr" current={sortKey} dir={sortDir} onClick={handleSort} className="col-metric" />
            <SortHeader label="ROE" sortKey="roe" current={sortKey} dir={sortDir} onClick={handleSort} className="col-metric" />
            {showExtraCols && (
              <>
                <SortHeader label="부채" sortKey="debt_ratio" current={sortKey} dir={sortDir} onClick={handleSort} className="col-metric" />
                <SortHeader label="배당" sortKey="div_yield" current={sortKey} dir={sortDir} onClick={handleSort} className="col-metric" />
              </>
            )}
            <SortHeader label="현재가" sortKey="close" current={sortKey} dir={sortDir} onClick={handleSort} className="col-price" />
            <SortHeader label="등락률" sortKey="change_pct" current={sortKey} dir={sortDir} onClick={handleSort} className="col-change" />
          </div>

          {/* 테이블 바디 */}
          {sorted.map((stock) => (
            <div
              key={stock.stock_code}
              className={`stock-table-row ${selectedStockCode === stock.stock_code ? 'selected' : ''}`}
              onClick={() => onStockSelect(stock.stock_code)}
            >
              <div className="col-name">
                <span className="stock-name">{stock.stock_name}</span>
                <span className="stock-code">{stock.stock_code}</span>
              </div>
              <div className="col-score">
                <span className={`score-value ${getScoreClass(stock.total_score)}`}>
                  {stock.total_score > 0 ? stock.total_score.toFixed(1) : '-'}
                </span>
              </div>
              <div className="col-metric">{formatMetric(stock.per)}</div>
              <div className="col-metric">{formatMetric(stock.pbr)}</div>
              <div className="col-metric">{stock.roe !== null ? `${stock.roe}%` : '-'}</div>
              {showExtraCols && (
                <>
                  <div className="col-metric">{stock.debt_ratio !== null ? `${stock.debt_ratio}%` : '-'}</div>
                  <div className="col-metric">{stock.div_yield !== null ? `${stock.div_yield}%` : '-'}</div>
                </>
              )}
              <div className="col-price">
                {stock.close > 0 ? stock.close.toLocaleString() : '-'}
              </div>
              <div className={`col-change ${stock.change_pct >= 0 ? 'change-up' : 'change-down'}`}>
                {stock.close > 0
                  ? `${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct.toFixed(2)}%`
                  : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// ── 정렬 헤더 컴포넌트 ──

function SortHeader({
  label, sortKey, current, dir, onClick, className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  className: string;
}) {
  const isActive = current === sortKey;
  return (
    <div
      className={`${className} sort-header ${isActive ? 'sort-active' : ''}`}
      onClick={() => onClick(sortKey)}
    >
      {label}
      {isActive && <span className="sort-arrow">{dir === 'asc' ? ' ▲' : ' ▼'}</span>}
    </div>
  );
}

// ── 유틸리티 ──

function formatMetric(val: number | null): string {
  if (val === null || val === undefined) return '-';
  return val.toFixed(2);
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}
