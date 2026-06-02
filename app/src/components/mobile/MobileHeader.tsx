interface MobileHeaderProps {
  onSearchOpen: () => void;
  onHelpOpen: () => void;
}

export default function MobileHeader({ onSearchOpen, onHelpOpen }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="mobile-header-logo">
        시야
        <span className="mobile-header-domain">stocksiya.com</span>
      </div>
      <div className="mobile-header-actions">
        <button className="mobile-icon-btn" onClick={onSearchOpen} aria-label="종목 검색">
          🔍
        </button>
        <button className="mobile-icon-btn" onClick={onHelpOpen} aria-label="도움말">
          ❓
        </button>
      </div>
    </header>
  );
}
