const pptxgen = require("pptxgenjs");
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = '시야 PC앱 기획서 v3';

const PRIMARY = "028090", ACCENT = "02C39A", DARK = "1E2761", LIGHT = "F8F9FA", WHITE = "FFFFFF";
const TEXT_DARK = "1E293B", TEXT_MUTED = "64748B", CARD_BORDER = "E2E8F0";
const RED = "DC2626", BLUE = "3B82F6", GREEN = "10B981", ORANGE = "F59E0B";

// S1: 타이틀
let s1 = pres.addSlide(); s1.background = { color: DARK };
s1.addText("시야 PC앱 기획서", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 48, color: WHITE, bold: true });
s1.addText("한국 주식 가치투자 분석 앱", { x: 0.5, y: 3, w: 9, h: 0.6, fontSize: 24, color: ACCENT });
s1.addText("테마 분석 + 스크리너 | 화면 목업 포함", { x: 0.5, y: 3.7, w: 9, h: 0.5, fontSize: 16, color: TEXT_MUTED });
s1.addText("2026.03 v3", { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 14, color: TEXT_MUTED });

// S2: 목차
let s2 = pres.addSlide(); s2.background = { color: LIGHT };
s2.addText("목차", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
["1. 시야란 무엇인가?","2. 두 가지 분석 방식","3. 화면 구성 및 PC 목업","4. 스크리너 기능 상세","5. 테마 시그널 감지 로직","6. 투자 용어 설명","7. 테마 목록 & 시그널 기준","8. 기술 스택","9. 다음 단계"].forEach((t,i) => s2.addText(t, { x: 0.7, y: 1.1 + i * 0.5, w: 8, h: 0.45, fontSize: 18, color: TEXT_DARK }));

// S3: 시야란?
let s3 = pres.addSlide(); s3.background = { color: LIGHT };
s3.addText("시야란 무엇인가?", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s3.addText('"시야(視野)" = 넓은 시각으로 시장을 분석하는 가치투자 도구', { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 18, color: PRIMARY, italic: true });
s3.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.6, w: 4.2, h: 3.2, fill: { color: WHITE }, line: { color: PRIMARY, pt: 2 } });
s3.addText("테마 분석 (Top-down)", { x: 0.7, y: 1.75, w: 3.8, h: 0.45, fontSize: 16, color: PRIMARY, bold: true });
s3.addText("• 시장 테마/섹터 먼저 파악\n• 테마 내 시그널 감지\n• 관련 종목 자동 분석\n• 뉴스/트렌드 기반 투자", { x: 0.7, y: 2.3, w: 3.8, h: 2.3, fontSize: 14, color: TEXT_DARK, valign: "top" });
s3.addShape(pres.ShapeType.roundRect, { x: 5, y: 1.6, w: 4.2, h: 3.2, fill: { color: WHITE }, line: { color: ACCENT, pt: 2 } });
s3.addText("스크리너 (Bottom-up)", { x: 5.2, y: 1.75, w: 3.8, h: 0.45, fontSize: 16, color: ACCENT, bold: true });
s3.addText("• 재무지표로 필터링\n• 조건에 맞는 종목 탐색\n• 정량적 점수 기반 정렬\n• 숨겨진 저평가주 발굴", { x: 5.2, y: 2.3, w: 3.8, h: 2.3, fontSize: 14, color: TEXT_DARK, valign: "top" });

