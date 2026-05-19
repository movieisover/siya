import { useState, useMemo, useEffect } from 'react';
import type { AppMode } from '../../App';
import type { ScreenerFilters } from '../../types/stock';
import { DEFAULT_SCREENER_FILTERS } from '../../types/stock';
import { useThemeAnalysis, type ThemeAnalysis } from '../../hooks/useThemeData';
import type { useUserThemes } from '../../hooks/useUserThemes';
import Tooltip from '../common/Tooltip';

interface LeftPanelProps {
  mode: AppMode;
  selectedThemeId: number | null;
  onThemeSelect: (id: number) => void;
  onFilterApply: (filters: ScreenerFilters) => void;
  editMode: boolean;
  onEditModeToggle: () => void;
  userThemes: ReturnType<typeof useUserThemes>;
}

export default function LeftPanel({ mode, selectedThemeId, onThemeSelect, onFilterApply, editMode, onEditModeToggle, userThemes }: LeftPanelProps) {
  const [newThemeName, setNewThemeName] = useState('');
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const themeIds = useMemo(() => userThemes.themes.map((t) => t.id), [userThemes.themes]);
  const { analyses, loading: analysisLoading, reload: reloadAnalysis } = useThemeAnalysis(themeIds);
  const [prevEditMode, setPrevEditMode] = useState(false);

  // 편집 모드 해제 시 분석 재계산
  useEffect(() => {
    if (prevEditMode && !editMode) {
      reloadAnalysis();
    }
    setPrevEditMode(editMode);
  }, [editMode]);

  // 테마 추가
  async function handleAddTheme() {
    const name = newThemeName.trim();
    if (!name) return;
    await userThemes.addTheme(name);
    setNewThemeName('');
  }

  // 테마 삭제
  async function handleDeleteTheme(themeId: number, themeName: string) {
    if (!confirm(`"${themeName}" 테마를 삭제하시겠습니까?\n매핑된 종목도 함께 삭제됩니다.`)) return;
    await userThemes.deleteTheme(themeId);
    if (selectedThemeId === themeId) {
      onThemeSelect(0); // 선택 해제
    }
  }

  // 이름 변경 시작
  function startRename(themeId: number, currentName: string) {
    setRenamingId(themeId);
    setRenameValue(currentName);
  }

  // 이름 변경 저장
  async function handleRename(themeId: number) {
    const name = renameValue.trim();
    if (name && name !== '') {
      await userThemes.renameTheme(themeId, name);
    }
    setRenamingId(null);
    setRenameValue('');
  }

  if (mode === 'theme') {
    return (
      <aside className="panel left-panel">
        <div className="section-title left-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>테마 목록 ({userThemes.themes.length})</span>
          <button
            className={`edit-mode-btn ${editMode ? 'active' : ''}`}
            onClick={onEditModeToggle}
          >
            {editMode ? '✓ 편집 완료' : '테마/종목 편집'}
          </button>
        </div>

        {/* 편집 모드: 테마 추가 */}
        {editMode && (
          <div className="theme-add-row">
            <input
              type="text"
              className="theme-add-input"
              placeholder="새 테마 이름"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
            />
            <button className="theme-add-btn" onClick={handleAddTheme} disabled={!newThemeName.trim()}>
              추가
            </button>
          </div>
        )}

        {userThemes.loading ? (
          <div className="empty-state">불러오는 중...</div>
        ) : (
          userThemes.themes.map((theme) => (
            editMode ? (
              <div key={theme.id} className={`theme-card ${selectedThemeId === theme.id ? 'selected' : ''}`}>
                <div className="theme-card-header" style={{ gap: '6px' }}>
                  {renamingId === theme.id ? (
                    <input
                      type="text"
                      className="theme-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(theme.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => handleRename(theme.id)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="theme-name"
                      onClick={() => onThemeSelect(theme.id)}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      {theme.theme_name}
                    </span>
                  )}
                  <button
                    className="theme-edit-icon-btn"
                    onClick={() => startRename(theme.id, theme.theme_name)}
                    title="이름 변경"
                  >
                    ✎
                  </button>
                  <button
                    className="theme-edit-icon-btn theme-delete-btn"
                    onClick={() => handleDeleteTheme(theme.id, theme.theme_name)}
                    title="테마 삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <ThemeCard
                key={theme.id}
                themeName={theme.theme_name}
                selected={selectedThemeId === theme.id}
                analysis={analyses[theme.id]}
                analysisLoading={analysisLoading}
                onClick={() => onThemeSelect(theme.id)}
              />
            )
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
      <FilterSlider label="PER" value={filters.perMax} min={1} max={50} step={1} suffix="" displayPrefix="≤ " onChange={(v) => setFilters({ ...filters, perMax: v })} />
      <FilterSlider label="PBR" value={filters.pbrMax} min={0.1} max={5} step={0.1} suffix="" displayPrefix="≤ " onChange={(v) => setFilters({ ...filters, pbrMax: v })} />
      <FilterSlider label="ROE" value={filters.roeMin} min={0} max={30} step={1} suffix="%" displayPrefix="≥ " onChange={(v) => setFilters({ ...filters, roeMin: v })} />
      <FilterSlider label="부채비율" value={filters.debtMax} min={10} max={300} step={10} suffix="%" displayPrefix="≤ " onChange={(v) => setFilters({ ...filters, debtMax: v })} />
      <FilterSlider label="배당수익률" value={filters.divYieldMin} min={0} max={10} step={0.5} suffix="%" displayPrefix="≥ " onChange={(v) => setFilters({ ...filters, divYieldMin: v })} />
      <div className="filter-actions">
        <button className="filter-apply-btn" onClick={handleApply}>필터 적용</button>
        <button className="filter-reset-btn" onClick={handleReset}>초기화</button>
      </div>
    </div>
  );
}

// ── 슬라이더 컴포넌트 ──

function FilterSlider({
  label, value, min, max, step, suffix, displayPrefix, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; suffix: string; displayPrefix: string; onChange: (v: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="filter-group">
      <div className="filter-label">
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

// ── 테마 카드 컴포넌트 ──

function ThemeCard({
  themeName, selected, analysis, analysisLoading, onClick,
}: {
  themeName: string;
  selected: boolean;
  analysis?: ThemeAnalysis;
  analysisLoading: boolean;
  onClick: () => void;
}) {
  const reliability = analysis?.reliability;
  const timing = analysis?.timing;
  const comboLabel = reliability && timing ? getComboLabel(reliability.grade, timing.signal) : null;

  return (
    <div className={`theme-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="theme-card-header">
        <span className="theme-name">{themeName}</span>
        {reliability && (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span className={`badge badge-${reliability.grade.toLowerCase()}`}>
              {reliability.grade}
            </span>
            <Tooltip text={`테마의 힘을 나타내는 지표입니다.\n기관/외국인이 매집하고, 거래량이 급증하며,\n테마 내 종목들이 함께 오르면 신뢰도가 높습니다.\n\n거래량(30) + 수급(50) + 동반상승(20) = 100점\nHIGH: 70~100 / MEDIUM: 40~69 / LOW: 0~39\n현재 ${reliability.total_score}점\n\n데이터: 한국투자증권 API, 매일 16:00 자동 갱신`} />
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
            <Tooltip text={`지금 이 테마에 진입해도 되는지 판단하는 지표입니다.\nRSI(과열도)와 MACD(추세)를 조합해 판단합니다.\n\n🟢 진입 적기: 과열 아님 + 상승 추세\n🟡 관망: 과열은 아니지만 추세가 안 좋음 — 전환 기다리기\n🔴 과열 주의: 과매수 구간 — 조심\n\nRSI: 테마 내 종목 평균 과열도 (70↑ 과열 / 30↓ 저점)\nMACD: 테마 내 종목 중 상승 전환 신호 비율\n\n데이터: 자체 계산, 매일 16:00 자동 갱신`} />
          </>
        ) : reliability ? (
          <span style={{ color: 'var(--color-text-secondary)' }}>타이밍 데이터 없음</span>
        ) : (
          <span>데이터 없음</span>
        )}
      </div>
      {comboLabel && !analysisLoading && (
        <div className="theme-combo">{comboLabel}</div>
      )}
    </div>
  );
}

// ── 유틸리티 함수 ──

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
