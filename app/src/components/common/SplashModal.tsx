import { useState, useEffect } from 'react';

interface SplashModalProps {
  onClose: () => void;
}

export default function SplashModal({ onClose }: SplashModalProps) {
  const [phase, setPhase] = useState<'chart' | 'splash'>('chart');
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    // 차트 애니메이션 2초 후 스플래시로 전환
    const timer = setTimeout(() => setPhase('splash'), 2200);
    return () => clearTimeout(timer);
  }, []);

  function handleStart() {
    setClosing(true);
    setTimeout(onClose, 400);
  }

  return (
    <div className={`splash-overlay ${visible ? 'visible' : ''} ${closing ? 'closing' : ''}`}>
      {phase === 'chart' ? (
        <div className="intro-chart">
          <svg viewBox="0 0 600 300" className="intro-chart-svg">
            {/* 그리드 라인 */}
            <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(74,158,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(74,158,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="225" x2="600" y2="225" stroke="rgba(74,158,255,0.08)" strokeWidth="1" />

            {/* 상승 차트 라인 — 그라데이션 영역 */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F8EF7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4F8EF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4F8EF7" />
                <stop offset="100%" stopColor="#1B5FD1" />
              </linearGradient>
            </defs>

            {/* 영역 채우기 */}
            <path
              d="M0,260 L60,240 L120,250 L180,220 L240,200 L300,180 L340,160 L380,120 L420,130 L460,90 L500,70 L540,50 L580,30 L600,20 L600,300 L0,300 Z"
              fill="url(#chartGrad)"
              className="intro-area"
            />

            {/* 차트 라인 */}
            <path
              d="M0,260 L60,240 L120,250 L180,220 L240,200 L300,180 L340,160 L380,120 L420,130 L460,90 L500,70 L540,50 L580,30 L600,20"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="intro-line"
            />

            {/* 끝점 빛나는 점 */}
            <circle cx="600" cy="20" r="5" fill="#4F8EF7" className="intro-dot">
              <animate attributeName="r" values="4;7;4" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* 시야 로고 텍스트 */}
          <div className="intro-logo-text">
            <span className="intro-siya">시야</span>
          </div>
        </div>
      ) : (
        <div className="splash-modal">
          {/* 로고 영역 */}
          <div className="splash-logo-area">
            <div className="splash-logo-icon">
              <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="url(#grad2)" />
                <path d="M14 28L20 18L26 24L34 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="34" cy="14" r="3" fill="#fff" />
                <defs>
                  <linearGradient id="grad2" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#4F8EF7" />
                    <stop offset="1" stopColor="#1B5FD1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="splash-title">시야</h1>
            <p className="splash-domain">stocksiya.com</p>
            <p className="splash-subtitle">한국 주식 가치투자 분석 플랫폼</p>
          </div>

          {/* 기능 소개 */}
          <div className="splash-features">
            <div className="splash-feature">
              <span className="splash-feature-icon">📊</span>
              <div>
                <strong>테마 분석</strong>
                <p>투자 테마별 신뢰도와 진입 타이밍을 자동 평가하고, 테마 내 종목의 기술적 지표를 종합 분석합니다</p>
              </div>
            </div>
            <div className="splash-feature">
              <span className="splash-feature-icon">🔍</span>
              <div>
                <strong>종목 스크리너</strong>
                <p>PER, PBR, ROE, 부채비율, 배당수익률 등 핵심 지표로 나만의 기준에 맞는 숨은 가치주를 발굴합니다</p>
              </div>
            </div>
            <div className="splash-feature">
              <span className="splash-feature-icon">📢</span>
              <div>
                <strong>공시 모니터링</strong>
                <p>KOSPI · KOSDAQ 전 종목의 공시를 매일 자동 수집하여 중요한 정보를 놓치지 않게 합니다</p>
              </div>
            </div>
            <div className="splash-feature">
              <span className="splash-feature-icon">✏️</span>
              <div>
                <strong>나만의 테마</strong>
                <p>기본 제공되는 테마 외에 나만의 테마를 만들고, 종목을 자유롭게 추가하거나 제거할 수 있습니다</p>
              </div>
            </div>
            <div className="splash-feature">
              <span className="splash-feature-icon">🤖</span>
              <div>
                <strong>시야 AI</strong>
                <p>AI가 종목의 재무 · 기술적 지표를 종합 분석하여 핵심 투자 포인트를 요약합니다</p>
              </div>
            </div>
          </div>

          {/* 시작 버튼 */}
          <button className="splash-start-btn" onClick={handleStart}>
            시작하기
          </button>

          <p className="splash-footer">
            KOSPI · KOSDAQ 2,773개 종목 | 매일 장 마감 후 자동 업데이트
          </p>
        </div>
      )}
    </div>
  );
}
