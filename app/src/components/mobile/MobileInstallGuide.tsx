import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileInstallGuideProps {
  onDismiss: () => void;
}

export default function MobileInstallGuide({ onDismiss }: MobileInstallGuideProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    setInstalling(true);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') onDismiss();
    setInstalling(false);
  }

  return (
    <div className="install-screen">
      <div className="install-icon">
        <img src="/icon-512.svg" alt="시야 아이콘" />
      </div>

      <h1 className="install-title">시야</h1>
      <p className="install-subtitle">가치를 보는 눈</p>
      <p className="install-desc">
        홈 화면에 설치하면 브라우저 없이<br />
        앱처럼 풀스크린으로 사용할 수 있습니다.
      </p>

      {isIOS ? (
        <div className="install-ios-guide">
          <div className="install-step">
            <span className="install-step-num">1</span>
            <span>하단의 <strong>공유 버튼</strong>을 탭하세요</span>
            <span className="install-step-icon">⎙</span>
          </div>
          <div className="install-step">
            <span className="install-step-num">2</span>
            <span><strong>홈 화면에 추가</strong>를 선택하세요</span>
            <span className="install-step-icon">＋</span>
          </div>
          <div className="install-step">
            <span className="install-step-num">3</span>
            <span>오른쪽 상단 <strong>추가</strong>를 탭하세요</span>
            <span className="install-step-icon">✓</span>
          </div>
        </div>
      ) : installPrompt ? (
        <button className="install-btn" onClick={handleInstall} disabled={installing}>
          {installing ? '설치 중...' : '홈 화면에 설치하기'}
        </button>
      ) : (
        <div className="install-manual">
          <p>브라우저 메뉴(<strong>⋮</strong>)에서 <strong>홈 화면에 추가</strong>를 선택하세요</p>
          <p className="install-manual-sub">크롬 브라우저에서는 자동 설치 버튼이 제공됩니다</p>
        </div>
      )}

      <button className="install-skip" onClick={onDismiss}>
        설치 없이 브라우저에서 계속 →
      </button>
    </div>
  );
}
