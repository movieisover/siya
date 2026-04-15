import { useEffect, useState, useMemo } from 'react';
import type { AppMode } from '../../App';
import type { Theme, ScreenerFilters } from '../../types/stock';
import { DEFAULT_SCREENER_FILTERS } from '../../types/stock';
import { supabase } from '../../lib/supabase';
import { useThemeAnalysis, type ThemeAnalysis } from '../../hooks/useThemeData';
import Tooltip from '../common/Tooltip';

interface LeftPanelProps {
  mode: AppMode;
  selectedThemeId: number | null;
  onThemeSelect: (id: number) => void;
  onFilterApply: (filters: ScreenerFilters) => void;
}

export default function LeftPanel({ mode, selectedThemeId, onThemeSelect, onFilterApply }: LeftPanelProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);

  const themeIds = useMemo(() => themes.map((t) => t.theme_id), [themes]);
  const { analyses, loading: analysisLoading } = useThemeAnalysis(themeIds);

  useEffect(() => {
    if (mode === 'theme') {
      loadThemes();
    }
  }, [mode]);

  async function loadThemes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('theme_name');

    if (!error && data) {
      setThemes(data as Theme[]);
    }
    setLoading(false);
  }

  if (mode === 'theme') {
    const grouped = groupByCategory(themes);

    return (
      <aside className="panel left-panel">
        <div className="section-title">테마 목록</div>
        {loading ? (
          <div className="empty-state">불러오는 중...</div>
        ) : (
          Object.entries(grouped).map(([category, categoryThemes]) => (
            <div key={category}>
              <div className="theme-category">{category}</div>
              {categoryThemes.map((theme) => (
                <ThemeCard
                  key={theme.theme_id}
                  theme={theme}
                  selected={selectedThemeId === theme.theme_id}
                  analysis={analyses[theme.theme_id]}
                  analysisLoading={analysisLoading}
                  onClick={() => onThemeSelect(theme.theme_id)}
                />
              ))}
            </div>
          ))
        )}
      </aside>
    );
  }

  // 관심종목 모드
  if (mode === 'watchlist') {
    return (
      <aside className="panel left-panel">
        <div className="section-title">관심종목</div>
        <div style={{ padding: '16px' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
            종목 상세 화면에서 관심종목을 추가/제거할 수 있습니다.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '8px' }}>
            메모를 남겨 투자 아이디어를 기록하세요.
          </p>
        </div>
      </aside>
    );
  }

  // 스크리너 모드 — 필터 패널
  return (
    <aside className="panel left-panel">
      <div className="section-title">필터 설정</div>
      <ScreenerFilterPanel onApply={onFilterApply} />
    </aside>
  );
}

// ── 스크리너 필터 패널 ──

function ScreenerFilterPanel({ onApply }: { onApply: (f: ScreenerFilters) => void }) {
  const [filters, setFilters] = useState<ScreenerFilters>({ ...DEFAULT_SCREENER_FILTERS });

  // 최초 렌더링 시 기본 필터로 자동 적용
  useEffect(() => {
    onApply({ ...DEFAULT_SCREENER_FILTERS });
  }, []);

  function handleApply() {
    onApply({ ...filters });
  }

  function handleReset() {
    const defaults = { ...DEFAULT_SCREENER_FILTERS };
    setFilters(defaults);
    onApply(defaults);
  }

  return (
    <div className="filter-panel">
      {/* 시장 선택 */}
      <div className="filter-group">
        <div className="filter-label">시장</div>
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

      {/* PER */}
      <FilterSlider
        label="PER"
        value={filters.perMax}
        min={1}
        max={50}
        step={1}
        suffix=""
        displayPrefix="≤ "
        onChange={(v) => setFilters({ ...filters, perMax: v })}
      />

      {/* PBR */}
      <FilterSlider
        label="PBR"
        value={filters.pbrMax}
        min={0.1}
        max={5}
        step={0.1}
        suffix=""
        displayPrefix="≤ "
        onChange={(v) => setFilters({ ...filters, pbrMax: v })}
      />

      {/* ROE */}
      <FilterSlider
        label="ROE"
        value={filters.roeMin}
        min={0}
        max={30}
        step={1}
        suffix="%"
        displayPrefix="≥ "
        onChange={(v) => setFilters({ ...filters, roeMin: v })}
      />

      {/* 부채비율 */}
      <FilterSlider
        label="부채비율"
        value={filters.debtMax}
        min={10}
        max={300}
        step={10}
        suffix="%"
        displayPrefix="≤ "
        onChange={(v) => setFilters({ ...filters, debtMax: v })}
      />

      {/* 배당수익률 */}
      <FilterSlider
        label="배당수익률"
        value={filters.divYieldMin}
        min={0}
        max={10}
        step={0.5}
        suffix="%"
        displayPrefix="≥ "
        onChange={(v) => setFilters({ ...filters, divYieldMin: v })}
      />

      {/* 버튼 */}
      <div className="filter-actions">
        <button className="filter-apply-btn" onClick={handleApply}>
          필터 적용
        </button>
        <button className="filter-reset-btn" onClick={handleReset}>
          초기화
        </button>
      </div>
    </div>
  );
}

