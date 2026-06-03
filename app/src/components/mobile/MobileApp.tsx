import { useState, useEffect } from 'react';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';
import MobileThemeView from './MobileThemeView';
import MobileScreenerView from './MobileScreenerView';
import MobileWatchlistView from './MobileWatchlistView';
import MobileStockDetail from './MobileStockDetail';
import MobileInstallGuide, { type BeforeInstallPromptEvent } from './MobileInstallGuide';
import MobileSearch from './MobileSearch';
import DisclosureTab from '../stock-detail/DisclosureTab';
import HelpPage from '../common/HelpPage';
import { useAuth } from '../auth/AuthProvider';
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
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<MobileTab>('theme');
  const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);
  const [selectedStockName, setSelectedStockName] = useState<string | undefined>(undefined);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // 설치 유도: 이미 standalone(설치됨) 또는 이전에 "계속" 선택한 경우 스킵
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const [showInstall, setShowInstall] = useState(
    !isStandalone && !localStorage.getItem('siya_install_dismissed')
  );

  // PWA 설치 프롬프트 — main.tsx에서 전역 캡처한 값을 마운트 시 읽고, 늦게 오면 커스텀 이벤트로 갱신
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    (window.__siyaInstallPrompt as BeforeInstallPromptEvent) ?? null
  );
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onAvailable = () => {
      setInstallPrompt((window.__siyaInstallPrompt as BeforeInstallPromptEvent) ?? null);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('siya-install-available', onAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('siya-install-available', onAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // 설치 버튼 노출 조건: standalone(설치됨)이 아니고, 안드로이드 설치가능(프롬프트 있음) 또는 iOS(수동 안내)
  const canInstall = !isStandalone && (installPrompt !== null || isIOS);

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
        <MobileInstallGuide
          installPrompt={installPrompt}
          isIOS={isIOS}
          onDismiss={handleInstallDismiss}
          onInstalled={() => setInstallPrompt(null)}
        />
      </div>
    );
  }

  // ── 주 화면 ──
  return (
    <div className="mobile-app">
      {/* 종목 상세일 때는 헤더 숨김 (상세 내부 뒤로가기 바 사용) */}
      {!selectedStockCode && (
        <MobileHeader
          onSearchOpen={() => setShowSearch(true)}
          onHelpOpen={() => setShowHelp(true)}
          onSignOut={signOut}
          onInstallOpen={canInstall ? () => setShowInstall(true) : undefined}
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
      {showSearch && (
        <MobileSearch
          onSelect={handleStockSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
