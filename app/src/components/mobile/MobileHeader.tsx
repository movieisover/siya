import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileHeaderProps {
  onSearchOpen: () => void;
  onHelpOpen: () => void;
  onSignOut: () => void;
}

export default function MobileHeader({ onSearchOpen, onHelpOpen, onSignOut }: MobileHeaderProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }

  return (
    <header className="mobile-header">
      <div className="mobile-header-logo">
        시야
        <span className="mobile-header-domain">stocksiya.com</span>
      </div>
      <div className="mobile-header-actions">
        {!isStandalone && installPrompt && (
          <button className="mobile-icon-btn" onClick={handleInstall} aria-label="앱 설치">
            📲
          </button>
        )}
        <button className="mobile-icon-btn" onClick={onSearchOpen} aria-label="종목 검색">
          🔍
        </button>
        <button className="mobile-icon-btn" onClick={onHelpOpen} aria-label="도움말">
          ❓
        </button>
        <button className="mobile-icon-btn" onClick={onSignOut} aria-label="로그아웃">
          🚪
        </button>
      </div>
    </header>
  );
}