// ── 슬라이더 컴포넌트 ──

function FilterSlider({
  label, value, min, max, step, suffix, displayPrefix, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  displayPrefix: string;
  onChange: (v: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="filter-group">
      <div className="filter-label">
        <span>{label}</span>
        <span className="filter-value">{displayPrefix}{step < 1 ? value.toFixed(1) : value}{suffix}</span>
      </div>
      <input
        type="range"
        className="filter-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ background: `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-border) ${percent}%)` }}
      />
    </div>
  );
}

// ── 테마 카드 컴포넌트 ──

function ThemeCard({
  theme, selected, analysis, analysisLoading, onClick,
}: {
  theme: Theme;
  selected: boolean;
  analysis?: ThemeAnalysis;
  analysisLoading: boolean;
  onClick: () => void;
}) {
  const reliability = analysis?.reliability;
  const timing = analysis?.timing;
  const comboLabel = reliability && timing ? getComboLabel(reliability.grade, timing.signal) : null;

  return (
    <div
      className={`theme-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="theme-card-header">
        <span className="theme-name">{theme.theme_name}</span>
        {reliability && (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span className={`badge badge-${reliability.grade.toLowerCase()}`}>
              {reliability.grade}
            </span>
            <Tooltip text={`테마의 힘을 나타내는 지표입니다.
기관/외국인이 매집하고, 거래량이 급증하며,
테마 내 종목들이 함께 오르면 신뢰도가 높습니다.

거래량(30) + 수급(50) + 동반상승(20) = 100점
HIGH: 70~100 / MEDIUM: 40~69 / LOW: 0~39
현재 ${reliability.total_score}점

데이터: 한국투자증권 API, 매일 16:00 자동 갱신`} />
          </span>
        )}
      </div>
      <div className="theme-meta">
        {analysisLoading ? (
          <span>분석 중...</span>
        ) : reliability && timing ? (
          <>
            <span className={`theme-timing timing-${timing.signal}`}>
              {getTimingLabel(timing.signal)}
            </span>
            <span className="theme-rsi-badge">RSI {timing.avg_rsi.toFixed(0)}</span>
            <span className="theme-rsi-badge">GC {timing.golden_cross_ratio.toFixed(0)}%</span>
            <Tooltip text={`지금 이 테마에 진입해도 되는지 판단하는 지표입니다.
RSI(과열도)와 MACD(추세)를 조합해 판단합니다.

🟢 진입 적기: 아직 과열 아니고 상승 추세
🟡 관망: 추세가 불명확, 지켜보기
🔴 과열주의: 과매수 구간이거나 하락 추세

RSI 70↑ 과열 / 30~70 중립 / 30↓ 저점
GC 60%↑ 상승추세 / 40~60% 혼조 / 40%↓ 하락

데이터: 자체 계산, 매일 16:00 자동 갱신`} />
          </>
        ) : reliability ? (
          <span style={{ color: 'var(--color-text-secondary)' }}>타이밍 데이터 없음</span>
        ) : (
          <span>데이터 없음</span>
        )}
      </div>
      {comboLabel && !analysisLoading && (
        <div className="theme-combo">
          {comboLabel}
        </div>
      )}
    </div>
  );
}

// ── 유틸리티 함수 ──

function groupByCategory(themes: Theme[]): Record<string, Theme[]> {
  const result: Record<string, Theme[]> = {};
  for (const theme of themes) {
    const cat = theme.category || '기타';
    if (!result[cat]) result[cat] = [];
    result[cat].push(theme);
  }
  return result;
}

function getTimingLabel(signal: 'green' | 'yellow' | 'red'): string {
  switch (signal) {
    case 'green': return '🟢 진입 적기';
    case 'yellow': return '🟡 관망';
    case 'red': return '🔴 과열주의';
  }
}

function getComboLabel(
  grade: 'HIGH' | 'MEDIUM' | 'LOW',
  signal: 'green' | 'yellow' | 'red'
): string {
  if (grade === 'HIGH' && signal === 'green') return '✨ 강한 테마 + 좋은 타이밍';
  if (grade === 'HIGH' && signal === 'red') return '⚠️ 강한 테마이나 과열 주의';
  if (grade === 'HIGH' && signal === 'yellow') return '🔍 강한 테마, 추세 혼조';
  if (grade === 'MEDIUM' && signal === 'green') return '📈 보통 테마 + 좋은 타이밍';
  if (grade === 'MEDIUM' && signal === 'red') return '⚠️ 보통 테마 + 과열 주의';
  if (grade === 'MEDIUM' && signal === 'yellow') return '🔍 보통 테마, 지켜보기';
  if (grade === 'LOW' && signal === 'green') return '📈 추세 좋으나 테마 힘 약함';
  if (grade === 'LOW' && signal === 'red') return '💤 약한 테마 + 나쁜 타이밍';
  return '🔍 약한 테마, 지켜보기';
}
