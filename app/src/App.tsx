import { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import LoginPage from './components/auth/LoginPage';
import Header from './components/layout/Header';
import LeftPanel from './components/layout/LeftPanel';
import CenterPanel from './components/layout/CenterPanel';
import RightPanel from './components/layout/RightPanel';
import HelpPage from './components/common/HelpPage';
import { useWatchlist } from './hooks/useWatchlist';
import type { ScreenerFilters } from './types/stock';
import './App.css';

export type AppMode = 'theme' | 'screener' | 'watchlist';

function AppContent() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AppMode>('theme');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);
  const [screenerFilters, setScreenerFilters] = useState<ScreenerFilters | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const watchlist = useWatchlist();

  // 관심종목 토글
  function handleWatchToggle(code: string, currentlyWatched: boolean) {
    if (currentlyWatched) {
      watchlist.remove(code);
    } else {
      watchlist.add(code);
    }
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="app">
        <div className="empty-state" style={{ height: '100vh' }}>
          <div className="empty-state-icon">⏳</div>
          <div>시야 로딩 중...</div>
        </div>
      </div>
    );
  }

  // 미로그인 → 로그인 화면
  if (!user) {
    return <LoginPage />;
  }

  // 로그인 완료 → 메인 화면
  return (
    <div className="app">
      <Header
        mode={mode}
        onModeChange={setMode}
        onStockSelect={setSelectedStockCode}
        watchlistCount={watchlist.items.length}
        onHelpOpen={() => setShowHelp(true)}
      />
      <div className="app-body">
        <LeftPanel
          mode={mode}
          selectedThemeId={selectedThemeId}
          onThemeSelect={setSelectedThemeId}
          onFilterApply={setScreenerFilters}
        />
        <CenterPanel
          mode={mode}
          selectedThemeId={selectedThemeId}
          selectedStockCode={selectedStockCode}
          screenerFilters={screenerFilters}
          watchlistCodes={watchlist.codes}
          onStockSelect={setSelectedStockCode}
        />
        <RightPanel
          stockCode={selectedStockCode}
          mode={mode}
          selectedThemeId={selectedThemeId}
          isWatched={selectedStockCode ? watchlist.isWatched(selectedStockCode) : false}
          watchMemo={selectedStockCode ? watchlist.getMemo(selectedStockCode) : null}
          onWatchToggle={handleWatchToggle}
          onMemoUpdate={watchlist.updateMemo}
        />
      </div>
      {showHelp && <HelpPage onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