// S4: 비교
let s4 = pres.addSlide(); s4.background = { color: LIGHT };
s4.addText("두 가지 분석 방식 비교", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s4.addTable([["구분", "테마 분석 (Top-down)", "스크리너 (Bottom-up)"],["시작점", "시장 테마/섹터", "개별 종목 지표"],["분석 흐름", "테마 → 시그널 → 종목", "필터 → 정렬 → 종목"],["핵심 질문", '"지금 어떤 테마가 뜨나?"', '"저평가된 우량주는?"'],["주요 지표", "거래량, 수급, 동반상승", "PER, PBR, ROE, 부채비율"],["적합한 투자자", "트렌드/모멘텀 중시", "가치/퀄리티 중시"]], { x: 0.5, y: 1, w: 9, h: 3.5, fontSize: 12, color: TEXT_DARK, border: { pt: 0.5, color: CARD_BORDER }, fill: { color: WHITE }, colW: [1.8, 3.6, 3.6], rowH: 0.55, valign: "middle", align: "center" });
s4.addShape(pres.ShapeType.rect, { x: 0.5, y: 1, w: 9, h: 0.55, fill: { color: PRIMARY } });
s4.addText("구분", { x: 0.5, y: 1, w: 1.8, h: 0.55, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" });
s4.addText("테마 분석 (Top-down)", { x: 2.3, y: 1, w: 3.6, h: 0.55, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" });
s4.addText("스크리너 (Bottom-up)", { x: 5.9, y: 1, w: 3.6, h: 0.55, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" });

// S5: 화면 구성
let s5 = pres.addSlide(); s5.background = { color: LIGHT };
s5.addText("화면 구성", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s5.addText("PC 3단 레이아웃 + 모드 전환", { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 16, color: TEXT_MUTED });
s5.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.4, w: 2, h: 3.5, fill: { color: PRIMARY } });
s5.addText("좌측 패널\n\n테마 목록\n또는\n필터 슬라이더", { x: 0.5, y: 1.4, w: 2, h: 3.5, fontSize: 12, color: WHITE, align: "center", valign: "middle" });
s5.addShape(pres.ShapeType.rect, { x: 2.6, y: 1.4, w: 4, h: 3.5, fill: { color: ACCENT } });
s5.addText("중앙 메인 영역\n\n시그널 카드 / 종목 리스트\n차트 및 분석 결과", { x: 2.6, y: 1.4, w: 4, h: 3.5, fontSize: 12, color: WHITE, align: "center", valign: "middle" });
s5.addShape(pres.ShapeType.rect, { x: 6.7, y: 1.4, w: 2.8, h: 3.5, fill: { color: DARK } });
s5.addText("우측 패널\n\n종목 상세 정보\n재무지표\n점수 구성", { x: 6.7, y: 1.4, w: 2.8, h: 3.5, fontSize: 12, color: WHITE, align: "center", valign: "middle" });
s5.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 5.1, w: 4.2, h: 0.35, fill: { color: PRIMARY } });
s5.addText("테마 분석 모드", { x: 0.5, y: 5.1, w: 4.2, h: 0.35, fontSize: 12, color: WHITE, align: "center", valign: "middle" });
s5.addShape(pres.ShapeType.roundRect, { x: 5.3, y: 5.1, w: 4.2, h: 0.35, fill: { color: ACCENT } });
s5.addText("스크리너 모드", { x: 5.3, y: 5.1, w: 4.2, h: 0.35, fontSize: 12, color: WHITE, align: "center", valign: "middle" });

// S6: 테마 분석 목업
let s6 = pres.addSlide(); s6.background = { color: LIGHT };
s6.addText("PC 목업: 테마 분석 모드", { x: 0.5, y: 0.2, w: 9, h: 0.5, fontSize: 28, color: TEXT_DARK, bold: true });
s6.addShape(pres.ShapeType.rect, { x: 0.3, y: 0.75, w: 9.4, h: 4.6, fill: { color: "2D3748" }, line: { color: "1A202C", pt: 2 } });
s6.addShape(pres.ShapeType.rect, { x: 0.3, y: 0.75, w: 9.4, h: 0.35, fill: { color: "1A202C" } });
s6.addShape(pres.ShapeType.ellipse, { x: 0.45, y: 0.85, w: 0.12, h: 0.12, fill: { color: RED } });
s6.addShape(pres.ShapeType.ellipse, { x: 0.62, y: 0.85, w: 0.12, h: 0.12, fill: { color: ORANGE } });
s6.addShape(pres.ShapeType.ellipse, { x: 0.79, y: 0.85, w: 0.12, h: 0.12, fill: { color: GREEN } });
s6.addText("시야 - 테마 분석", { x: 3.5, y: 0.77, w: 3, h: 0.35, fontSize: 10, color: TEXT_MUTED, align: "center" });
s6.addShape(pres.ShapeType.rect, { x: 0.4, y: 1.2, w: 2.2, h: 4.05, fill: { color: "374151" } });
s6.addText("테마 목록", { x: 0.5, y: 1.3, w: 2, h: 0.3, fontSize: 11, color: WHITE, bold: true });
["AI/반도체", "2차전지", "로봇/자동화", "바이오/제약", "방위산업", "수소경제"].forEach((t, i) => {
  s6.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.65 + i * 0.52, w: 2, h: 0.45, fill: { color: i === 0 ? PRIMARY : "4B5563" } });
  s6.addText(t, { x: 0.5, y: 1.65 + i * 0.52, w: 2, h: 0.45, fontSize: 10, color: WHITE, align: "center", valign: "middle" });
});
s6.addShape(pres.ShapeType.rect, { x: 2.7, y: 1.2, w: 4.4, h: 4.05, fill: { color: "1F2937" } });
s6.addText("AI/반도체 시그널", { x: 2.85, y: 1.3, w: 3, h: 0.3, fontSize: 12, color: WHITE, bold: true });
s6.addText("신뢰도: HIGH", { x: 5.8, y: 1.3, w: 1.2, h: 0.25, fontSize: 9, color: GREEN, align: "right" });
[{ title: "거래량 급증", value: "+156%", color: RED },{ title: "기관 순매수", value: "+823억", color: BLUE },{ title: "동반 상승", value: "78%", color: GREEN }].forEach((sig, i) => {
  s6.addShape(pres.ShapeType.roundRect, { x: 2.85 + i * 1.4, y: 1.7, w: 1.3, h: 0.9, fill: { color: "374151" } });
  s6.addText(sig.title, { x: 2.85 + i * 1.4, y: 1.75, w: 1.3, h: 0.25, fontSize: 8, color: TEXT_MUTED, align: "center" });
  s6.addText(sig.value, { x: 2.85 + i * 1.4, y: 2, w: 1.3, h: 0.3, fontSize: 14, color: sig.color, bold: true, align: "center" });
});
s6.addText("관련 종목", { x: 2.85, y: 2.75, w: 2, h: 0.25, fontSize: 10, color: WHITE, bold: true });
[["삼성전자", "72,500", "+3.2%", "92"],["SK하이닉스", "142,000", "+4.1%", "88"],["한미반도체", "89,200", "+2.8%", "85"]].forEach((st, i) => {
  s6.addShape(pres.ShapeType.roundRect, { x: 2.85, y: 3.05 + i * 0.55, w: 4.1, h: 0.48, fill: { color: "374151" } });
  s6.addText(st[0], { x: 2.95, y: 3.1 + i * 0.55, w: 1.2, h: 0.4, fontSize: 10, color: WHITE, valign: "middle" });
  s6.addText(st[1], { x: 4.1, y: 3.1 + i * 0.55, w: 1, h: 0.4, fontSize: 10, color: WHITE, align: "right", valign: "middle" });
  s6.addText(st[2], { x: 5.1, y: 3.1 + i * 0.55, w: 0.8, h: 0.4, fontSize: 10, color: GREEN, align: "right", valign: "middle" });
  s6.addText(st[3], { x: 5.9, y: 3.1 + i * 0.55, w: 0.9, h: 0.4, fontSize: 10, color: ACCENT, align: "center", valign: "middle" });
});
s6.addShape(pres.ShapeType.rect, { x: 7.2, y: 1.2, w: 2.4, h: 4.05, fill: { color: "374151" } });
s6.addText("삼성전자", { x: 7.35, y: 1.3, w: 2.1, h: 0.3, fontSize: 12, color: WHITE, bold: true });
s6.addText("005930", { x: 7.35, y: 1.55, w: 1, h: 0.2, fontSize: 8, color: TEXT_MUTED });
s6.addText("종합 점수", { x: 7.35, y: 1.85, w: 1.5, h: 0.2, fontSize: 9, color: TEXT_MUTED });
s6.addText("92", { x: 8.4, y: 1.75, w: 1, h: 0.4, fontSize: 24, color: ACCENT, bold: true, align: "right" });
[["PER", "12.3"],["PBR", "1.42"],["ROE", "15.2%"],["부채비율", "45%"]].forEach((d, i) => {
  s6.addText(d[0], { x: 7.35, y: 2.3 + i * 0.35, w: 1, h: 0.3, fontSize: 9, color: TEXT_MUTED });
  s6.addText(d[1], { x: 8.35, y: 2.3 + i * 0.35, w: 1, h: 0.3, fontSize: 10, color: WHITE, align: "right" });
});

// S7: 스크리너 목업
let s7 = pres.addSlide(); s7.background = { color: LIGHT };
s7.addText("PC 목업: 스크리너 모드", { x: 0.5, y: 0.2, w: 9, h: 0.5, fontSize: 28, color: TEXT_DARK, bold: true });
s7.addShape(pres.ShapeType.rect, { x: 0.3, y: 0.75, w: 9.4, h: 4.6, fill: { color: "2D3748" }, line: { color: "1A202C", pt: 2 } });
s7.addShape(pres.ShapeType.rect, { x: 0.3, y: 0.75, w: 9.4, h: 0.35, fill: { color: "1A202C" } });
s7.addShape(pres.ShapeType.ellipse, { x: 0.45, y: 0.85, w: 0.12, h: 0.12, fill: { color: RED } });
s7.addShape(pres.ShapeType.ellipse, { x: 0.62, y: 0.85, w: 0.12, h: 0.12, fill: { color: ORANGE } });
s7.addShape(pres.ShapeType.ellipse, { x: 0.79, y: 0.85, w: 0.12, h: 0.12, fill: { color: GREEN } });
s7.addText("시야 - 스크리너", { x: 3.5, y: 0.77, w: 3, h: 0.35, fontSize: 10, color: TEXT_MUTED, align: "center" });
s7.addShape(pres.ShapeType.rect, { x: 0.4, y: 1.2, w: 2.2, h: 4.05, fill: { color: "374151" } });
s7.addText("필터 설정", { x: 0.5, y: 1.3, w: 2, h: 0.3, fontSize: 11, color: WHITE, bold: true });
[{ name: "PER", val: "≤15" },{ name: "PBR", val: "≤1.5" },{ name: "ROE", val: "≥10%" },{ name: "부채비율", val: "≤100%" }].forEach((f, i) => {
  s7.addText(f.name, { x: 0.5, y: 1.7 + i * 0.65, w: 1, h: 0.2, fontSize: 9, color: WHITE });
  s7.addText(f.val, { x: 1.5, y: 1.7 + i * 0.65, w: 1, h: 0.2, fontSize: 9, color: ACCENT, align: "right" });
  s7.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.95 + i * 0.65, w: 2, h: 0.08, fill: { color: "4B5563" } });
  s7.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.95 + i * 0.65, w: 1.4, h: 0.08, fill: { color: ACCENT } });
});
s7.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.6, w: 2, h: 0.35, fill: { color: ACCENT } });
s7.addText("필터 적용", { x: 0.5, y: 4.6, w: 2, h: 0.35, fontSize: 10, color: WHITE, align: "center", valign: "middle", bold: true });
s7.addShape(pres.ShapeType.rect, { x: 2.7, y: 1.2, w: 4.4, h: 4.05, fill: { color: "1F2937" } });
s7.addText("필터 결과: 127개 종목", { x: 2.85, y: 1.3, w: 2.5, h: 0.3, fontSize: 11, color: WHITE, bold: true });
s7.addShape(pres.ShapeType.roundRect, { x: 5.5, y: 1.28, w: 0.6, h: 0.28, fill: { color: ACCENT } });
s7.addText("점수순", { x: 5.5, y: 1.28, w: 0.6, h: 0.28, fontSize: 8, color: WHITE, align: "center", valign: "middle" });
s7.addShape(pres.ShapeType.rect, { x: 2.85, y: 1.65, w: 4.1, h: 0.3, fill: { color: "374151" } });
s7.addText("종목명   점수   PER   PBR   ROE   부채   현재가", { x: 2.9, y: 1.68, w: 4, h: 0.25, fontSize: 8, color: TEXT_MUTED });
[{ name: "삼성전자", score: "92", per: "12.3", pbr: "1.42", roe: "15.2%", debt: "45%", price: "72,500", sel: true },{ name: "현대차", score: "88", per: "6.8", pbr: "0.65", roe: "12.8%", debt: "89%", price: "245,500", sel: false },{ name: "POSCO홀딩스", score: "85", per: "8.2", pbr: "0.52", roe: "11.5%", debt: "67%", price: "389,000", sel: false },{ name: "KB금융", score: "83", per: "5.4", pbr: "0.48", roe: "10.2%", debt: "N/A", price: "78,200", sel: false },{ name: "신한지주", score: "81", per: "5.8", pbr: "0.45", roe: "10.8%", debt: "N/A", price: "52,100", sel: false }].forEach((st, i) => {
  s7.addShape(pres.ShapeType.rect, { x: 2.85, y: 2 + i * 0.42, w: 4.1, h: 0.38, fill: { color: st.sel ? "4B5563" : "2D3748" } });
  s7.addText(st.name, { x: 2.9, y: 2.02 + i * 0.42, w: 0.85, h: 0.34, fontSize: 8, color: WHITE });
  s7.addText(st.score, { x: 3.75, y: 2.02 + i * 0.42, w: 0.4, h: 0.34, fontSize: 8, color: ACCENT, align: "center", bold: true });
  s7.addText(st.per, { x: 4.15, y: 2.02 + i * 0.42, w: 0.45, h: 0.34, fontSize: 8, color: WHITE, align: "center" });
  s7.addText(st.pbr, { x: 4.6, y: 2.02 + i * 0.42, w: 0.45, h: 0.34, fontSize: 8, color: WHITE, align: "center" });
  s7.addText(st.roe, { x: 5.05, y: 2.02 + i * 0.42, w: 0.5, h: 0.34, fontSize: 8, color: WHITE, align: "center" });
  s7.addText(st.debt, { x: 5.55, y: 2.02 + i * 0.42, w: 0.4, h: 0.34, fontSize: 8, color: WHITE, align: "center" });
  s7.addText(st.price, { x: 5.95, y: 2.02 + i * 0.42, w: 0.9, h: 0.34, fontSize: 8, color: WHITE, align: "right" });
});
s7.addShape(pres.ShapeType.rect, { x: 7.2, y: 1.2, w: 2.4, h: 4.05, fill: { color: "374151" } });
s7.addText("삼성전자", { x: 7.35, y: 1.3, w: 2.1, h: 0.3, fontSize: 12, color: WHITE, bold: true });
s7.addText("005930 · 전기전자", { x: 7.35, y: 1.55, w: 2, h: 0.2, fontSize: 8, color: TEXT_MUTED });
s7.addText("종합 점수", { x: 7.35, y: 1.85, w: 1.2, h: 0.2, fontSize: 9, color: TEXT_MUTED });
s7.addText("92", { x: 8.5, y: 1.75, w: 0.9, h: 0.4, fontSize: 24, color: ACCENT, bold: true, align: "right" });
s7.addText("점수 구성", { x: 7.35, y: 2.2, w: 2, h: 0.25, fontSize: 10, color: WHITE, bold: true });
[{ name: "품질 점수", pct: "50%", val: "46/50", color: GREEN },{ name: "밸류 점수", pct: "20%", val: "18/20", color: BLUE },{ name: "개선 점수", pct: "30%", val: "28/30", color: ORANGE }].forEach((sc, i) => {
  s7.addText(sc.name, { x: 7.35, y: 2.5 + i * 0.45, w: 1.2, h: 0.2, fontSize: 9, color: TEXT_MUTED });
  s7.addText(sc.val, { x: 8.55, y: 2.5 + i * 0.45, w: 0.8, h: 0.2, fontSize: 9, color: sc.color, align: "right" });
  s7.addShape(pres.ShapeType.rect, { x: 7.35, y: 2.72 + i * 0.45, w: 2, h: 0.08, fill: { color: "4B5563" } });
  s7.addShape(pres.ShapeType.rect, { x: 7.35, y: 2.72 + i * 0.45, w: (parseInt(sc.val) / parseInt(sc.val.split("/")[1])) * 2, h: 0.08, fill: { color: sc.color } });
});

