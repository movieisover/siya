const pptxgen = require("pptxgenjs");
let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = '시야 PC앱 기획서 v4';

const PRIMARY = "028090", ACCENT = "02C39A", DARK = "1E2761", LIGHT = "F8F9FA", WHITE = "FFFFFF";
const TEXT_DARK = "1E293B", TEXT_MUTED = "64748B", CARD_BORDER = "E2E8F0";
const RED = "DC2626", BLUE = "3B82F6", GREEN = "10B981", ORANGE = "F59E0B", PURPLE = "7C3AED", TEAL = "14B8A6", CORAL = "F97316", PINK = "EC4899", AMBER = "F59E0B";

// S1: 타이틀
let s1 = pres.addSlide(); s1.background = { color: DARK };
s1.addText("시야 PC앱 기획서", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 48, color: WHITE, bold: true });
s1.addText("한국 주식 가치투자 분석 앱", { x: 0.5, y: 3, w: 9, h: 0.6, fontSize: 24, color: ACCENT });
s1.addText("테마 분석 + 스크리너 | Top-down + Bottom-up 병행", { x: 0.5, y: 3.7, w: 9, h: 0.5, fontSize: 16, color: TEXT_MUTED });
s1.addText("2026.03 v4", { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 14, color: TEXT_MUTED });

