import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

function detectMobile() {
  return window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [isMobile, setIsMobile] = useState(detectMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(detectMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── 모바일: 탭 → 하단 바텀시트 ──
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── 데스크톱: hover 툴팁 (기존) ──
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });
  const iconRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isMobile || !show || !tipRef.current || !iconRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const tipRect = tipRef.current.getBoundingClientRect();
    const tipWidth = tipRect.width;
    const tipHeight = tipRect.height;
    const margin = 8;

    let left = iconRect.right + margin;
    if (left + tipWidth > window.innerWidth - margin) {
      left = iconRect.left - tipWidth - margin;
    }
    if (left < margin) left = margin;

    let top = iconRect.top - 4;
    if (top + tipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tipHeight - margin;
    }
    if (top < margin) top = margin;

    setPos({ top, left, ready: true });
  }, [show, text, isMobile]);

  const handleShow = () => {
    setPos({ top: 0, left: 0, ready: false });
    setShow(true);
  };
  const handleHide = () => setShow(false);

  // ── 모바일 렌더 ──
  if (isMobile) {
    return (
      <>
        <span
          className="tooltip-icon"
          onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
        >
          {children || '\u24d8'}
        </span>
        {sheetOpen && createPortal(
          <div className="tooltip-sheet-overlay" onClick={() => setSheetOpen(false)}>
            <div className="tooltip-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="tooltip-sheet-bar" />
              <div className="tooltip-sheet-text">{text}</div>
              <button className="tooltip-sheet-close" onClick={() => setSheetOpen(false)}>
                닫기
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // ── 데스크톱 렌더 ──
  return (
    <span className="tooltip-wrapper">
      <span
        ref={iconRef}
        className="tooltip-icon"
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onClick={(e) => {
          e.stopPropagation();
          if (show) setShow(false);
          else handleShow();
        }}
      >
        {children || '\u24d8'}
      </span>
      {show && (
        <div
          ref={tipRef}
          className="tooltip-content-fixed"
          style={{
            top: pos.top,
            left: pos.left,
            opacity: pos.ready ? 1 : 0,
          }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={handleHide}
        >
          {text}
        </div>
      )}
    </span>
  );
}