// S8: 스크리너 기능 상세
let s8 = pres.addSlide(); s8.background = { color: LIGHT };
s8.addText("스크리너 기능 상세", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s8.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1, w: 4.2, h: 2.2, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 1 } });
s8.addText("슬라이더 필터 (4가지)", { x: 0.7, y: 1.1, w: 3.8, h: 0.35, fontSize: 14, color: PRIMARY, bold: true });
["• PER: 0 < PER ≤ 15 (낮을수록 저평가)","• PBR: ≤ 1.5 (낮을수록 저평가)","• ROE: ≥ 10% (높을수록 수익성 좋음)","• 부채비율: ≤ 100% (낮을수록 안전)"].forEach((f, i) => s8.addText(f, { x: 0.7, y: 1.5 + i * 0.4, w: 3.8, h: 0.35, fontSize: 12, color: TEXT_DARK }));
s8.addShape(pres.ShapeType.roundRect, { x: 5, y: 1, w: 4.5, h: 2.2, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 1 } });
s8.addText("정렬 옵션 (5가지)", { x: 5.2, y: 1.1, w: 4.1, h: 0.35, fontSize: 14, color: PRIMARY, bold: true });
["• 종합 점수순 (기본)","• ROE 높은순","• PER 낮은순","• PBR 낮은순","• 시가총액 높은순"].forEach((s, i) => s8.addText(s, { x: 5.2, y: 1.5 + i * 0.35, w: 4.1, h: 0.3, fontSize: 12, color: TEXT_DARK }));
s8.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 3.4, w: 9, h: 1.95, fill: { color: WHITE }, line: { color: PRIMARY, pt: 2 } });
s8.addText("종합 점수 계산 공식", { x: 0.7, y: 3.5, w: 8.6, h: 0.4, fontSize: 16, color: PRIMARY, bold: true });
s8.addShape(pres.ShapeType.rect, { x: 0.7, y: 3.95, w: 8.6, h: 0.5, fill: { color: "EFF6FF" } });
s8.addText("종합 점수 = 품질(50%) + 밸류에이션(20%) + 개선(30%)", { x: 0.9, y: 4, w: 8.2, h: 0.4, fontSize: 14, color: DARK, bold: true, align: "center" });
[["품질 점수 (50%)", "ROE, ROA, 영업이익률 기반"],["밸류에이션 점수 (20%)", "PBR, PER 업종 평균 대비"],["개선 점수 (30%)", "전년 대비 ROE/영업이익률 상승폭"]].forEach((f, i) => {
  s8.addText("• " + f[0] + ": ", { x: 0.9, y: 4.55 + i * 0.3, w: 2.2, h: 0.25, fontSize: 11, color: TEXT_DARK, bold: true });
  s8.addText(f[1], { x: 3.1, y: 4.55 + i * 0.3, w: 5.5, h: 0.25, fontSize: 11, color: TEXT_MUTED });
});

