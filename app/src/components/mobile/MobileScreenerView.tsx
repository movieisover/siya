import { useState, useEffect } from 'react';
import { useScreenerStocks } from '../../hooks/useScreenerStocks';
import { DEFAULT_SCREENER_FILTERS } from '../../types/stock';
import type { ScreenerFilters } from '../../types/stock';
import MobileStockList from './MobileStockList';

interface MobileScreenerViewProps {
  selectedStockCode: string | null;
  onStockSelect: (code: string, name?: string) => void;
}

export default function MobileScreenerView({ selectedStockCode, onStockSelect }: MobileScreenerViewProps) {
  const [filters, setFilters] = useState<ScreenerFilters>({ ...DEFAULT_SCREENER_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<ScreenerFilters>({ ...DEFAULT_SCREENER_FILTERS });
  const [showFilter, setShowFilter] = useState(false);
  const { stocks, loading, totalCount } = useScreenerStocks(appliedFilters);

  function handleApply() {
    setAppliedFilters({ ...filters });
    setShowFilter(false);
  }

  function handleReset() {
    const d = { ...DEFAULT_SCREENER_FILTERS };
    setFilters(d);
    setAppliedFilters(d);
    // showFilter는 닫지 않음 — 초기화된 필터 화면을 그대로 보여준다
  }

  return (
    <div className="mobile-screener-view">
      {/* 필터 요약 바 */}
      <div className="mobile-filter-bar">
        <span className="mobile-filter-summary">
          PER ≤ {appliedFilters.perMax} · PBR ≤ {appliedFilters.pbrMax} · ROE ≥ {appliedFilters.roeMin}% · 부채 ≤ {appliedFilters.debtMax}% · 배당 ≥ {appliedFilters.divYieldMin}%
        </span>
        <button className="mobile-filter-open-btn" onClick={() => setShowFilter(true)}>
          필터 조정 ▲
        </button>
      </div>

      {/* 종목 리스트 */}
        <MobileStockList
        stocks={stocks}
        loading={loading}
        title={`필터 결과`}
        selectedCode={selectedStockCode}
        onStockSelect={(code) => {
          const name = stocks.find(s => s.stock_code === code)?.stock_name;
          onStockSelect(code, name);
        }}
        emptyMessage="조건에 맞는 종목이 없습니다. 필터를 완화해보세요."
      />

      {/* 필터 바텀시트 */}
      {showFilter && (
        <div className="mobile-modal-overlay" onClick={() => setShowFilter(false)}>
          <div className="mobile-modal mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <span>필터 설정</span>
              <button className="mobile-modal-close" onClick={() => setShowFilter(false)}>✕</button>
            </div>

            <div className="mobile-filter-body">
              {/* 시장 선택 */}
              <div className="mobile-filter-group">
                <div className="mobile-filter-label">시장</div>
                <div className="filter-market-btns">
                  {(['ALL', 'KOSPI', 'KOSDAQ'] as const).map((m) => (
                    <button
                      key={m}
                      className={`filter-market-btn ${filters.market === m ? 'active' : ''}`}
                      onClick={() => setFilters({ ...filters, market: m })}
                    >
                      {m === 'ALL' ? '전체' : m}
                    </button>
                  ))}
                </div>
              </div>

              <MobileFilterSlider label="PER" value={filters.perMax} min={1} max={50} step={1}
                displayPrefix="≤ " suffix="" onChange={(v) => setFilters({ ...filters, perMax: v })} />
              <MobileFilterSlider label="PBR" value={filters.pbrMax} min={0.1} max={5} step={0.1}
                displayPrefix="≤ " suffix="" onChange={(v) => setFilters({ ...filters, pbrMax: v })} />
              <MobileFilterSlider label="ROE" value={filters.roeMin} min={0} max={30} step={1}
                displayPrefix="≥ " suffix="%" onChange={(v) => setFilters({ ...filters, roeMin: v })} />
              <MobileFilterSlider label="부채비율" value={filters.debtMax} min={10} max={300} step={10}
                displayPrefix="≤ " suffix="%" onChange={(v) => setFilters({ ...filters, debtMax: v })} />
              <MobileFilterSlider label="배당수익률" value={filters.divYieldMin} min={0} max={10} step={0.5}
                displayPrefix="≥ " suffix="%" onChange={(v) => setFilters({ ...filters, divYieldMin: v })} />
            </div>

            <div className="mobile-filter-actions">
              <button className="mobile-filter-reset-btn" onClick={handleReset}>초기화</button>
              <button className="mobile-filter-apply-btn" onClick={handleApply}>
                필터 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileFilterSlider({ label, value, min, max, step, displayPrefix, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  displayPrefix: string; suffix: string; onChange: (v: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="mobile-filter-group">
      <div className="mobile-filter-label">
        <span>{label}</span>
        <span className="filter-value">{displayPrefix}{step < 1 ? value.toFixed(1) : value}{suffix}</span>
      </div>
      <input
        type="range" className="filter-slider" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ background: `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-border) ${percent}%)` }}
      />
    </div>
  );
}