// S2: 목차 (업데이트)
let s2 = pres.addSlide(); s2.background = { color: LIGHT };
s2.addText("목차", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
const tocItems = [
  "1. 시야란 무엇인가?",
  "2. 두 가지 분석 방식",
  "3. 화면 구성 및 PC 목업",
  "4. 스크리너 기능 & 종합 점수 계산",
  "5. 테마 시그널 & 신뢰도 & 방향예측 & 타이밍",
  "6. 데이터 흐름도",
  "7. 시야 AI 화면",
  "8. 테마 목록 & 시그널 기준",
  "9. 기술 스택 & 다음 단계"
];
tocItems.forEach((t,i) => s2.addText(t, { x: 0.7, y: 1.1 + i * 0.5, w: 8, h: 0.45, fontSize: 18, color: TEXT_DARK }));

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
s4.addTable([["구분", "테마 분석 (Top-down)", "스크리너 (Bottom-up)"],["시작점", "시장 테마/섹터", "개별 종목 지표"],["분석 흐름", "테마 → 시그널 → 종목", "필터 → 정렬 → 종목"],["핵심 질문", '"지금 어떤 테마가 뜨나?"', '"저평가된 우량주는?"'],["주요 지표", "거래량, 수급, 동반상승, RSI/MACD", "PER, PBR, ROE, 부채비율"],["적합한 투자자", "트렌드/모멘텀 중시", "가치/퀄리티 중시"]], { x: 0.5, y: 1, w: 9, h: 3.5, fontSize: 12, color: TEXT_DARK, border: { pt: 0.5, color: CARD_BORDER }, fill: { color: WHITE }, colW: [1.8, 3.6, 3.6], rowH: 0.55, valign: "middle", align: "center" });
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
s6.addText("신뢰도: HIGH", { x: 5.3, y: 1.28, w: 0.85, h: 0.25, fontSize: 9, color: GREEN, align: "right" });
s6.addShape(pres.ShapeType.roundRect, { x: 6.2, y: 1.28, w: 0.8, h: 0.25, fill: { color: "D1FAE5" } });
s6.addText("⬆ 진입적기", { x: 6.2, y: 1.28, w: 0.8, h: 0.25, fontSize: 7, color: "065F46", align: "center", valign: "middle" });
[{ title: "거래량 급증", value: "+156%", color: RED },{ title: "기관 순매수", value: "+823억", color: BLUE },{ title: "동반 상승", value: "78%", color: GREEN }].forEach((sig, i) => {
  s6.addShape(pres.ShapeType.roundRect, { x: 2.85 + i * 1.4, y: 1.7, w: 1.3, h: 0.9, fill: { color: "374151" } });
  s6.addText(sig.title, { x: 2.85 + i * 1.4, y: 1.75, w: 1.3, h: 0.25, fontSize: 8, color: TEXT_MUTED, align: "center" });
  s6.addText(sig.value, { x: 2.85 + i * 1.4, y: 2, w: 1.3, h: 0.3, fontSize: 14, color: sig.color, bold: true, align: "center" });
});
s6.addText("RSI 58 | MACD 골든크로스 72%", { x: 2.85, y: 2.65, w: 4.1, h: 0.2, fontSize: 8, color: ACCENT, align: "center" });
s6.addText("관련 종목", { x: 2.85, y: 2.85, w: 2, h: 0.25, fontSize: 10, color: WHITE, bold: true });
[["삼성전자", "72,500", "+3.2%", "92"],["SK하이닉스", "142,000", "+4.1%", "88"],["한미반도체", "89,200", "+2.8%", "85"]].forEach((st, i) => {
  s6.addShape(pres.ShapeType.roundRect, { x: 2.85, y: 3.15 + i * 0.55, w: 4.1, h: 0.48, fill: { color: "374151" } });
  s6.addText(st[0], { x: 2.95, y: 3.2 + i * 0.55, w: 1.2, h: 0.4, fontSize: 10, color: WHITE, valign: "middle" });
  s6.addText(st[1], { x: 4.1, y: 3.2 + i * 0.55, w: 1, h: 0.4, fontSize: 10, color: WHITE, align: "right", valign: "middle" });
  s6.addText(st[2], { x: 5.1, y: 3.2 + i * 0.55, w: 0.8, h: 0.4, fontSize: 10, color: GREEN, align: "right", valign: "middle" });
  s6.addText(st[3], { x: 5.9, y: 3.2 + i * 0.55, w: 0.9, h: 0.4, fontSize: 10, color: ACCENT, align: "center", valign: "middle" });
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
s8.addText("종합 점수 = 품질(50점) + 밸류에이션(20점) + 개선(30점)  ← 만점 100점", { x: 0.9, y: 4, w: 8.2, h: 0.4, fontSize: 14, color: DARK, bold: true, align: "center" });
[["품질 점수 (50점)", "ROE (20점) + ROA (15점) + 영업이익률 (15점)"],["밸류에이션 점수 (20점)", "PBR 점수 (10점) + PER 상대점수 (10점)"],["개선 점수 (30점)", "ROE 개선 (12점) + 영업이익률 개선 (12점) + PBR 하락 (6점)"]].forEach((f, i) => {
  s8.addText("• " + f[0] + ": ", { x: 0.9, y: 4.55 + i * 0.3, w: 2.2, h: 0.25, fontSize: 11, color: TEXT_DARK, bold: true });
  s8.addText(f[1], { x: 3.1, y: 4.55 + i * 0.3, w: 5.5, h: 0.25, fontSize: 11, color: TEXT_MUTED });
});

// S9: 종합 점수 계산 로직 상세 (NEW)
let s9 = pres.addSlide(); s9.background = { color: LIGHT };
s9.addText("종합 점수 계산 상세", { x: 0.5, y: 0.25, w: 9, h: 0.5, fontSize: 28, color: TEXT_DARK, bold: true });

// Quality Score
s9.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 0.8, w: 3, h: 2.8, fill: { color: WHITE }, line: { color: GREEN, pt: 2 } });
s9.addText("품질 점수 (50점)", { x: 0.55, y: 0.95, w: 2.7, h: 0.35, fontSize: 13, color: GREEN, bold: true });
s9.addText("수익성 평가", { x: 0.55, y: 1.25, w: 2.7, h: 0.25, fontSize: 10, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 0.55, y: 1.55, w: 2.7, h: 0.5, fill: { color: "F0FDF4" } });
s9.addText("ROE", { x: 0.65, y: 1.62, w: 1.2, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("20점", { x: 2.55, y: 1.62, w: 0.6, h: 0.2, fontSize: 10, color: GREEN, align: "right" });
s9.addText("min(ROE × 1, 20)", { x: 0.65, y: 1.82, w: 2.5, h: 0.18, fontSize: 9, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 0.55, y: 2.1, w: 2.7, h: 0.5, fill: { color: "F0FDF4" } });
s9.addText("ROA", { x: 0.65, y: 2.17, w: 1.2, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("15점", { x: 2.55, y: 2.17, w: 0.6, h: 0.2, fontSize: 10, color: GREEN, align: "right" });
s9.addText("min(ROA × 1.5, 15)", { x: 0.65, y: 2.37, w: 2.5, h: 0.18, fontSize: 9, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 0.55, y: 2.65, w: 2.7, h: 0.5, fill: { color: "F0FDF4" } });
s9.addText("영업이익률", { x: 0.65, y: 2.72, w: 1.2, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("15점", { x: 2.55, y: 2.72, w: 0.6, h: 0.2, fontSize: 10, color: GREEN, align: "right" });
s9.addText("min(영업이익률 × 1, 15)", { x: 0.65, y: 2.92, w: 2.5, h: 0.18, fontSize: 9, color: TEXT_MUTED });

// Valuation Score
s9.addShape(pres.ShapeType.roundRect, { x: 3.55, y: 0.8, w: 3, h: 2.8, fill: { color: WHITE }, line: { color: PURPLE, pt: 2 } });
s9.addText("밸류에이션 (20점)", { x: 3.7, y: 0.95, w: 2.7, h: 0.35, fontSize: 13, color: PURPLE, bold: true });
s9.addText("저평가 정도", { x: 3.7, y: 1.25, w: 2.7, h: 0.25, fontSize: 10, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 3.7, y: 1.55, w: 2.7, h: 0.7, fill: { color: "F5F3FF" } });
s9.addText("PBR 점수", { x: 3.8, y: 1.62, w: 1.4, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("10점", { x: 5.7, y: 1.62, w: 0.6, h: 0.2, fontSize: 10, color: PURPLE, align: "right" });
s9.addText("max(10 - PBR×5, 0)", { x: 3.8, y: 1.82, w: 2.5, h: 0.18, fontSize: 9, color: TEXT_MUTED });
s9.addText("PBR 낮을수록 고득점", { x: 3.8, y: 2, w: 2.5, h: 0.18, fontSize: 8, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 3.7, y: 2.3, w: 2.7, h: 0.85, fill: { color: "F5F3FF" } });
s9.addText("PER 상대점수", { x: 3.8, y: 2.37, w: 1.4, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("10점", { x: 5.7, y: 2.37, w: 0.6, h: 0.2, fontSize: 10, color: PURPLE, align: "right" });
s9.addText("max(10-(PER/업종평균)×5, 0)", { x: 3.8, y: 2.57, w: 2.5, h: 0.18, fontSize: 8, color: TEXT_MUTED });
s9.addText("업종 평균 대비 저평가 시 고득점", { x: 3.8, y: 2.75, w: 2.5, h: 0.18, fontSize: 8, color: TEXT_MUTED });

// Improvement Score
s9.addShape(pres.ShapeType.roundRect, { x: 6.7, y: 0.8, w: 3, h: 2.8, fill: { color: WHITE }, line: { color: ORANGE, pt: 2 } });
s9.addText("개선 점수 (30점)", { x: 6.85, y: 0.95, w: 2.7, h: 0.35, fontSize: 13, color: ORANGE, bold: true });
s9.addText("재무 개선 추세", { x: 6.85, y: 1.25, w: 2.7, h: 0.25, fontSize: 10, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 6.85, y: 1.55, w: 2.7, h: 0.5, fill: { color: "FFFBEB" } });
s9.addText("ROE 개선", { x: 6.95, y: 1.62, w: 1.4, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("12점", { x: 8.85, y: 1.62, w: 0.6, h: 0.2, fontSize: 10, color: ORANGE, align: "right" });
s9.addText("min(max(ROE변화×2, 0), 12)", { x: 6.95, y: 1.82, w: 2.5, h: 0.18, fontSize: 8, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 6.85, y: 2.1, w: 2.7, h: 0.5, fill: { color: "FFFBEB" } });
s9.addText("영업이익률 개선", { x: 6.95, y: 2.17, w: 1.6, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("12점", { x: 8.85, y: 2.17, w: 0.6, h: 0.2, fontSize: 10, color: ORANGE, align: "right" });
s9.addText("min(max(변화×2, 0), 12)", { x: 6.95, y: 2.37, w: 2.5, h: 0.18, fontSize: 8, color: TEXT_MUTED });
s9.addShape(pres.ShapeType.rect, { x: 6.85, y: 2.65, w: 2.7, h: 0.5, fill: { color: "FFFBEB" } });
s9.addText("PBR 하락", { x: 6.95, y: 2.72, w: 1.2, h: 0.2, fontSize: 10, color: TEXT_DARK, bold: true });
s9.addText("6점", { x: 8.85, y: 2.72, w: 0.6, h: 0.2, fontSize: 10, color: ORANGE, align: "right" });
s9.addText("min(max(PBR하락폭×10, 0), 6)", { x: 6.95, y: 2.92, w: 2.5, h: 0.18, fontSize: 8, color: TEXT_MUTED });

// Example
s9.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 3.75, w: 9.3, h: 1.0, fill: { color: "F0F9FF" }, line: { color: BLUE, pt: 1 } });
s9.addText("예시: 삼성전자 (ROE 15.2%, ROA 8.5%, 영업이익률 12.3%, PBR 1.42, PER 12.3)", { x: 0.6, y: 3.9, w: 9, h: 0.25, fontSize: 11, color: TEXT_DARK });
s9.addText("→ 품질 40.25점 + 밸류 8.8점 + 개선 8.7점 = 57.75점 / 100점", { x: 0.6, y: 4.2, w: 7, h: 0.3, fontSize: 12, color: BLUE, bold: true });

// Design Principles
s9.addText("설계 원칙", { x: 0.4, y: 4.85, w: 2, h: 0.3, fontSize: 13, color: TEXT_DARK, bold: true });
s9.addText("• 선형 보간 + 상한선: 극단값이 점수를 왜곡하지 않도록  • 음수 방지: 고평가 종목도 0점 (마이너스 없음)  • 업종 상대 비교: PER은 업종 평균 대비 비율 사용", { x: 0.4, y: 5.1, w: 9.3, h: 0.35, fontSize: 10, color: TEXT_MUTED });

// S10: 테마 시그널 (수정 - 등급 기준 수정)
let s10 = pres.addSlide(); s10.background = { color: LIGHT };
s10.addText("테마 시그널 감지", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
[{ title: "거래량 급증", icon: "📈", desc: "테마 관련 종목들의\n거래량이 급증할 때", metric: "20일 평균 대비\n+100% 이상", color: RED },{ title: "기관/외국인 매집", icon: "🏦", desc: "기관/외국인이\n집중 매수할 때", metric: "5일 누적\n+500억 이상", color: BLUE },{ title: "동반 상승", icon: "🚀", desc: "테마 내 종목들이\n함께 상승할 때", metric: "테마 내 70% 이상\n종목 상승", color: GREEN }].forEach((card, i) => {
  const x = 0.5 + i * 3.1;
  s10.addShape(pres.ShapeType.roundRect, { x: x, y: 1, w: 2.9, h: 3.5, fill: { color: WHITE }, line: { color: card.color, pt: 2 } });
  s10.addText(card.icon, { x: x, y: 1.15, w: 2.9, h: 0.6, fontSize: 36, align: "center" });
  s10.addText(card.title, { x: x + 0.2, y: 1.8, w: 2.5, h: 0.4, fontSize: 16, color: card.color, bold: true, align: "center" });
  s10.addText(card.desc, { x: x + 0.2, y: 2.3, w: 2.5, h: 0.8, fontSize: 12, color: TEXT_DARK, align: "center" });
  s10.addShape(pres.ShapeType.rect, { x: x + 0.2, y: 3.2, w: 2.5, h: 0.7, fill: { color: "F1F5F9" } });
  s10.addText(card.metric, { x: x + 0.2, y: 3.25, w: 2.5, h: 0.6, fontSize: 11, color: card.color, align: "center", bold: true });
});
// 수정된 등급 기준
s10.addText("신뢰도 등급: HIGH (70~100점) | MEDIUM (40~69점) | LOW (0~39점)", { x: 0.5, y: 4.7, w: 9, h: 0.4, fontSize: 12, color: TEXT_MUTED, align: "center" });

// S11: 테마 신뢰도 계산 로직 (NEW)
let s11 = pres.addSlide(); s11.background = { color: LIGHT };
s11.addText("테마 신뢰도 계산 로직", { x: 0.5, y: 0.25, w: 9, h: 0.5, fontSize: 28, color: TEXT_DARK, bold: true });

// Main formula
s11.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 0.75, w: 9.3, h: 0.5, fill: { color: "F5F3FF" }, line: { color: PURPLE, pt: 1 } });
s11.addText("신뢰도 점수 = 거래량(30점) + 수급(50점) + 동반상승(20점)  ← 만점 100점", { x: 0.6, y: 0.85, w: 9, h: 0.35, fontSize: 13, color: PURPLE, bold: true, align: "center" });

// Volume Score
s11.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 1.4, w: 3, h: 2.1, fill: { color: WHITE }, line: { color: CORAL, pt: 1 } });
s11.addText("거래량 급증 (30점)", { x: 0.55, y: 1.5, w: 2.7, h: 0.3, fontSize: 12, color: CORAL, bold: true });
[{ r: "+50% 미만", s: "0점" },{ r: "+50%~+100%", s: "10점" },{ r: "+100%~+200%", s: "20점" },{ r: "+200% 이상", s: "30점" }].forEach((row, i) => {
  s11.addText(row.r, { x: 0.55, y: 1.85 + i * 0.35, w: 1.8, h: 0.3, fontSize: 10, color: TEXT_DARK });
  s11.addText(row.s, { x: 2.55, y: 1.85 + i * 0.35, w: 0.7, h: 0.3, fontSize: 10, color: CORAL, align: "right", bold: true });
});
s11.addText("min((증가율%-50)/5, 30)", { x: 0.55, y: 3.25, w: 2.7, h: 0.2, fontSize: 8, color: TEXT_MUTED });

// Supply Score (Most Important)
s11.addShape(pres.ShapeType.roundRect, { x: 3.55, y: 1.4, w: 3, h: 2.1, fill: { color: WHITE }, line: { color: BLUE, pt: 2 } });
s11.addText("수급 점수 (50점) ⭐", { x: 3.7, y: 1.5, w: 2.7, h: 0.3, fontSize: 12, color: BLUE, bold: true });
[{ r: "순매도", s: "0점" },{ r: "0~+100억", s: "10점" },{ r: "+100~+300억", s: "20점" },{ r: "+300~+500억", s: "35점" },{ r: "+500억 이상", s: "50점" }].forEach((row, i) => {
  s11.addText(row.r, { x: 3.7, y: 1.8 + i * 0.28, w: 1.8, h: 0.25, fontSize: 10, color: TEXT_DARK });
  s11.addText(row.s, { x: 5.7, y: 1.8 + i * 0.28, w: 0.7, h: 0.25, fontSize: 10, color: BLUE, align: "right", bold: true });
});
s11.addText("min(max(순매수억/10, 0), 50)", { x: 3.7, y: 3.25, w: 2.7, h: 0.2, fontSize: 8, color: TEXT_MUTED });

// Concurrent Rise
s11.addShape(pres.ShapeType.roundRect, { x: 6.7, y: 1.4, w: 3, h: 2.1, fill: { color: WHITE }, line: { color: TEAL, pt: 1 } });
s11.addText("동반상승 (20점)", { x: 6.85, y: 1.5, w: 2.7, h: 0.3, fontSize: 12, color: TEAL, bold: true });
[{ r: "50% 미만", s: "0점" },{ r: "50%~60%", s: "5점" },{ r: "60%~70%", s: "10점" },{ r: "70%~80%", s: "15점" },{ r: "80% 이상", s: "20점" }].forEach((row, i) => {
  s11.addText(row.r, { x: 6.85, y: 1.8 + i * 0.28, w: 1.8, h: 0.25, fontSize: 10, color: TEXT_DARK });
  s11.addText(row.s, { x: 8.85, y: 1.8 + i * 0.28, w: 0.7, h: 0.25, fontSize: 10, color: TEAL, align: "right", bold: true });
});
s11.addText("min(max((비율%-50)×0.67, 0), 20)", { x: 6.85, y: 3.25, w: 2.7, h: 0.2, fontSize: 8, color: TEXT_MUTED });

// Grade Classification
s11.addText("신뢰도 등급", { x: 0.4, y: 3.65, w: 2, h: 0.3, fontSize: 12, color: TEXT_DARK, bold: true });
s11.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 3.95, w: 2.8, h: 0.5, fill: { color: "FEE2E2" }, line: { color: "EF4444", pt: 1 } });
s11.addText("LOW: 0~39점", { x: 0.4, y: 4.05, w: 2.8, h: 0.35, fontSize: 12, color: "991B1B", align: "center", bold: true });
s11.addShape(pres.ShapeType.roundRect, { x: 3.4, y: 3.95, w: 2.8, h: 0.5, fill: { color: "FEF3C7" }, line: { color: ORANGE, pt: 1 } });
s11.addText("MEDIUM: 40~69점", { x: 3.4, y: 4.05, w: 2.8, h: 0.35, fontSize: 12, color: "92400E", align: "center", bold: true });
s11.addShape(pres.ShapeType.roundRect, { x: 6.4, y: 3.95, w: 3.0, h: 0.5, fill: { color: "D1FAE5" }, line: { color: GREEN, pt: 1 } });
s11.addText("HIGH: 70~100점", { x: 6.4, y: 4.05, w: 3.0, h: 0.35, fontSize: 12, color: "065F46", align: "center", bold: true });

// Example
s11.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 4.6, w: 9.3, h: 0.85, fill: { color: "F0F9FF" }, line: { color: BLUE, pt: 1 } });
s11.addText("예시: AI/반도체 테마 — 거래량 +150% (20점) + 수급 +420억 (42점) + 동반상승 75% (15점) = 77점 → HIGH", { x: 0.6, y: 4.8, w: 9, h: 0.5, fontSize: 11, color: BLUE, bold: true });

// S12: 방향예측 로직 (NEW)
let s12 = pres.addSlide(); s12.background = { color: LIGHT };
s12.addText("방향예측 로직", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });

// Warning
s12.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 0.95, w: 9, h: 0.5, fill: { color: "FEF3C7" }, line: { color: ORANGE, pt: 1 } });
s12.addText("⚠️ AI 예측이 아닌 시그널 데이터를 조합한 단순 판단입니다", { x: 0.7, y: 1.05, w: 8.6, h: 0.35, fontSize: 12, color: "92400E", align: "center" });

// Decision Matrix
s12.addText("방향예측 조건표", { x: 0.5, y: 1.6, w: 3, h: 0.35, fontSize: 14, color: TEXT_DARK, bold: true });

// Header
s12.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.95, w: 3.5, h: 0.5, fill: { color: DARK } });
s12.addText("조건", { x: 0.5, y: 2.05, w: 3.5, h: 0.35, fontSize: 12, color: WHITE, align: "center", bold: true });
s12.addShape(pres.ShapeType.rect, { x: 4, y: 1.95, w: 5.5, h: 0.5, fill: { color: DARK } });
s12.addText("표시", { x: 4, y: 2.05, w: 5.5, h: 0.35, fontSize: 12, color: WHITE, align: "center", bold: true });

// Row 1: HIGH
s12.addShape(pres.ShapeType.rect, { x: 0.5, y: 2.45, w: 3.5, h: 0.7, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 0.5 } });
s12.addText("신뢰도 HIGH + 순매수 양수", { x: 0.6, y: 2.65, w: 3.3, h: 0.35, fontSize: 11, color: TEXT_DARK, align: "center" });
s12.addShape(pres.ShapeType.rect, { x: 4, y: 2.45, w: 5.5, h: 0.7, fill: { color: "D1FAE5" }, line: { color: GREEN, pt: 0.5 } });
s12.addText("⬆ 상승 가능성 높음", { x: 4.2, y: 2.65, w: 5, h: 0.35, fontSize: 14, color: "065F46", bold: true, align: "center" });

