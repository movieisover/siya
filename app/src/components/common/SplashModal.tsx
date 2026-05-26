import { useState, useEffect } from 'react';

interface SplashModalProps {
  onClose: () => void;
}

export default function SplashModal({ onClose }: SplashModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // 마운트 후 페이드인
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleStart() {
    setClosing(true);
    setTimeout(onClose, 400);
  }

  return (
    <div className={`splash-overlay ${visible ? 'visible' : ''} ${closing ? 'closing' : ''}`}>
      <div className="splash-modal">
        {/* 로고 영역 */}
        <div className="splash-logo-area">
          <div className="splash-logo-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#grad)" />
              <path d="M14 28L20 18L26 24L34 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="34" cy="14" r="3" fill="#fff" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#4F8EF7" />
                  <stop offset="1" stopColor="#1B5FD1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="splash-title">시야</h1>
          <p className="splash-subtitle">한국 주식 가치투자 분석 플랫폼</p>
          <span className="splash-badge">Beta</span>
        </div>

        {/* 기능 소개 */}
        <div className="splash-features">
          <div className="splash-feature">
            <span className="splash-feature-icon">📊</span>
            <div>
              <strong>테마 분석</strong>
              <p>투자 테마별 신뢰도와 진입 타이밍을 자동 평가</p>
            </div>
          </div>
          <div className="splash-feature">
            <span className="splash-feature-icon">🔍</span>
            <div>
              <strong>종목 스크리너</strong>
              <p>나만의 기준으로 숨은 가치주를 발굴</p>
            </div>
          </div>
          <div className="splash-feature">
            <span className="splash-feature-icon">📢</span>
            <div>
              <strong>공시 모니터링</strong>
              <p>매일 공시를 자동 수집하여 놓치지 않게</p>
            </div>
          </div>
          <div className="splash-feature">
            <span className="splash-feature-icon">✏️</span>
            <div>
              <strong>나만의 테마</strong>
              <p>테마와 종목을 자유롭게 편집하고 관리</p>
            </div>
          </div>
          <div className="splash-feature">
            <span className="splash-feature-icon">🤖</span>
            <div>
              <strong>시야 AI</strong>
              <p>AI가 분석하는 종목 요약과 투자 포인트</p>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <button className="splash-start-btn" onClick={handleStart}>
          시작하기
        </button>

        <p className="splash-footer">
          stocksiya.com | KOSPI · KOSDAQ 2,773개 종목 | 매일 장 마감 후 자동 업데이트
        </p>
      </div>
    </div>
  );
}
