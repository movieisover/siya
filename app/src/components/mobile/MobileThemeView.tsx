import { useMemo, useState, useEffect, useRef } from 'react';
import { useThemeAnalysis, useThemeStocks } from '../../hooks/useThemeData';
import { useUserThemes } from '../../hooks/useUserThemes';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import Tooltip from '../common/Tooltip';
import MobileStockList from './MobileStockList';

interface MobileThemeViewProps {
  selectedStockCode: string | null;
  selectedThemeId: number | null;
  onThemeSelect: (id: number | null) => void;
  onStockSelect: (code: string, name?: string) => void;
}

export default function MobileThemeView({ selectedStockCode, selectedThemeId, onThemeSelect, onStockSelect }: MobileThemeViewProps) {
  const { user } = useAuth();
  const userThemes = useUserThemes(user?.id ?? null);

  const themeIds = useMemo(() => userThemes.themes.map((t) => t.id), [userThemes.themes]);
  const { analyses, loading: analysisLoading, reload: reloadAnalysis } = useThemeAnalysis(themeIds);
  const { stocks, loading: stocksLoading } = useThemeStocks(selectedThemeId);

  // 테마 목록 편집
  const [editMode, setEditMode] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 테마 안 종목 편집
  const [stockEdit, setStockEdit] = useState(false);
  const stocksDirty = useRef(false);

  const selectedTheme = userThemes.themes.find((t) => t.id === selectedThemeId);

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
  }

  // 테마 이름 변경 저장
  async function handleRename(themeId: number) {
    const name = renameValue.trim();
    if (name) {
      await userThemes.renameTheme(themeId, name);
    }
    setRenamingId(null);
    setRenameValue('');
  }

  // 테마에 종목 추가
  async function handleAddStock(code: string) {
    if (!selectedThemeId) return;
    await userThemes.addStock(selectedThemeId, code);
    stocksDirty.current = true;
    window.dispatchEvent(new Event('theme-stocks-changed'));
  }

  // 테마에서 종목 제거
  async function handleRemoveStock(code: string) {
    if (!selectedThemeId) return;
    await userThemes.removeStock(selectedThemeId, code);
    stocksDirty.current = true;
    window.dispatchEvent(new Event('theme-stocks-changed'));
  }

  // 테마 목록으로 돌아가기 (종목 편집했으면 분석 재계산)
  function handleBackToThemes() {
    setStockEdit(false);
    if (stocksDirty.current) {
      stocksDirty.current = false;
      reloadAnalysis();
    }
    onThemeSelect(null);
  }

  // 테마 선택 시 종목 리스트 표시
  if (selectedThemeId && selectedTheme) {
    return (
      <div className="mobile-theme-view">
        {/* 뒤로가기 헤더 + 종목 편집 토글 */}
        <div className="mobile-back-bar">
          <button className="mobile-back-btn" onClick={handleBackToThemes}>
            ← 테마 목록
          </button>
          <span className="mobile-back-title">{selectedTheme.theme_name}</span>
          <button
            className={`mobile-theme-edit-btn ${stockEdit ? 'active' : ''}`}
            onClick={() => setStockEdit(!stockEdit)}
            style={{ marginLeft: 'auto' }}
          >
            {stockEdit ? '완료' : '종목 편집'}
          </button>
        </div>

        <MobileStockList
          stocks={stocks}
          loading={stocksLoading}
          title={selectedTheme.theme_name}
          selectedCode={selectedStockCode}
          onStockSelect={(code) => {
            const name = stocks.find(s => s.stock_code === code)?.stock_name;
            onStockSelect(code, name);
          }}
          emptyMessage={stockEdit ? '아래에서 종목을 검색해 추가하세요' : '이 테마에 매핑된 종목이 없습니다'}
          editMode={stockEdit}
          onRemoveStock={handleRemoveStock}
          addBar={stockEdit ? (
            <StockAddSearch
              existingCodes={stocks.map((s) => s.stock_code)}
              onAdd={handleAddStock}
            />
          ) : null}
        />
      </div>
    );
  }

  // 테마 목록
  return (
    <div className="mobile-theme-view">
      <div className="mobile-list-header">
        <span>테마 목록</span>
        <span className="mobile-list-header-right">
          <span className="mobile-list-count">{userThemes.themes.length}개</span>
          <button
            className={`mobile-theme-edit-btn ${editMode ? 'active' : ''}`}
            onClick={() => { setEditMode(!editMode); setRenamingId(null); }}
          >
            {editMode ? '완료' : '편집'}
          </button>
        </span>
      </div>

      {/* 편집 모드: 새 테마 추가 */}
      {editMode && (
        <div className="mobile-theme-add-row">
          <input
            type="text"
            className="mobile-theme-add-input"
            placeholder="새 테마 이름"
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
          />
          <button
            className="mobile-theme-add-btn"
            onClick={handleAddTheme}
            disabled={!newThemeName.trim()}
          >
            추가
          </button>
        </div>
      )}

      {userThemes.loading ? (
        <div className="mobile-list-loading">⏳ 불러오는 중...</div>
      ) : editMode ? (
        /* ── 편집 모드: 이름변경 / 삭제 ── */
        <div className="mobile-theme-cards">
          {userThemes.themes.map((theme) => (
            <div key={theme.id} className="mobile-theme-edit-card">
              {renamingId === theme.id ? (
                <input
                  type="text"
                  className="mobile-theme-rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(theme.id);
                    if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                  }}
                  onBlur={() => handleRename(theme.id)}
                  autoFocus
                />
              ) : (
                <span className="mobile-theme-edit-name">{theme.theme_name}</span>
              )}
              <button
                className="mobile-theme-edit-icon"
                onClick={() => { setRenamingId(theme.id); setRenameValue(theme.theme_name); }}
                aria-label="이름 변경"
              >
                ✎
              </button>
              <button
                className="mobile-theme-edit-icon mobile-theme-delete"
                onClick={() => handleDeleteTheme(theme.id, theme.theme_name)}
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* ── 일반 모드: 분석 카드 ── */
        <div className="mobile-theme-cards">
          {userThemes.themes.map((theme) => {
            const analysis = analyses[theme.id];
            const reliability = analysis?.reliability;
            const timing = analysis?.timing;

            return (
              <div
                key={theme.id}
                className="mobile-theme-card"
                onClick={() => onThemeSelect(theme.id)}
              >
                <div className="mobile-theme-card-row">
                  <span className="mobile-theme-name">{theme.theme_name}</span>
                  {reliability && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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

                <div className="mobile-theme-card-meta">
                  {analysisLoading ? (
                    <span className="mobile-theme-loading">분석 중...</span>
                  ) : timing ? (
                    <>
                      <span className={`theme-timing timing-${timing.signal}`}>
                        {getTimingLabel(timing.signal)}
                      </span>
                      <span className="theme-rsi-badge">RSI {timing.avg_rsi.toFixed(0)}</span>
                      <span className="theme-rsi-badge">GC {timing.golden_cross_ratio.toFixed(0)}%</span>
                      <Tooltip text={`지금 이 테마에 진입해도 되는지 판단하는 지표입니다.
RSI(과열도)와 MACD(추세)를 조합해 판단합니다.

🟢 진입 적기: 과열 아님 + 상승 추세
🟡 관망: 과열은 아니지만 추세가 안 좋음 — 전환 기다리기
🔴 과열 주의: 과매수 구간 — 조심

RSI: 테마 내 종목 평균 과열도 (70↑ 과열 / 30↓ 저점)
MACD: 테마 내 종목 중 상승 전환 신호 비율

데이터: 자체 계산, 매일 16:00 자동 갱신`} />
                    </>
                  ) : (
                    <span className="mobile-theme-no-data">데이터 없음</span>
                  )}
                </div>

                {reliability && timing && (
                  <div className="theme-combo">{getComboLabel(reliability.grade, timing.signal)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 종목 추가 검색바 (테마 종목 편집 모드) ──

function StockAddSearch({ existingCodes, onAdd }: {
  existingCodes: string[];
  onAdd: (code: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ stock_code: string; stock_name: string; market: string }>>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('stocks')
        .select('stock_code, stock_name, market')
        .or(`stock_name.ilike.%${q}%,stock_code.ilike.%${q}%`)
        .eq('is_active', true)
        .order('stock_name');
      setResults(data || []);
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return (
    <div className="mobile-stock-add">
      <input
        className="mobile-stock-add-input"
        type="text"
        placeholder="추가할 종목 검색 (2글자 이상)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim().length >= 2 && (
        <div className="mobile-stock-add-results">
          {results.length === 0 ? (
            <div className="mobile-stock-add-empty">검색 결과 없음</div>
          ) : (
            results.map((r) => {
              const added = existingCodes.includes(r.stock_code);
              return (
                <button
                  key={r.stock_code}
                  className="mobile-stock-add-item"
                  disabled={added}
                  onClick={() => { if (!added) onAdd(r.stock_code); }}
                >
                  <span className="mobile-stock-add-name">{r.stock_name}</span>
                  <span className="mobile-stock-add-code">{r.stock_code}</span>
                  <span className="mobile-stock-add-status">{added ? '✓ 추가됨' : '+ 추가'}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function getTimingLabel(signal: 'green' | 'yellow' | 'red'): string {
  switch (signal) {
    case 'green': return '🟢 진입 적기';
    case 'yellow': return '🟡 관망';
    case 'red': return '🔴 과열주의';
  }
}

function getComboLabel(grade: 'HIGH' | 'MEDIUM' | 'LOW', signal: 'green' | 'yellow' | 'red'): string {
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
