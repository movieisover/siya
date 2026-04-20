import { useState, useRef, useLayoutEffect } from 'react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });
  const iconRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // 툴팁이 렌더된 후 실제 크기를 측정해서 재배치
  useLayoutEffect(() => {
    if (!show || !tipRef.current || !iconRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const tipRect = tipRef.current.getBoundingClientRect();
    const tipWidth = tipRect.width;
    const tipHeight = tipRect.height;
    const margin = 8;

    // 좌우: 아이콘 오른쪽에 배치, 화면 밖으면 왼쪽으로
    let left = iconRect.right + margin;
    if (left + tipWidth > window.innerWidth - margin) {
      left = iconRect.left - tipWidth - margin;
    }
    if (left < margin) left = margin;

    // 상하: 기본은 아이콘 top 근처,
    //       아래로 넘치면 화면 하단에 맞춰 위로 이동,
    //       그래도 위로 넘치면 화면 상단에 고정
    let top = iconRect.top - 4;
    if (top + tipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tipHeight - margin;
    }
    if (top < margin) top = margin;

    setPos({ top, left, ready: true });
  }, [show, text]);

  const handleShow = () => {
    setPos({ top: 0, left: 0, ready: false }); // 일단 렌더를 안 보이게
    setShow(true);
  };

  const handleHide = () => setShow(false);

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