// S9: 테마 시그널
let s9 = pres.addSlide(); s9.background = { color: LIGHT };
s9.addText("테마 시그널 감지 로직", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
[{ title: "거래량 급증", icon: "📈", desc: "테마 관련 종목들의\n거래량이 급증할 때", metric: "20일 평균 대비\n+100% 이상", color: RED },{ title: "기관/외국인 매집", icon: "🏦", desc: "기관/외국인이\n집중 매수할 때", metric: "5일 누적\n+500억 이상", color: BLUE },{ title: "동반 상승", icon: "🚀", desc: "테마 내 종목들이\n함께 상승할 때", metric: "테마 내 70% 이상\n종목 상승", color: GREEN }].forEach((card, i) => {
  const x = 0.5 + i * 3.1;
  s9.addShape(pres.ShapeType.roundRect, { x: x, y: 1, w: 2.9, h: 3.5, fill: { color: WHITE }, line: { color: card.color, pt: 2 } });
  s9.addText(card.icon, { x: x, y: 1.15, w: 2.9, h: 0.6, fontSize: 36, align: "center" });
  s9.addText(card.title, { x: x + 0.2, y: 1.8, w: 2.5, h: 0.4, fontSize: 16, color: card.color, bold: true, align: "center" });
  s9.addText(card.desc, { x: x + 0.2, y: 2.3, w: 2.5, h: 0.8, fontSize: 12, color: TEXT_DARK, align: "center" });
  s9.addShape(pres.ShapeType.rect, { x: x + 0.2, y: 3.2, w: 2.5, h: 0.7, fill: { color: "F1F5F9" } });
  s9.addText(card.metric, { x: x + 0.2, y: 3.25, w: 2.5, h: 0.6, fontSize: 11, color: card.color, align: "center", bold: true });
});
s9.addText("신뢰도 등급: HIGH (90점↑) | MEDIUM (70~89점) | LOW (70점↓)", { x: 0.5, y: 4.7, w: 9, h: 0.4, fontSize: 12, color: TEXT_MUTED, align: "center" });

// S10: 용어 설명
let s10 = pres.addSlide(); s10.background = { color: LIGHT };
s10.addText("투자 용어 설명", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
[{ term: "PER", full: "Price to Earnings Ratio", desc: "주가 ÷ 주당순이익. 낮을수록 저평가", ex: "PER 10 = 10년치 이익으로 시총 회수" },{ term: "PBR", full: "Price to Book Ratio", desc: "주가 ÷ 주당순자산. 1 미만이면 청산가치 이하", ex: "PBR 0.8 = 순자산보다 20% 할인" },{ term: "ROE", full: "Return on Equity", desc: "당기순이익 ÷ 자기자본. 높을수록 수익성 좋음", ex: "ROE 15% = 자본 100원으로 15원 벌음" },{ term: "부채비율", full: "Debt to Equity", desc: "부채 ÷ 자기자본. 낮을수록 재무건전성 좋음", ex: "100% = 부채와 자본이 같음" },{ term: "RSI", full: "Relative Strength Index", desc: "과매수/과매도 지표. 70↑ 과매수, 30↓ 과매도", ex: "RSI 25 = 과매도, 반등 가능성" },{ term: "MACD", full: "Moving Average Convergence Divergence", desc: "추세 전환 시그널. 골든크로스/데드크로스", ex: "MACD 골든크로스 = 상승 전환" }].forEach((t, i) => {
  const row = Math.floor(i / 2), col = i % 2, x = 0.5 + col * 4.7, y = 0.95 + row * 1.45;
  s10.addShape(pres.ShapeType.roundRect, { x: x, y: y, w: 4.5, h: 1.35, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 1 } });
  s10.addText(t.term, { x: x + 0.15, y: y + 0.1, w: 0.8, h: 0.35, fontSize: 16, color: PRIMARY, bold: true });
  s10.addText(t.full, { x: x + 1, y: y + 0.15, w: 3.3, h: 0.25, fontSize: 9, color: TEXT_MUTED });
  s10.addText(t.desc, { x: x + 0.15, y: y + 0.45, w: 4.2, h: 0.35, fontSize: 11, color: TEXT_DARK });
  s10.addText("예) " + t.ex, { x: x + 0.15, y: y + 0.85, w: 4.2, h: 0.35, fontSize: 10, color: ACCENT, italic: true });
});

// S11: 테마 목록
let s11 = pres.addSlide(); s11.background = { color: LIGHT };
s11.addText("테마 목록 (20개)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
[{ cat: "첨단기술", themes: ["AI/반도체", "로봇/자동화", "우주항공", "양자컴퓨팅"], color: BLUE },{ cat: "에너지/소재", themes: ["2차전지", "신재생에너지", "수소경제", "희토류"], color: GREEN },{ cat: "바이오/헬스", themes: ["바이오/제약", "의료기기", "디지털헬스", "고령화/실버"], color: RED },{ cat: "산업/방산", themes: ["방위산업", "조선/해운", "건설/인프라", "원자력"], color: ORANGE },{ cat: "금융/소비", themes: ["금융/핀테크", "게임/엔터", "리츠/부동산", "화장품/K뷰티"], color: PRIMARY }].forEach((c, i) => {
  const y = 0.95 + i * 0.85;
  s11.addShape(pres.ShapeType.roundRect, { x: 0.5, y: y, w: 1.8, h: 0.7, fill: { color: c.color } });
  s11.addText(c.cat, { x: 0.5, y: y, w: 1.8, h: 0.7, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" });
  c.themes.forEach((t, j) => {
    s11.addShape(pres.ShapeType.roundRect, { x: 2.5 + j * 1.8, y: y, w: 1.65, h: 0.7, fill: { color: WHITE }, line: { color: c.color, pt: 1 } });
    s11.addText(t, { x: 2.5 + j * 1.8, y: y, w: 1.65, h: 0.7, fontSize: 11, color: TEXT_DARK, align: "center", valign: "middle" });
  });
});

// S12: 시그널 기준
let s12 = pres.addSlide(); s12.background = { color: LIGHT };
s12.addText("시그널 기준 (논의 필요)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s12.addTable([["시그널", "기준안", "선택지", "비고"],["거래량 급증", "20일 평균 대비 +100%", "+100% / +150% / +200%", "높을수록 정확도↑, 빈도↓"],["기관/외국인 매집", "5일 누적 +500억", "+300억 / +500억 / +1,000억", "대형주 중심 권장"],["동반 상승", "테마 내 70% 상승", "60% / 70% / 80%", "높을수록 확실한 움직임"]], { x: 0.5, y: 1, w: 9, h: 2.5, fontSize: 12, color: TEXT_DARK, border: { pt: 0.5, color: CARD_BORDER }, fill: { color: WHITE }, colW: [1.8, 2.2, 2.5, 2.5], rowH: 0.6, valign: "middle" });
s12.addShape(pres.ShapeType.rect, { x: 0.5, y: 1, w: 9, h: 0.6, fill: { color: PRIMARY } });
["시그널", "기준안", "선택지", "비고"].forEach((h, i) => s12.addText(h, { x: 0.5 + [0, 1.8, 4, 6.5][i], y: 1, w: [1.8, 2.2, 2.5, 2.5][i], h: 0.6, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" }));
s12.addText("📌 논의 포인트", { x: 0.5, y: 3.8, w: 9, h: 0.4, fontSize: 16, color: DARK, bold: true });
["1. 기준값이 너무 높으면 시그널이 거의 안 뜸 → 사용자 이탈","2. 기준값이 너무 낮으면 노이즈가 많음 → 신뢰도 하락","3. 시장 상황에 따라 동적 조정 필요한가?","4. 초기에는 보수적으로 시작 후 데이터 보고 조정?"].forEach((p, i) => s12.addText(p, { x: 0.7, y: 4.25 + i * 0.35, w: 8.5, h: 0.3, fontSize: 12, color: TEXT_DARK }));

// S13: 기술 스택
let s13 = pres.addSlide(); s13.background = { color: LIGHT };
s13.addText("데이터 소스 및 기술 스택", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s13.addText("데이터 소스 (무료)", { x: 0.5, y: 0.95, w: 9, h: 0.4, fontSize: 18, color: PRIMARY, bold: true });
[["pykrx", "주가, 거래량, 기관/외국인 수급, PER, PBR"],["OpenDartReader", "재무제표 (매출, 영업이익, 부채 등)"],["TradingView-Screener", "RSI, MACD 등 기술지표"],["한국투자증권 API", "실시간 시세 (Phase 2)"]].forEach((ds, i) => {
  s13.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.4 + i * 0.55, w: 1.8, h: 0.45, fill: { color: ACCENT } });
  s13.addText(ds[0], { x: 0.5, y: 1.4 + i * 0.55, w: 1.8, h: 0.45, fontSize: 11, color: WHITE, align: "center", valign: "middle", bold: true });
  s13.addText(ds[1], { x: 2.4, y: 1.4 + i * 0.55, w: 7, h: 0.45, fontSize: 12, color: TEXT_DARK, valign: "middle" });
});
s13.addText("기술 스택", { x: 0.5, y: 3.7, w: 9, h: 0.4, fontSize: 18, color: PRIMARY, bold: true });
[{ layer: "프론트엔드", tech: "Tauri + React", desc: "경량 데스크톱 앱" },{ layer: "백엔드", tech: "Python", desc: "데이터 수집 및 분석" },{ layer: "데이터베이스", tech: "SQLite", desc: "로컬 저장소" },{ layer: "AI", tech: "Claude API", desc: "시야 AI 화면" }].forEach((t, i) => {
  const x = 0.5 + i * 2.35;
  s13.addShape(pres.ShapeType.roundRect, { x: x, y: 4.15, w: 2.2, h: 1.1, fill: { color: WHITE }, line: { color: PRIMARY, pt: 1 } });
  s13.addText(t.layer, { x: x, y: 4.2, w: 2.2, h: 0.3, fontSize: 10, color: TEXT_MUTED, align: "center" });
  s13.addText(t.tech, { x: x, y: 4.5, w: 2.2, h: 0.35, fontSize: 14, color: PRIMARY, bold: true, align: "center" });
  s13.addText(t.desc, { x: x, y: 4.85, w: 2.2, h: 0.3, fontSize: 10, color: TEXT_DARK, align: "center" });
});

// S14: 다음 단계
let s14 = pres.addSlide(); s14.background = { color: DARK };
s14.addText("다음 단계", { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, color: WHITE, bold: true });
[{ phase: "Phase 1", title: "MVP 개발", items: ["테마-종목 매핑 DB 구축", "시그널 계산 로직 구현", "기본 UI 완성"] },{ phase: "Phase 2", title: "기능 확장", items: ["실시간 데이터 연동", "시야 AI 통합", "알림 시스템"] },{ phase: "Phase 3", title: "최적화", items: ["백테스팅 기능", "성과 분석 대시보드", "사용자 피드백 반영"] }].forEach((ns, i) => {
  const x = 0.5 + i * 3.1;
  s14.addShape(pres.ShapeType.roundRect, { x: x, y: 1.1, w: 2.9, h: 3.2, fill: { color: "374151" } });
  s14.addText(ns.phase, { x: x, y: 1.25, w: 2.9, h: 0.35, fontSize: 12, color: ACCENT, align: "center" });
  s14.addText(ns.title, { x: x, y: 1.6, w: 2.9, h: 0.4, fontSize: 18, color: WHITE, bold: true, align: "center" });
  ns.items.forEach((item, j) => s14.addText("• " + item, { x: x + 0.2, y: 2.1 + j * 0.45, w: 2.5, h: 0.4, fontSize: 12, color: TEXT_MUTED }));
});
s14.addText("📋 이번 미팅에서 논의할 사항", { x: 0.5, y: 4.5, w: 9, h: 0.35, fontSize: 14, color: ACCENT, bold: true });
s14.addText("✓ 방향성 확인  ✓ 초기 테마 20개  ✓ 시그널 기준값  ✓ MVP 범위/일정  ✓ 기타 의견", { x: 0.5, y: 4.9, w: 9, h: 0.4, fontSize: 12, color: TEXT_MUTED });

// 저장
pres.writeFile({ fileName: "시야_PC앱_기획서_v3.pptx" }).then(() => console.log("PPT 생성 완료!")).catch(err => console.error("에러:", err));
