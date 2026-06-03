import { useState } from 'react';

// beforeinstallprompt 이벤트 타입 (브라우저 표준 미포함이라 직접 선언)
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileInstallGuideProps {
  installPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  onDismiss: () => void;
  onInstalled?: () => void;
}

export default function MobileInstallGuide({ installPrompt, isIOS, onDismiss, onInstalled }: MobileInstallGuideProps) {
  const [installing, setInstalling] = useState(false);

  async function handleInstall() {
    if (!installPrompt) return;
    setInstalling(true);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      onInstalled?.();
      onDismiss();
    }
    setInstalling(false);
  }

  return (
    <div className="install-screen">
      {/* 앱 아이콘 */}
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
        /* iOS — 직접 설치 안내 */
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
        /* 안드로이드 — 원클릭 설치 */
        <button
          className="install-btn"
          onClick={handleInstall}
          disabled={installing}
        >
          {installing ? '설치 중...' : '📲 홈 화면에 설치'}
        </button>
      ) : (
        /* 이미 설치됐거나 지원 안 되는 브라우저 */
        <p className="install-already">
          이미 설치되어 있거나 브라우저에서 설치를 지원하지 않습니다.
        </p>
      )}

      <button className="install-skip" onClick={onDismiss}>
        설치 없이 브라우저에서 계속 →
      </button>
    </div>
  );
}
