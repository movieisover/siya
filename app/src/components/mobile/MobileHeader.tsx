import { useAuth } from '../auth/AuthProvider';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

interface MobileHeaderProps {
  onSearchOpen: () => void;
  onHelpOpen: () => void;
}

export default function MobileHeader({ onSearchOpen, onHelpOpen }: MobileHeaderProps) {
  const { signOut } = useAuth();
  const isStandalone = (() => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    } catch { return false; }
  })();

  function handleInstall() {
    const saved = (window as Window & { __installPrompt?: BeforeInstallPromptEvent }).__installPrompt;
    if (saved) {
      saved.prompt();
    } else {
      alert('Browser menu -> Add to Home Screen');
    }
  }

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-logo">
          시야
          <span className="mobile-header-domain">stocksiya.com</span>
        </div>
        <div className="mobile-header-actions">
          {!isStandalone && (
            <button className="mobile-icon-btn mobile-install-icon" onClick={handleInstall} aria-label="홈화면 설치">
              📲
            </button>
          )}
          <button className="mobile-icon-btn" onClick={onSearchOpen} aria-label="종목 검색">
            🔍
          </button>
          <button className="mobile-icon-btn" onClick={onHelpOpen} aria-label="도움말">
            ❓
          </button>
          <button className="mobile-icon-btn" onClick={() => signOut()} aria-label="로그아웃">
            🚪
          </button>
        </div>
      </header>
    </>
  );
}