// Row 2: MEDIUM
s12.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.15, w: 3.5, h: 0.7, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 0.5 } });
s12.addText("신뢰도 MEDIUM + 순매수 양수", { x: 0.6, y: 3.35, w: 3.3, h: 0.35, fontSize: 11, color: TEXT_DARK, align: "center" });
s12.addShape(pres.ShapeType.rect, { x: 4, y: 3.15, w: 5.5, h: 0.7, fill: { color: "FEF3C7" }, line: { color: ORANGE, pt: 0.5 } });
s12.addText("↗ 상승 가능성 있음", { x: 4.2, y: 3.35, w: 5, h: 0.35, fontSize: 14, color: "92400E", bold: true, align: "center" });

// Row 3: LOW
s12.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.85, w: 3.5, h: 0.7, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 0.5 } });
s12.addText("신뢰도 LOW 또는 순매도", { x: 0.6, y: 4.05, w: 3.3, h: 0.35, fontSize: 11, color: TEXT_DARK, align: "center" });
s12.addShape(pres.ShapeType.rect, { x: 4, y: 3.85, w: 5.5, h: 0.7, fill: { color: "F3F4F6" }, line: { color: "9CA3AF", pt: 0.5 } });
s12.addText("— 관망", { x: 4.2, y: 4.05, w: 5, h: 0.35, fontSize: 14, color: "6B7280", bold: true, align: "center" });

