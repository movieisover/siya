import { useState, Component } from 'react';
import React from 'react';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';
import MobileThemeView from './MobileThemeView';
import MobileScreenerView from './MobileScreenerView';
import MobileWatchlistView from './MobileWatchlistView';
import MobileStockDetail from './MobileStockDetail';
import MobileInstallGuide from './MobileInstallGuide';
import DisclosureTab from '../stock-detail/DisclosureTab';
import HelpPage from '../common/HelpPage';
import type { AppMode } from '../../App';
import '../../mobile.css';

// 에러 바운더리 — 흰 화면 대신 에러 메시지 표시 (디버깅용)
class MobileErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#ef4444', background: '#0f1117', minHeight: '100vh', fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>시야 오류</div>
          <div>{this.state.error.message}</div>
          <div style={{ marginTop: 8, color: '#8b8fa3', whiteSpace: 'pre-wrap' }}>
            {this.state.error.stack?.slice(0, 600)}
          </div>
          <button
            style={{ marginTop: 20, padding: '10px 20px', background: '#4a9eff', color: 'white', border: 'none', borderRadius: 8, fontSize: 14 }}
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export type MobileTab = 'theme' | 'screener' | 'watchlist' | 'disclosure';

const TAB_MODE_MAP: Record<MobileTab, AppMode> = {
  theme:      'theme',
  screener:   'screener',
  watchlist:  'watchlist',
  disclosure: 'theme',
};

function MobileAppInner() {
  const [activeTab, setActiveTab] = useState<MobileTab>('theme');
  const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);
  const [selectedStockName, setSelectedStockName] = useState<string | undefined>(undefined);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const isStandalone = (() => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    } catch { return false; }
  })();
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [showInstall, setShowInstall] = useState(
    !isStandalone &&
    !localStorage.getItem('siya_install_dismissed') &&
    isMobileUA
  );

  function handleInstallDismiss() {
    localStorage.setItem('siya_install_dismissed', '1');
    setShowInstall(false);
  }

  function handleTabChange(tab: MobileTab) {
    setActiveTab(tab);
    setSelectedStockCode(null);
    setSelectedStockName(undefined);
  }

  function handleStockSelect(code: string, name?: string) {
    setSelectedStockCode(code);
    setSelectedStockName(name);
  }

  function handleBack() {
    setSelectedStockCode(null);
    setSelectedStockName(undefined);
  }

  const currentMode: AppMode = TAB_MODE_MAP[activeTab];

  if (showInstall) {
    return (
      <div className="mobile-app">
        <MobileInstallGuide onDismiss={handleInstallDismiss} />
      </div>
    );
  }

  return (
    <div className="mobile-app">
      {!selectedStockCode && (
        <MobileHeader
          onSearchOpen={() => {}}
          onHelpOpen={() => setShowHelp(true)}
        />
      )}

      <main className="mobile-main">
        {selectedStockCode ? (
          <MobileStockDetail
            stockCode={selectedStockCode}
            stockName={selectedStockName}
            mode={currentMode}
            selectedThemeId={selectedThemeId}
            onBack={handleBack}
          />
        ) : (
          <>
            {activeTab === 'theme' && (
              <MobileThemeView
                selectedStockCode={selectedStockCode}
                selectedThemeId={selectedThemeId}
                onThemeSelect={setSelectedThemeId}
                onStockSelect={handleStockSelect}
              />
            )}
            {activeTab === 'screener' && (
              <MobileScreenerView
                selectedStockCode={selectedStockCode}
                onStockSelect={handleStockSelect}
              />
            )}
            {activeTab === 'watchlist' && (
              <MobileWatchlistView
                selectedStockCode={selectedStockCode}
                onStockSelect={handleStockSelect}
              />
            )}
            {activeTab === 'disclosure' && (
              <div className="mobile-disclosure-wrap">
                <div className="mobile-list-header">공시사항</div>
                <DisclosureTab />
              </div>
            )}
          </>
        )}
      </main>

      {!selectedStockCode && (
        <MobileTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {showHelp && <HelpPage onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default function MobileApp() {
  return (
    <MobileErrorBoundary>
      <MobileAppInner />
    </MobileErrorBoundary>
  );
}
