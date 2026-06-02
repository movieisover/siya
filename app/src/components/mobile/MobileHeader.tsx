interface MobileHeaderProps {
  onSearchOpen: () => void;
  onHelpOpen: () => void;
  showInstallBanner?: boolean;
}

export default function MobileHeader({ onSearchOpen, onHelpOpen, showInstallBanner }: MobileHeaderProps) {
  function handleInstall() {
    // beforeinstallprompt가 있으면 사용, 없으면 안내 알림
    const evt = (window as Window & { __installPrompt?: Event & { prompt: () => void } }).__installPrompt;
    if (evt) {
      evt.prompt();
    } else {
      alert('브라우저 메뉴(⋮) → 홈 화면에 추가를 선택하세요.\n크롬에서는 자동 설치 버튼이 제공됩니다.');
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
          <button className="mobile-icon-btn" onClick={onSearchOpen} aria-label="종목 검색">
            🔍
          </button>
          <button className="mobile-icon-btn" onClick={onHelpOpen} aria-label="도움말">
            ❓
          </button>
        </div>
      </header>
      {showInstallBanner && (
        <div className="mobile-install-banner">
          <span>홈 화면에 설치하면 앱처럼 사용할 수 있습니다</span>
          <button className="mobile-install-banner-btn" onClick={handleInstall}>
            설치
          </button>
        </div>
      )}
    </>
  );
}