// Key Point
s12.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.75, w: 9, h: 0.6, fill: { color: "EFF6FF" }, line: { color: BLUE, pt: 1 } });
s12.addText("💡 핵심: 신뢰도 등급 + 순매수 방향을 조합하여 단순하게 방향성 표시 (면책 문구 필수)", { x: 0.7, y: 4.9, w: 8.6, h: 0.35, fontSize: 11, color: BLUE, align: "center" });

// S12.5: 타이밍 지표 (NEW)
let s12b = pres.addSlide(); s12b.background = { color: LIGHT };
s12b.addText("타이밍 지표 (RSI/MACD)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });

// Concept
s12b.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 0.95, w: 9, h: 0.55, fill: { color: "EFF6FF" }, line: { color: BLUE, pt: 1 } });
s12b.addText("신뢰도 = 테마가 살아있나? (pykrx)  |  타이밍 = 지금 들어가도 되나? (TradingView)", { x: 0.7, y: 1.05, w: 8.6, h: 0.4, fontSize: 13, color: BLUE, align: "center", bold: true });

// RSI Card
s12b.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.65, w: 4.2, h: 2.0, fill: { color: WHITE }, line: { color: PURPLE, pt: 2 } });
s12b.addText("RSI 기반 판단 (테마 과열도)", { x: 0.7, y: 1.75, w: 3.8, h: 0.35, fontSize: 14, color: PURPLE, bold: true });
s12b.addText("테마 내 종목 RSI 14일 평균값", { x: 0.7, y: 2.1, w: 3.8, h: 0.25, fontSize: 10, color: TEXT_MUTED });
s12b.addShape(pres.ShapeType.rect, { x: 0.7, y: 2.4, w: 3.8, h: 0.35, fill: { color: "FEE2E2" } });
s12b.addText("70 이상 → 과열 (과매수)", { x: 0.8, y: 2.45, w: 3.6, h: 0.25, fontSize: 11, color: RED, bold: true });
s12b.addShape(pres.ShapeType.rect, { x: 0.7, y: 2.8, w: 3.8, h: 0.35, fill: { color: "F3F4F6" } });
s12b.addText("30~70 → 중립", { x: 0.8, y: 2.85, w: 3.6, h: 0.25, fontSize: 11, color: TEXT_DARK });
s12b.addShape(pres.ShapeType.rect, { x: 0.7, y: 3.2, w: 3.8, h: 0.35, fill: { color: "D1FAE5" } });
s12b.addText("30 이하 → 저점 (과매도)", { x: 0.8, y: 3.25, w: 3.6, h: 0.25, fontSize: 11, color: GREEN, bold: true });

