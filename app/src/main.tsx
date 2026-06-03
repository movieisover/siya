import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// PWA 설치 프롬프트(beforeinstallprompt)는 로그인 화면 단계(=MobileApp 마운트 전)에
// 발생할 수 있어, 앱 시작 시점(모듈 로드)에서 즉시 캡처해 전역 보관한다.
// MobileApp은 마운트 시 window.__siyaInstallPrompt를 읽고, 늦게 도착하는 경우
// 'siya-install-available' 커스텀 이벤트로 갱신한다.
declare global {
  interface Window {
    __siyaInstallPrompt?: Event | null;
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__siyaInstallPrompt = e;
  window.dispatchEvent(new Event('siya-install-available'));
});

window.addEventListener('appinstalled', () => {
  window.__siyaInstallPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
