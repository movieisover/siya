import { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const tipWidth = 280;

    // 좌측 패널에서 잘리지 않도록 우측으로 배치
    let left = rect.right + 8;
    if (left + tipWidth > window.innerWidth) {
      left = rect.left - tipWidth - 8;
    }
    if (left < 8) left = 8;

    // 아래로 표시, 화면 밖이면 위로
    let top = rect.top - 4;
    if (top + 120 > window.innerHeight) {
      top = rect.bottom - 120;
    }
    if (top < 8) top = 8;

    setPos({ top, left });
  }, []);

  const handleShow = () => {
    updatePosition();
    setShow(true);
  };

  return (
    <span className="tooltip-wrapper">
      <span
        ref={iconRef}
        className="tooltip-icon"
        onMouseEnter={handleShow}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (show) {
            setShow(false);
          } else {
            handleShow();
          }
        }}
      >
        {children || '\u24d8'}
      </span>
      {show && (
        <div
          className="tooltip-content-fixed"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {text}
        </div>
      )}
    </span>
  );
}