// MACD Card
s12b.addShape(pres.ShapeType.roundRect, { x: 5.3, y: 1.65, w: 4.2, h: 2.0, fill: { color: WHITE }, line: { color: TEAL, pt: 2 } });
s12b.addText("MACD 기반 판단 (추세 방향)", { x: 5.5, y: 1.75, w: 3.8, h: 0.35, fontSize: 14, color: TEAL, bold: true });
s12b.addText("테마 내 MACD 골든크로스 비율", { x: 5.5, y: 2.1, w: 3.8, h: 0.25, fontSize: 10, color: TEXT_MUTED });
s12b.addShape(pres.ShapeType.rect, { x: 5.5, y: 2.4, w: 3.8, h: 0.35, fill: { color: "D1FAE5" } });
s12b.addText("60% 이상 → 상승 추세", { x: 5.6, y: 2.45, w: 3.6, h: 0.25, fontSize: 11, color: GREEN, bold: true });
s12b.addShape(pres.ShapeType.rect, { x: 5.5, y: 2.8, w: 3.8, h: 0.35, fill: { color: "FEF3C7" } });
s12b.addText("40~60% → 혼조", { x: 5.6, y: 2.85, w: 3.6, h: 0.25, fontSize: 11, color: "92400E" });
s12b.addShape(pres.ShapeType.rect, { x: 5.5, y: 3.2, w: 3.8, h: 0.35, fill: { color: "FEE2E2" } });
s12b.addText("40% 미만 → 하락 추세", { x: 5.6, y: 3.25, w: 3.6, h: 0.25, fontSize: 11, color: RED, bold: true });

// Timing Grade
s12b.addText("타이밍 종합 등급", { x: 0.5, y: 3.8, w: 3, h: 0.3, fontSize: 14, color: TEXT_DARK, bold: true });
s12b.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.1, w: 3, h: 0.65, fill: { color: "D1FAE5" }, line: { color: GREEN, pt: 1 } });
s12b.addText("\u{1F7E2} 진입 적기", { x: 0.6, y: 4.15, w: 2.8, h: 0.25, fontSize: 12, color: "065F46", bold: true, align: "center" });
s12b.addText("RSI<70 AND 골든크로스\u226560%", { x: 0.6, y: 4.42, w: 2.8, h: 0.25, fontSize: 9, color: "065F46", align: "center" });
s12b.addShape(pres.ShapeType.roundRect, { x: 3.7, y: 4.1, w: 3, h: 0.65, fill: { color: "FEE2E2" }, line: { color: RED, pt: 1 } });
s12b.addText("\u{1F534} 과열/하락 주의", { x: 3.8, y: 4.15, w: 2.8, h: 0.25, fontSize: 12, color: "991B1B", bold: true, align: "center" });
s12b.addText("RSI\u226570 OR 골든크로스<40%", { x: 3.8, y: 4.42, w: 2.8, h: 0.25, fontSize: 9, color: "991B1B", align: "center" });
s12b.addShape(pres.ShapeType.roundRect, { x: 6.9, y: 4.1, w: 2.7, h: 0.65, fill: { color: "FEF3C7" }, line: { color: ORANGE, pt: 1 } });
s12b.addText("\u{1F7E1} 관망", { x: 7, y: 4.15, w: 2.5, h: 0.25, fontSize: 12, color: "92400E", bold: true, align: "center" });
s12b.addText("그 외 (혼조 상태)", { x: 7, y: 4.42, w: 2.5, h: 0.25, fontSize: 9, color: "92400E", align: "center" });

// Key insight
s12b.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 4.95, w: 9, h: 0.55, fill: { color: "F5F3FF" }, line: { color: PURPLE, pt: 1 } });
s12b.addText("💡 신뢰도 HIGH + 타이밍 진입적기 = 가장 좋은 조합  |  신뢰도 HIGH + 과열주의 = 테마는 강하지만 조심", { x: 0.7, y: 5.05, w: 8.6, h: 0.4, fontSize: 11, color: PURPLE, align: "center" });

// S13: 용어 설명
let s13 = pres.addSlide(); s13.background = { color: LIGHT };
s13.addText("투자 용어 설명", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
[{ term: "PER", full: "Price to Earnings Ratio", desc: "주가 ÷ 주당순이익. 낮을수록 저평가", ex: "PER 10 = 10년치 이익으로 시총 회수" },{ term: "PBR", full: "Price to Book Ratio", desc: "주가 ÷ 주당순자산. 1 미만이면 청산가치 이하", ex: "PBR 0.8 = 순자산보다 20% 할인" },{ term: "ROE", full: "Return on Equity", desc: "당기순이익 ÷ 자기자본. 높을수록 수익성 좋음", ex: "ROE 15% = 자본 100원으로 15원 벌음" },{ term: "부채비율", full: "Debt to Equity", desc: "부채 ÷ 자기자본. 낮을수록 재무건전성 좋음", ex: "100% = 부채와 자본이 같음" },{ term: "RSI", full: "Relative Strength Index", desc: "과매수/과매도 지표. 70↑ 과매수, 30↓ 과매도", ex: "RSI 25 = 과매도, 반등 가능성" },{ term: "MACD", full: "Moving Average Convergence Divergence", desc: "추세 전환 시그널. 골든크로스/데드크로스", ex: "MACD 골든크로스 = 상승 전환" }].forEach((t, i) => {
  const row = Math.floor(i / 2), col = i % 2, x = 0.5 + col * 4.7, y = 0.95 + row * 1.45;
  s13.addShape(pres.ShapeType.roundRect, { x: x, y: y, w: 4.5, h: 1.35, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 1 } });
  s13.addText(t.term, { x: x + 0.15, y: y + 0.1, w: 0.8, h: 0.35, fontSize: 16, color: PRIMARY, bold: true });
  s13.addText(t.full, { x: x + 1, y: y + 0.15, w: 3.3, h: 0.25, fontSize: 9, color: TEXT_MUTED });
  s13.addText(t.desc, { x: x + 0.15, y: y + 0.45, w: 4.2, h: 0.35, fontSize: 11, color: TEXT_DARK });
  s13.addText("예) " + t.ex, { x: x + 0.15, y: y + 0.85, w: 4.2, h: 0.35, fontSize: 10, color: ACCENT, italic: true });
});

