import { useMemo } from 'react';
import { useThemeAnalysis, useThemeStocks } from '../../hooks/useThemeData';
import { useUserThemes } from '../../hooks/useUserThemes';
import { useAuth } from '../auth/AuthProvider';
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
  const { analyses, loading: analysisLoading } = useThemeAnalysis(themeIds);
  const { stocks, loading: stocksLoading } = useThemeStocks(selectedThemeId);

  const selectedTheme = userThemes.themes.find((t) => t.id === selectedThemeId);

  // 테마 선택 시 종목 리스트 표시
  if (selectedThemeId && selectedTheme) {
    return (
      <div className="mobile-theme-view">
        {/* 뒤로가기 헤더 */}
        <div className="mobile-back-bar">
          <button className="mobile-back-btn" onClick={() => onThemeSelect(null)}>
            ← 테마 목록
          </button>
          <span className="mobile-back-title">{selectedTheme.theme_name}</span>
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
          emptyMessage="이 테마에 매핑된 종목이 없습니다"
        />
      </div>
    );
  }

  // 테마 목록
  return (
    <div className="mobile-theme-view">
      <div className="mobile-list-header">
        <span>테마 목록</span>
        <span className="mobile-list-count">{userThemes.themes.length}개</span>
      </div>

      {userThemes.loading ? (
        <div className="mobile-list-loading">⏳ 불러오는 중...</div>
      ) : (
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
                    <span className={`badge badge-${reliability.grade.toLowerCase()}`}>
                      {reliability.grade}
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
