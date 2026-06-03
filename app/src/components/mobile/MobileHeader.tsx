interface MobileHeaderProps {
  onSearchOpen: () => void;
  onHelpOpen: () => void;
  onSignOut: () => void;
  onInstallOpen?: () => void;
}

export default function MobileHeader({ onSearchOpen, onHelpOpen, onSignOut, onInstallOpen }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-logo">
        시야
        <span className="mobile-header-domain">stocksiya.com</span>
      </div>
      <div className="mobile-header-actions">
        {onInstallOpen && (
          <button className="mobile-install-btn" onClick={onInstallOpen}>
            앱설치
          </button>
        )}
        <button className="mobile-icon-btn" onClick={onSearchOpen} aria-label="종목 검색">
          🔍
        </button>
        <button className="mobile-icon-btn" onClick={onHelpOpen} aria-label="도움말">
          ❓
        </button>
        <button className="mobile-logout-btn" onClick={onSignOut} aria-label="로그아웃">
          로그아웃
        </button>
      </div>
    </header>
  );
}