// S14: 테마 목록
let s14 = pres.addSlide(); s14.background = { color: LIGHT };
s14.addText("테마 목록 (20개)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
[{ cat: "첨단기술", themes: ["AI/반도체", "로봇/자동화", "우주항공", "양자컴퓨팅"], color: BLUE },{ cat: "에너지/소재", themes: ["2차전지", "신재생에너지", "수소경제", "희토류"], color: GREEN },{ cat: "바이오/헬스", themes: ["바이오/제약", "의료기기", "디지털헬스", "고령화/실버"], color: RED },{ cat: "산업/방산", themes: ["방위산업", "조선/해운", "건설/인프라", "원자력"], color: ORANGE },{ cat: "금융/소비", themes: ["금융/핀테크", "게임/엔터", "리츠/부동산", "화장품/K뷰티"], color: PRIMARY }].forEach((c, i) => {
  const y = 0.95 + i * 0.85;
  s14.addShape(pres.ShapeType.roundRect, { x: 0.5, y: y, w: 1.8, h: 0.7, fill: { color: c.color } });
  s14.addText(c.cat, { x: 0.5, y: y, w: 1.8, h: 0.7, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" });
  c.themes.forEach((t, j) => {
    s14.addShape(pres.ShapeType.roundRect, { x: 2.5 + j * 1.8, y: y, w: 1.65, h: 0.7, fill: { color: WHITE }, line: { color: c.color, pt: 1 } });
    s14.addText(t, { x: 2.5 + j * 1.8, y: y, w: 1.65, h: 0.7, fontSize: 11, color: TEXT_DARK, align: "center", valign: "middle" });
  });
});

// S15: 시그널 기준
let s15 = pres.addSlide(); s15.background = { color: LIGHT };
s15.addText("시그널 기준 (논의 필요)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s15.addTable([["시그널", "기준안", "선택지", "비고"],["거래량 급증", "20일 평균 대비 +100%", "+100% / +150% / +200%", "높을수록 정확도↑, 빈도↓"],["기관/외국인 매집", "5일 누적 +500억", "+300억 / +500억 / +1,000억", "대형주 중심 권장"],["동반 상승", "테마 내 70% 상승", "60% / 70% / 80%", "높을수록 확실한 움직임"]], { x: 0.5, y: 1, w: 9, h: 2.5, fontSize: 12, color: TEXT_DARK, border: { pt: 0.5, color: CARD_BORDER }, fill: { color: WHITE }, colW: [1.8, 2.2, 2.5, 2.5], rowH: 0.6, valign: "middle" });
s15.addShape(pres.ShapeType.rect, { x: 0.5, y: 1, w: 9, h: 0.6, fill: { color: PRIMARY } });
["시그널", "기준안", "선택지", "비고"].forEach((h, i) => s15.addText(h, { x: 0.5 + [0, 1.8, 4, 6.5][i], y: 1, w: [1.8, 2.2, 2.5, 2.5][i], h: 0.6, fontSize: 12, color: WHITE, bold: true, align: "center", valign: "middle" }));
s15.addText("📌 논의 포인트", { x: 0.5, y: 3.8, w: 9, h: 0.4, fontSize: 16, color: DARK, bold: true });
["1. 기준값이 너무 높으면 시그널이 거의 안 뜸 → 사용자 이탈","2. 기준값이 너무 낮으면 노이즈가 많음 → 신뢰도 하락","3. 시장 상황에 따라 동적 조정 필요한가?","4. 초기에는 보수적으로 시작 후 데이터 보고 조정?"].forEach((p, i) => s15.addText(p, { x: 0.7, y: 4.25 + i * 0.35, w: 8.5, h: 0.3, fontSize: 12, color: TEXT_DARK }));

// S16: 데이터 흐름도 (NEW)
let s16 = pres.addSlide(); s16.background = { color: LIGHT };
s16.addText("데이터 흐름도", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });

// Data Sources
s16.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 1, w: 2.5, h: 2.5, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 1, dashType: "dash" } });
s16.addText("데이터 소스", { x: 0.5, y: 1.1, w: 2.3, h: 0.3, fontSize: 11, color: TEXT_MUTED });
s16.addShape(pres.ShapeType.roundRect, { x: 0.55, y: 1.45, w: 2.2, h: 0.55, fill: { color: "3B82F6" } });
s16.addText("pykrx", { x: 0.55, y: 1.5, w: 2.2, h: 0.25, fontSize: 11, color: WHITE, bold: true, align: "center" });
s16.addText("주가, PER, PBR, 수급", { x: 0.55, y: 1.75, w: 2.2, h: 0.2, fontSize: 8, color: WHITE, align: "center" });
s16.addShape(pres.ShapeType.roundRect, { x: 0.55, y: 2.1, w: 2.2, h: 0.55, fill: { color: TEAL } });
s16.addText("OpenDartReader", { x: 0.55, y: 2.15, w: 2.2, h: 0.25, fontSize: 11, color: WHITE, bold: true, align: "center" });
s16.addText("재무제표", { x: 0.55, y: 2.4, w: 2.2, h: 0.2, fontSize: 8, color: WHITE, align: "center" });
s16.addShape(pres.ShapeType.roundRect, { x: 0.55, y: 2.75, w: 2.2, h: 0.55, fill: { color: PURPLE } });
s16.addText("TradingView", { x: 0.55, y: 2.8, w: 2.2, h: 0.25, fontSize: 11, color: WHITE, bold: true, align: "center" });
s16.addText("RSI, MACD", { x: 0.55, y: 3.05, w: 2.2, h: 0.2, fontSize: 8, color: WHITE, align: "center" });

// Arrow to DB
s16.addText("→", { x: 2.95, y: 2.1, w: 0.4, h: 0.4, fontSize: 24, color: TEXT_MUTED, align: "center" });

// Database
s16.addShape(pres.ShapeType.roundRect, { x: 3.4, y: 1.5, w: 1.6, h: 1.5, fill: { color: ORANGE } });
s16.addText("SQLite", { x: 3.4, y: 1.9, w: 1.6, h: 0.35, fontSize: 14, color: WHITE, bold: true, align: "center" });
s16.addText("로컬 DB", { x: 3.4, y: 2.25, w: 1.6, h: 0.25, fontSize: 10, color: WHITE, align: "center" });
s16.addText("원본 지표값", { x: 3.4, y: 2.5, w: 1.6, h: 0.2, fontSize: 9, color: WHITE, align: "center" });

// Arrow to App
s16.addText("→", { x: 5.05, y: 2.1, w: 0.4, h: 0.4, fontSize: 24, color: TEXT_MUTED, align: "center" });

