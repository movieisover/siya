import { useState } from 'react';
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

export type MobileTab = 'theme' | 'screener' | 'watchlist' | 'disclosure';

const TAB_MODE_MAP: Record<MobileTab, AppMode> = {
  theme:      'theme',
  screener:   'screener',
  watchlist:  'watchlist',
  disclosure: 'theme',
};

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<MobileTab>('theme');
  const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);
  const [selectedStockName, setSelectedStockName] = useState<string | undefined>(undefined);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // 설치 유도: 아래 세 조건 모두 충족할 때만 표시
  // 1) 이미 standalone 모드(설치됨) → 표시 안함
  // 2) 이전에 "계속" 선택한 이력 → 표시 안함
  // 3) 모바일 UA이면서 iOS이거나 안드로이드일 때만 표시 (데스크톱 브라우저는 설치 불필요)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
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

  // ── 설치 유도 화면 ──
  if (showInstall) {
    return (
      <div className="mobile-app">
        <MobileInstallGuide onDismiss={handleInstallDismiss} />
      </div>
    );
  }

  // ── 주 화면 ──
  return (
    <div className="mobile-app">
      {/* 종목 상세일 때는 헤더 숨김 (상세 내부 뒤로가기 바 사용) */}
      {!selectedStockCode && (
        <MobileHeader
          onSearchOpen={() => {/* 검색 — 추후 구현 */}}
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

      {/* 종목 상세일 때는 탭바 숨김 */}
      {!selectedStockCode && (
        <MobileTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {showHelp && <HelpPage onClose={() => setShowHelp(false)} />}
    </div>
  );
}