// App Section
s16.addShape(pres.ShapeType.roundRect, { x: 5.5, y: 1, w: 4.2, h: 2.5, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 1, dashType: "dash" } });
s16.addText("PC 앱 (Tauri + React)", { x: 5.6, y: 1.1, w: 4, h: 0.3, fontSize: 11, color: TEXT_MUTED });
s16.addShape(pres.ShapeType.roundRect, { x: 5.65, y: 1.45, w: 1.9, h: 0.45, fill: { color: CORAL } });
s16.addText("테마 분석", { x: 5.65, y: 1.55, w: 1.9, h: 0.3, fontSize: 11, color: WHITE, align: "center", bold: true });
s16.addShape(pres.ShapeType.roundRect, { x: 7.65, y: 1.45, w: 1.9, h: 0.45, fill: { color: GREEN } });
s16.addText("스크리너", { x: 7.65, y: 1.55, w: 1.9, h: 0.3, fontSize: 11, color: WHITE, align: "center", bold: true });
s16.addShape(pres.ShapeType.roundRect, { x: 5.65, y: 2, w: 1.9, h: 0.45, fill: { color: PINK } });
s16.addText("종목 상세", { x: 5.65, y: 2.1, w: 1.9, h: 0.3, fontSize: 11, color: WHITE, align: "center", bold: true });
s16.addShape(pres.ShapeType.roundRect, { x: 7.65, y: 2, w: 1.9, h: 0.45, fill: { color: "6B7280" } });
s16.addText("시야 AI", { x: 7.65, y: 2.1, w: 1.9, h: 0.3, fontSize: 11, color: WHITE, align: "center", bold: true });

// Score Calculation Module
s16.addText("점수 계산 모듈 (별도 분리)", { x: 0.5, y: 3.7, w: 4, h: 0.35, fontSize: 13, color: TEXT_DARK, bold: true });
s16.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 4.05, w: 9.3, h: 0.8, fill: { color: "F1F5F9" }, line: { color: CARD_BORDER, pt: 1 } });
s16.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 4.2, w: 2.7, h: 0.5, fill: { color: GREEN } });
s16.addText("품질 점수 (50점)", { x: 0.6, y: 4.3, w: 2.7, h: 0.35, fontSize: 11, color: WHITE, align: "center", bold: true });
s16.addShape(pres.ShapeType.roundRect, { x: 3.5, y: 4.2, w: 2.7, h: 0.5, fill: { color: PURPLE } });
s16.addText("밸류 점수 (20점)", { x: 3.5, y: 4.3, w: 2.7, h: 0.35, fontSize: 11, color: WHITE, align: "center", bold: true });
s16.addShape(pres.ShapeType.roundRect, { x: 6.4, y: 4.2, w: 2.7, h: 0.5, fill: { color: ORANGE } });
s16.addText("개선 점수 (30점)", { x: 6.4, y: 4.3, w: 2.7, h: 0.35, fontSize: 11, color: WHITE, align: "center", bold: true });

// Future
s16.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 5.05, w: 9.3, h: 0.45, fill: { color: "EFF6FF" }, line: { color: BLUE, pt: 1 } });
s16.addText("📌 향후: 한국투자증권 오픈API → 실시간 시세 (수집 모듈만 교체, DB/앱 수정 불필요)", { x: 0.6, y: 5.15, w: 9, h: 0.3, fontSize: 11, color: BLUE });

// S17: 시야 AI 화면 (NEW)
let s17 = pres.addSlide(); s17.background = { color: LIGHT };
s17.addText("시야 AI 화면", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, color: TEXT_DARK, bold: true });
s17.addText("DB 데이터 + 웹검색 기반 AI 분석 어시스턴트", { x: 0.5, y: 0.75, w: 9, h: 0.3, fontSize: 14, color: TEXT_MUTED });

// Answer Types
s17.addText("답변 범위", { x: 0.5, y: 1.1, w: 2, h: 0.3, fontSize: 13, color: TEXT_DARK, bold: true });
[{ t: "특정 종목 분석", ex: '"삼성전자 살 만한가요?"', c: BLUE },{ t: "종목 간 비교", ex: '"삼성 vs SK하이닉스"', c: TEAL },{ t: "종목 추천", ex: '"지금 어떤 종목이 좋아?"', c: PURPLE },{ t: "투자 일반", ex: '"PBR이 뭐야?"', c: ORANGE }].forEach((item, i) => {
  s17.addShape(pres.ShapeType.roundRect, { x: 0.5 + i * 2.4, y: 1.4, w: 2.25, h: 0.7, fill: { color: item.c } });
  s17.addText(item.t, { x: 0.5 + i * 2.4, y: 1.47, w: 2.25, h: 0.3, fontSize: 11, color: WHITE, align: "center", bold: true });
  s17.addText(item.ex, { x: 0.5 + i * 2.4, y: 1.77, w: 2.25, h: 0.25, fontSize: 8, color: WHITE, align: "center" });
});

// Flow
s17.addText("작동 방식", { x: 0.5, y: 2.25, w: 2, h: 0.3, fontSize: 13, color: TEXT_DARK, bold: true });
const flowItems = [{ n: "사용자", s: "질문", c: "6B7280" },{ n: "① DB 조회", s: "ROE, PBR, PER", c: BLUE },{ n: "② 웹검색", s: "뉴스, 공시", c: TEAL },{ n: "③ Claude", s: "데이터 + 질문", c: CORAL },{ n: "④ 답변", s: "생성", c: GREEN }];
flowItems.forEach((f, i) => {
  s17.addShape(pres.ShapeType.roundRect, { x: 0.4 + i * 1.9, y: 2.55, w: 1.7, h: 0.75, fill: { color: f.c } });
  s17.addText(f.n, { x: 0.4 + i * 1.9, y: 2.62, w: 1.7, h: 0.3, fontSize: 10, color: WHITE, align: "center", bold: true });
  s17.addText(f.s, { x: 0.4 + i * 1.9, y: 2.9, w: 1.7, h: 0.25, fontSize: 9, color: WHITE, align: "center" });
  if (i < 4) s17.addText("→", { x: 2.1 + i * 1.9, y: 2.75, w: 0.3, h: 0.4, fontSize: 16, color: TEXT_MUTED });
});

// Response Structure
s17.addText("답변 구성", { x: 0.5, y: 3.5, w: 2, h: 0.3, fontSize: 13, color: TEXT_DARK, bold: true });
s17.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 3.8, w: 9.3, h: 1.4, fill: { color: "F8FAFC" }, line: { color: CARD_BORDER, pt: 1 } });

// Main Answer
s17.addShape(pres.ShapeType.roundRect, { x: 0.55, y: 3.95, w: 4.5, h: 1.1, fill: { color: WHITE }, line: { color: CARD_BORDER, pt: 0.5 } });
s17.addText("본문 답변 (자연어)", { x: 0.7, y: 4.05, w: 4.2, h: 0.25, fontSize: 11, color: TEXT_DARK, bold: true });
s17.addText("삼성전자는 현재 PER 12.3으로 업종 평균 대비 저평가...", { x: 0.7, y: 4.35, w: 4.2, h: 0.2, fontSize: 9, color: TEXT_MUTED });
s17.addText("ROE 15.2%로 수익성도 양호합니다...", { x: 0.7, y: 4.55, w: 4.2, h: 0.2, fontSize: 9, color: TEXT_MUTED });

// Strength Card
s17.addShape(pres.ShapeType.roundRect, { x: 5.2, y: 3.95, w: 2.1, h: 0.55, fill: { color: "D1FAE5" }, line: { color: GREEN, pt: 0.5 } });
s17.addText("핵심 강점", { x: 5.3, y: 4.02, w: 1.9, h: 0.22, fontSize: 10, color: "065F46", bold: true });
s17.addText("• ROE 15.2% 양호", { x: 5.3, y: 4.25, w: 1.9, h: 0.2, fontSize: 8, color: "065F46" });

// Risk Card
s17.addShape(pres.ShapeType.roundRect, { x: 7.45, y: 3.95, w: 2.1, h: 0.55, fill: { color: "FEE2E2" }, line: { color: RED, pt: 0.5 } });
s17.addText("주요 리스크", { x: 7.55, y: 4.02, w: 1.9, h: 0.22, fontSize: 10, color: "991B1B", bold: true });
s17.addText("• 반도체 업황 불확실", { x: 7.55, y: 4.25, w: 1.9, h: 0.2, fontSize: 8, color: "991B1B" });

// Model Info
s17.addShape(pres.ShapeType.roundRect, { x: 5.2, y: 4.6, w: 2.1, h: 0.45, fill: { color: PURPLE } });
s17.addText("Claude Sonnet", { x: 5.2, y: 4.7, w: 2.1, h: 0.3, fontSize: 11, color: WHITE, align: "center", bold: true });

// Disclaimer
s17.addShape(pres.ShapeType.roundRect, { x: 0.4, y: 5.35, w: 9.3, h: 0.5, fill: { color: "FEF3C7" }, line: { color: ORANGE, pt: 1 } });
s17.addText("면책 문구 (필수): \"이 분석은 참고용이며 투자 결정은 본인 판단으로 하세요.\"", { x: 0.6, y: 5.45, w: 9, h: 0.35, fontSize: 11, color: "92400E", align: "center" });

// S18: 기술 스택
let s18 = pres.addSlide(); s18.background = { color: LIGHT };
s18.addText("데이터 소스 및 기술 스택", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, color: TEXT_DARK, bold: true });
s18.addText("데이터 소스 (무료)", { x: 0.5, y: 0.95, w: 9, h: 0.4, fontSize: 18, color: PRIMARY, bold: true });
[["pykrx", "주가, 거래량, 기관/외국인 수급, PER, PBR"],["OpenDartReader", "재무제표 (매출, 영업이익, 부채 등)"],["TradingView-Screener", "RSI, MACD → 테마 타이밍 지표"],["한국투자증권 API", "실시간 시세 (Phase 2)"]].forEach((ds, i) => {
  s18.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 1.4 + i * 0.55, w: 1.8, h: 0.45, fill: { color: ACCENT } });
  s18.addText(ds[0], { x: 0.5, y: 1.4 + i * 0.55, w: 1.8, h: 0.45, fontSize: 11, color: WHITE, align: "center", valign: "middle", bold: true });
  s18.addText(ds[1], { x: 2.4, y: 1.4 + i * 0.55, w: 7, h: 0.45, fontSize: 12, color: TEXT_DARK, valign: "middle" });
});
s18.addText("기술 스택", { x: 0.5, y: 3.7, w: 9, h: 0.4, fontSize: 18, color: PRIMARY, bold: true });
[{ layer: "프론트엔드", tech: "Tauri + React", desc: "경량 데스크톱 앱" },{ layer: "백엔드", tech: "Python", desc: "데이터 수집 및 분석" },{ layer: "데이터베이스", tech: "SQLite", desc: "로컬 저장소" },{ layer: "AI", tech: "Claude API", desc: "시야 AI 화면" }].forEach((t, i) => {
  const x = 0.5 + i * 2.35;
  s18.addShape(pres.ShapeType.roundRect, { x: x, y: 4.15, w: 2.2, h: 1.1, fill: { color: WHITE }, line: { color: PRIMARY, pt: 1 } });
  s18.addText(t.layer, { x: x, y: 4.2, w: 2.2, h: 0.3, fontSize: 10, color: TEXT_MUTED, align: "center" });
  s18.addText(t.tech, { x: x, y: 4.5, w: 2.2, h: 0.35, fontSize: 14, color: PRIMARY, bold: true, align: "center" });
  s18.addText(t.desc, { x: x, y: 4.85, w: 2.2, h: 0.3, fontSize: 10, color: TEXT_DARK, align: "center" });
});

// S19: 다음 단계
let s19 = pres.addSlide(); s19.background = { color: DARK };
s19.addText("다음 단계", { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 32, color: WHITE, bold: true });
[{ phase: "Phase 1", title: "MVP 개발", items: ["테마-종목 매핑 DB 구축", "시그널 계산 로직 구현", "기본 UI 완성"] },{ phase: "Phase 2", title: "기능 확장", items: ["실시간 데이터 연동", "시야 AI 통합", "알림 시스템"] },{ phase: "Phase 3", title: "최적화", items: ["백테스팅 기능", "성과 분석 대시보드", "사용자 피드백 반영"] }].forEach((ns, i) => {
  const x = 0.5 + i * 3.1;
  s19.addShape(pres.ShapeType.roundRect, { x: x, y: 1.1, w: 2.9, h: 3.2, fill: { color: "374151" } });
  s19.addText(ns.phase, { x: x, y: 1.25, w: 2.9, h: 0.35, fontSize: 12, color: ACCENT, align: "center" });
  s19.addText(ns.title, { x: x, y: 1.6, w: 2.9, h: 0.4, fontSize: 18, color: WHITE, bold: true, align: "center" });
  ns.items.forEach((item, j) => s19.addText("• " + item, { x: x + 0.2, y: 2.1 + j * 0.45, w: 2.5, h: 0.4, fontSize: 12, color: TEXT_MUTED }));
});
s19.addText("📋 이번 미팅에서 논의할 사항", { x: 0.5, y: 4.5, w: 9, h: 0.35, fontSize: 14, color: ACCENT, bold: true });
s19.addText("✓ 방향성 확인  ✓ 초기 테마 20개  ✓ 시그널 기준값  ✓ MVP 범위/일정  ✓ 기타 의견", { x: 0.5, y: 4.9, w: 9, h: 0.4, fontSize: 12, color: TEXT_MUTED });

// 저장
pres.writeFile({ fileName: "시야_PC앱_기획서_v4.pptx" }).then(() => console.log("PPT 생성 완료! (v4 - 20슬라이드, 타이밍 지표 추가)")).catch(err => console.error("에러:", err));
