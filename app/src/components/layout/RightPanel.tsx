import { useState, useRef, useEffect } from 'react';
import { useStockDetail } from '../../hooks/useStockDetail';
import { askSiyaAi, type AiMessage } from '../../lib/ai';
import type { Financials, StockScore } from '../../types/stock';
import type { AppMode } from '../../App';
import type { StockDetailData, CompetitorItem, CompetitorsData, DividendItem } from '../../hooks/useStockDetail';
import Tooltip from '../common/Tooltip';
import DisclosureTab from '../stock-detail/DisclosureTab';

interface RightPanelProps {
  stockCode: string | null;
  mode: AppMode;
  selectedThemeId: number | null;
  isWatched: boolean;
  watchMemo: string | null;
  onWatchToggle: (code: string, watched: boolean) => void;
  onMemoUpdate: (code: string, memo: string) => void;
}

export default function RightPanel({ stockCode, mode, selectedThemeId, isWatched, watchMemo, onWatchToggle, onMemoUpdate }: RightPanelProps) {
  const { data, loading } = useStockDetail(stockCode, mode, selectedThemeId);
  const [activeTab, setActiveTab] = useState<'detail' | 'ai' | 'disclosure'>('detail');
  const [memoInput, setMemoInput] = useState('');
  const [memoEditing, setMemoEditing] = useState(false);

  // 종목 변경 시 메모 입력 초기화
  useEffect(() => {
    setMemoInput(watchMemo || '');
    setMemoEditing(false);
  }, [stockCode, watchMemo]);

  if (!stockCode) {
    return (
      <aside className="panel right-panel">
        <div className="detail-tabs">
          <button className="detail-tab active" onClick={() => {}}>공시사항</button>
        </div>
        <DisclosureTab />
      </aside>
    );
  }

  if (loading || !data) {
    return (
      <aside className="panel right-panel">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div>불러오는 중...</div>
        </div>
      </aside>
    );
  }

  const { stock, price, valuation, financials, technical, score, sectorAvg, week52, competitors, dividends } = data;
  const latestFin = financials[0];

  return (
    <aside className="panel right-panel">
      {/* 탭 */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'detail' ? 'active' : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          종목 상세
        </button>
        <button
          className={`detail-tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          시야 AI
        </button>
        <button
          className={`detail-tab ${activeTab === 'disclosure' ? 'active' : ''}`}
          onClick={() => setActiveTab('disclosure')}
        >
          공시사항
        </button>
      </div>

      {activeTab === 'detail' ? (
        <div className="detail-content">
          {/* 기본 정보 */}
          <div className="detail-header">
            <div className="detail-name-row">
              <h2 className="detail-stock-name">{stock.stock_name}</h2>
              <button
                className={`watch-star ${isWatched ? 'watched' : ''}`}
                onClick={() => onWatchToggle(stock.stock_code, isWatched)}
                title={isWatched ? '관심종목 해제' : '관심종목 추가'}
              >
                {isWatched ? '★' : '☆'}
              </button>
            </div>
            <div className="detail-stock-meta">
              {stock.stock_code} · {stock.market} · {stock.sector || '-'}
            </div>
            {price?.close && (
              <>
                <div className="detail-price-row">
                  <span className="detail-price">{price.close.toLocaleString()}원</span>
                  {price.change_pct !== null && price.change_pct !== undefined && (
                    <span className={`detail-change ${price.change_pct >= 0 ? 'change-up' : 'change-down'}`}>
                      {price.change_pct >= 0 ? '+' : ''}{price.change_pct.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="detail-data-date">
                  {formatTradeDate(price.trade_date)} 기준
                </div>
              </>
            )}
          </div>

          {/* 관심종목 메모 (관심종목일 때만) */}
          {isWatched && (
            <div className="watchlist-memo-section">
              {memoEditing ? (
                <div className="memo-edit">
                  <input
                    className="memo-input"
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    placeholder="메모 입력..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onMemoUpdate(stock.stock_code, memoInput);
                        setMemoEditing(false);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="memo-save-btn"
                    onClick={() => {
                      onMemoUpdate(stock.stock_code, memoInput);
                      setMemoEditing(false);
                    }}
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div
                  className="memo-display"
                  onClick={() => setMemoEditing(true)}
                >
                  {watchMemo || '메모를 추가하세요...'}
                </div>
              )}
            </div>
          )}

          {/* 52주 고/저 밴드 */}
          {week52 && price?.close && (
            <Week52Band currentPrice={price.close} high={week52.high} low={week52.low} />
          )}

          {/* 종합 점수 */}
          <ScoreSection score={score} />

          {/* 핵심 지표 */}
          <div className="detail-section">
            <div className="detail-section-title">
              핵심 지표
              <Tooltip text={`종목의 수익성/가치/안전성/배당을 한눈에 보는 6개 지표입니다.

ROE / ROA: 수익성 지표
PER / PBR: 밸류에이션 지표
부채비율: 재무 안정성
배당수익률: 연간 배당금 ÷ 주가 (높을수록 배당 매력)
DPS(주당배당금): 1주당 받는 배당금 (원)

데이터:
• ROE/ROA/부채비율: DART 재무제표 기반 자체 계산 (연 1회)
• PER/PBR: 자체 계산, 매일 16:00 자동 갱신
• 배당수익률/DPS: 한국투자증권 API, 매주 월 17:00 자동 갱신`} />
            </div>
            <div className="metric-grid">
              <MetricCard
                label="ROE"
                value={latestFin?.roe}
                unit="%"
                sub={sectorAvg.roe !== null ? `업종 평균 ${sectorAvg.roe}%` : undefined}
                color={getMetricColor(latestFin?.roe, sectorAvg.roe, 'higher')}
              />
              <MetricCard
                label="ROA"
                value={latestFin?.roa}
                unit="%"
                sub="총자산이익률"
                color={latestFin?.roa && latestFin.roa >= 5 ? 'good' : 'normal'}
              />
              <MetricCard
                label="PER"
                value={valuation?.per}
                sub={sectorAvg.per !== null ? `업종 평균 ${sectorAvg.per}` : undefined}
                color={getMetricColor(valuation?.per, sectorAvg.per, 'lower')}
              />
              <MetricCard
                label="PBR"
                value={valuation?.pbr}
                sub={sectorAvg.pbr !== null ? `업종 평균 ${sectorAvg.pbr}` : undefined}
                color={getMetricColor(valuation?.pbr, sectorAvg.pbr, 'lower')}
              />
              <MetricCard
                label="부채비율"
                value={latestFin?.debt_ratio}
                unit="%"
                sub={latestFin?.debt_ratio !== null && latestFin?.debt_ratio !== undefined
                  ? (latestFin.debt_ratio <= 100 ? '안전' : '주의')
                  : undefined}
                color={latestFin?.debt_ratio !== null && latestFin?.debt_ratio !== undefined
                  ? (latestFin.debt_ratio <= 100 ? 'good' : 'warning')
                  : 'normal'}
              />
              <MetricCard
                label="배당수익률"
                value={valuation?.div_yield}
                unit="%"
                sub={valuation?.dps ? `DPS ${valuation.dps.toLocaleString()}원` : undefined}
                color={valuation?.div_yield && valuation.div_yield >= 3 ? 'good' : 'normal'}
              />
            </div>
          </div>

          {/* 타이밍 지표 */}
          {technical && (
            <div className="detail-section">
              <div className="detail-section-title">
                타이밍 지표
                <Tooltip text={`RSI와 MACD를 조합해 지금 진입해도 되는 타이밍인지 판단합니다.

종합 등급:
🟢 진입 적기: 과열 아님 + 상승 추세
🟡 관망: 과열은 아니지만 추세가 안 좋음 — 전환 기다리기
🔴 과열 주의: 과매수 구간 — 조심
⚪ 판단 불가: 데이터 부족

RSI: 주가 과열도 (70↑ 과열 / 30↓ 저점)
MACD: 상승 = 상승 추세 / 하락 = 하락 추세

데이터: 자체 계산, 매일 16:00 자동 갱신`} />
              </div>
              <TimingGradeBadge rsi={technical.rsi_14} macd={technical.macd} signal={technical.macd_signal} />
              <div className="timing-grid">
                <div className="timing-card">
                  <div className="timing-label">RSI (14일)</div>
                  <div className={`timing-value ${getRsiColor(technical.rsi_14)}`}>
                    {technical.rsi_14?.toFixed(1) ?? '-'}
                  </div>
                  <div className="timing-status">{getRsiStatus(technical.rsi_14)}</div>
                </div>
                <div className="timing-card">
                  <div className="timing-label">MACD</div>
                  <div className={`timing-value ${getMacdColor(technical.macd, technical.macd_signal)}`}>
                    {technical.macd?.toFixed(2) ?? '-'}
                  </div>
                  <div className="timing-status">
                    {getMacdStatus(technical.macd, technical.macd_signal)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 재무 추이 */}
          {financials.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">재무 추이</div>
              <div className="finance-table">
                <div className="finance-row finance-header">
                  <span className="finance-year"></span>
                  <span className="finance-val">매출액</span>
                  <span className="finance-val">영업이익</span>
                  <span className="finance-val">ROE</span>
                </div>
                {financials.map((f) => (
                  <FinanceRow key={f.fiscal_year} data={f} />
                ))}
              </div>
            </div>
          )}

          {/* 동종업계 비교 */}
          {(sectorAvg.roe !== null || sectorAvg.per !== null || sectorAvg.pbr !== null) && (
            <div className="detail-section">
              <div className="detail-section-title">
              동종업계 비교
              <Tooltip text={`동종업계 비교는 같은 산업에 속한 다른 기업들과
비교하여 이 종목이 얼마나 뛰어난지 보여줍니다.

KRX 공식 업종 분류 기준 (테마와는 별개)
바 = 종목값, 노란 선 = 업종 평균
바가 노란 선을 넘으면 업종 평균보다 우수

데이터: 화면 표시 시 자체 계산`} />
            </div>
              <div className="comparison-bars">
                {sectorAvg.roe !== null && latestFin?.roe !== null && latestFin?.roe !== undefined && (
                  <ComparisonBar
                    label="ROE"
                    value={latestFin.roe}
                    avg={sectorAvg.roe}
                    unit="%"
                    maxVal={Math.max(latestFin.roe, sectorAvg.roe) * 1.3}
                    betterWhen="higher"
                  />
                )}
                {sectorAvg.per !== null && valuation?.per !== null && valuation?.per !== undefined && (
                  <ComparisonBar
                    label="PER"
                    value={valuation.per}
                    avg={sectorAvg.per}
                    maxVal={Math.max(valuation.per, sectorAvg.per) * 1.3}
                    betterWhen="lower"
                  />
                )}
                {sectorAvg.pbr !== null && valuation?.pbr !== null && valuation?.pbr !== undefined && (
                  <ComparisonBar
                    label="PBR"
                    value={valuation.pbr}
                    avg={sectorAvg.pbr}
                    maxVal={Math.max(valuation.pbr, sectorAvg.pbr) * 1.3}
                    betterWhen="lower"
                  />
                )}
              </div>
              <div className="comparison-legend">
                <span className="legend-bar">바 = 종목값</span>
                <span className="legend-line">| = 업종 평균</span>
              </div>
            </div>
          )}

          {/* 경쟁사 개별 비교 */}
          {competitors && competitors.items.length > 0 && (
            <CompetitorsSection data={competitors} />
          )}

          {/* 배당 일정 */}
          <DividendSection dividends={dividends} />
        </div>
      ) : activeTab === 'ai' ? (
        <AiTab stockDetail={data} stockName={stock.stock_name} />
      ) : (
        <DisclosureTab />
      )}
    </aside>
  );
}

// ── 종합 점수 섹션 ──

function ScoreSection({ score }: { score: StockScore }) {
  return (
    <div className="detail-section score-section">
      <div className="score-header">
        <span className="score-total">{score.total_score.toFixed(1)}</span>
        <span className="score-max">/ 100점</span>
        <Tooltip text={`종합 점수는 종목의 품질, 저평가 정도, 재무 개선 추세를
하나의 숫자로 요약한 지표입니다.
점수가 높을수록 고품질·저평가·재무개선 종목입니다.

품질(50) + 밸류에이션(20) + 개선(30) = 100점

⚠️ PER 상대점수 비교 기준:
• 테마 모드: 테마 내 평균 PER
• 스크리너: 시장 평균 PER
• 관심종목/검색: KRX 업종 평균 PER
→ 모드에 따라 점수가 다를 수 있습니다

데이터: 화면 표시 시 자체 계산`} />
      </div>
      <div className="score-bars">
        <ScoreBar label="품질" value={score.quality_score} max={50} color="var(--color-green)" tooltip="기업이 얼마나 잘 벌고 있는지 평가합니다.
ROE(자기자본수익률, 만점 20)
+ ROA(총자산수익률, 만점 15)
+ 영업이익률(만점 15)" />
        <ScoreBar label="밸류에이션" value={score.valuation_score} max={20} color="#a78bfa" tooltip="주가가 실제 가치 대비 얼마나 저평가인지 평가합니다.
PBR 점수(순자산 대비 할인율, 만점 10)
+ PER 상대점수(평균 대비, 만점 10)

PER 비교 기준은 모드에 따라 다름:
테마=테마평균 / 스크리너=시장평균 / 기타=업종평균" />
        <ScoreBar label="개선" value={score.improvement_score} max={30} color="var(--color-yellow)" tooltip="재무가 전년대비 나아지고 있는지 평가합니다.
‘지금은 별로지만 좋아지는 중’인 종목 발굴용.
ROE개선(12) + 영업이익률개선(12) + PBR하락(6)" />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, color, tooltip }: { label: string; value: number; max: number; color: string; tooltip?: string }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">
        <span>
          {label} ({max}점)
          {tooltip && <Tooltip text={tooltip} />}
        </span>
        <span className="score-bar-value">{value.toFixed(1)}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

// ── 52주 고/저 밴드 ──

function Week52Band({ currentPrice, high, low }: { currentPrice: number; high: number; low: number }) {
  if (high <= low) return null;

  const rawPercent = ((currentPrice - low) / (high - low)) * 100;
  const percent = Math.max(0, Math.min(100, rawPercent));

  let positionLabel: string;
  let positionClass: string;
  if (percent >= 80) {
    positionLabel = '고점권';
    positionClass = 'week52-high-zone';
  } else if (percent <= 20) {
    positionLabel = '저점권';
    positionClass = 'week52-low-zone';
  } else {
    positionLabel = '중간권';
    positionClass = 'week52-mid-zone';
  }

  const fromLowPct = (((currentPrice - low) / low) * 100);
  const fromHighPct = (((currentPrice - high) / high) * 100);

  return (
    <div className="detail-section week52-section">
      <div className="week52-header">
        <span className="week52-title">
          52주 범위
          <Tooltip text={`최근 52주(약 1년) 동안의 최고가/최저가 사이에
현재가가 어느 위치에 있는지 보여줍니다.

저점권(0~20%): 역사적 저점 근처 → 저평가 가능성 (물론 밀리고 있는 이유 확인 필요)
중간권(20~80%): 보통 구간
고점권(80~100%): 고점 근처 → 고평가 주의

데이터: 최근 252거래일의 high/low 기준, 매일 16:00 자동 갱신`} />
        </span>
        <span className={`week52-position ${positionClass}`}>
          현재 {percent.toFixed(0)}% · {positionLabel}
        </span>
      </div>
      <div className="week52-track">
        <div className="week52-marker" style={{ left: `${percent}%` }} />
      </div>
      <div className="week52-range-row">
        <span className="week52-range-item">
          <span className="week52-range-label">저</span>
          <span className="week52-range-value">{low.toLocaleString()}원</span>
          <span className="week52-range-diff">+{fromLowPct.toFixed(1)}%</span>
        </span>
        <span className="week52-range-item week52-range-item-right">
          <span className="week52-range-diff week52-range-diff-neg">{fromHighPct.toFixed(1)}%</span>
          <span className="week52-range-value">{high.toLocaleString()}원</span>
          <span className="week52-range-label">고</span>
        </span>
      </div>
    </div>
  );
}

// ── 경쟁사 개별 비교 ──

function CompetitorsSection({ data }: { data: CompetitorsData }) {
  const avg = data.sectorAverage;
  const hasAvg = avg.roe !== null || avg.per !== null || avg.pbr !== null || avg.operating_margin !== null;

  return (
    <div className="detail-section">
      <div className="detail-section-title">
        경쟁사 개별 비교
        <Tooltip text={`같은 KRX 업종 내 상위 기업들의 원본 지표를
나란히 비교합니다.

선정 기준: 업종 내 간이 점수 상위
(품질 50 + 밸류에이션 20 = 70점 기준)

★ = 현재 선택 종목 (상위 5위 밖이면 마지막 행에 추가)
마지막 행 = 업종 전체 평균 (상위 5개만이 아닌 전체)

점수는 표시하지 않고 원본 수치만 표시해
상단 종합점수와 기준이 달라도 혼란 없습니다.`} />
      </div>
      <div className="competitors-table">
        <div className="competitors-row competitors-header">
          <span className="comp-col comp-col-name">종목</span>
          <span className="comp-col comp-col-metric">ROE</span>
          <span className="comp-col comp-col-metric">PER</span>
          <span className="comp-col comp-col-metric">PBR</span>
          <span className="comp-col comp-col-metric">영업이익률</span>
        </div>
        {data.items.map((item) => (
          <CompetitorRow key={item.stock_code} item={item} />
        ))}
        {hasAvg && (
          <div className="competitors-row competitors-avg-row">
            <span className="comp-col comp-col-name">업종 평균</span>
            <span className="comp-col comp-col-metric">{formatPct(avg.roe)}</span>
            <span className="comp-col comp-col-metric">{formatNum(avg.per)}</span>
            <span className="comp-col comp-col-metric">{formatNum(avg.pbr)}</span>
            <span className="comp-col comp-col-metric">{formatPct(avg.operating_margin)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitorRow({ item }: { item: CompetitorItem }) {
  return (
    <div className={`competitors-row ${item.isSelf ? 'competitors-row-self' : ''}`}>
      <span className="comp-col comp-col-name" title={item.stock_name}>
        {item.isSelf && <span className="comp-self-mark">★</span>}
        {item.stock_name}
      </span>
      <span className="comp-col comp-col-metric">{formatPct(item.roe)}</span>
      <span className="comp-col comp-col-metric">{formatNum(item.per)}</span>
      <span className="comp-col comp-col-metric">{formatNum(item.pbr)}</span>
      <span className="comp-col comp-col-metric">{formatPct(item.operating_margin)}</span>
    </div>
  );
}

function formatPct(v: number | null): string {
  return v !== null ? `${v.toFixed(1)}%` : '-';
}

function formatNum(v: number | null): string {
  return v !== null ? v.toFixed(2) : '-';
}

// ── 배당 일정 ──

function DividendSection({ dividends }: { dividends: DividendItem[] }) {
  if (dividends.length === 0) {
    return (
      <div className="detail-section">
        <div className="detail-section-title">
          배당 일정
          <Tooltip text={`최근 3년간의 배당 기록이 없는 종목입니다.
비배당주이거나 데이터 미수집 상태일 수 있습니다.`} />
        </div>
        <div className="dividend-empty">배당 기록 없음</div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // 결정 대기 표시 임계값 (120일 — 결산공시 시즌 감안)
  // 120일 이상 지나도 금액 미확정이면 사실상 무배당 확정으로 간주 → 숨김
  const PENDING_WINDOW_DAYS = 120;
  const pendingCutoffDate = new Date();
  pendingCutoffDate.setDate(pendingCutoffDate.getDate() - PENDING_WINDOW_DAYS);
  const pendingCutoff = pendingCutoffDate.toISOString().slice(0, 10);

  // ① 다음 예정 배당: 미래 기준일 또는 미래 지급일이 있고 금액 확정된 것
  const upcoming = dividends.find(
    (d) => d.dividend_per_share > 0 && (d.record_date > today || (d.payment_date && d.payment_date > today))
  );

  // ② 결정 대기: 금액 미확정 + 기준일이 오늘 이전이되 120일 이내인 것
  //   (회사 정관상 기준일은 지정돼 있으나 이사회 결의/공시가 아직 안 된 경우)
  //   120일 이상 묵은 건 사실상 무배당이므로 숨김
  const pendingDecisions = dividends.filter(
    (d) =>
      d.dividend_per_share === 0 &&
      d.record_date <= today &&
      d.record_date >= pendingCutoff
  );

  // ③ 과거 배당 이력 (금액 확정 + 지급일이 오늘까지, 최대 6건)
  const history = dividends
    .filter((d) => d.dividend_per_share > 0 && (!d.payment_date || d.payment_date <= today))
    .slice(0, 6);

  return (
    <div className="detail-section">
      <div className="detail-section-title">
        배당 일정
        <Tooltip text={`최근 3년간의 배당 기록과 예정 일정입니다.

기준일: 이 날까지 주식을 보유해야 배당을 받을 수 있습니다
지급일: 실제 배당금이 입금되는 날
DPS: 주당 배당금 (원)

상태 구분:
· 다음 배당 (파란): 금액이 확정된 미래 예정 배당
· 결정 대기 (노란): 기준일은 지정됐으나 아직 이사회에서 금액이 결정/공시되지 않은 배당
  (최근 120일 이내 기준일만 표시)

⚠️ 배당을 받으려면 배당기준일 직전 거래일까지 매수해야 합니다.
(기준일 당일 매수는 배당 대상이 아닙니다)

데이터: KIS API (ksdinfo/dividend), 매주 월 17:00 자동 갱신`} />
      </div>

      {/* 이 종목이 지금 보여줄 게 아무것도 없으면 빈 상태 */}
      {!upcoming && pendingDecisions.length === 0 && history.length === 0 && (
        <div className="dividend-empty">표시할 배당 정보가 없습니다</div>
      )}

      {/* ① 다음 예정 배당 카드 (금액 확정) */}
      {upcoming && (
        <div className="dividend-upcoming">
          <div className="dividend-upcoming-label">📅 다음 배당</div>
          <div className="dividend-upcoming-detail">
            <span>기준일 {formatDivDate(upcoming.record_date)}</span>
            <span className="dividend-upcoming-dps">{upcoming.dividend_per_share.toLocaleString()}원/주</span>
          </div>
          {upcoming.payment_date && (
            <div className="dividend-upcoming-pay">지급일 {formatDivDate(upcoming.payment_date)}</div>
          )}
          <div className="dividend-upcoming-type">
            {upcoming.dividend_type || '-'} · {upcoming.stock_kind}
          </div>
        </div>
      )}

      {/* ② 결정 대기 카드 (기준일 지났으나 금액 미확정) */}
      {pendingDecisions.map((d, i) => (
        <div key={`pending-${i}`} className="dividend-pending">
          <div className="dividend-pending-label">
            ⏳ 결정 대기
            <Tooltip text={`회사 정관상 기준일은 정해져 있지만,
아직 이사회 결의 또는 공시로 배당 금액이
확정되지 않은 상태입니다.

공시가 나오면 자동으로 갱신됩니다.
경우에 따라 무배당/감액 결정이 날 수도 있습니다.`} />
          </div>
          <div className="dividend-pending-detail">
            <span>기준일 {formatDivDate(d.record_date)}</span>
            <span className="dividend-pending-note">금액 미확정</span>
          </div>
          <div className="dividend-pending-type">
            {d.dividend_type || '-'} · {d.stock_kind}
          </div>
        </div>
      ))}

      {/* ③ 과거 배당 이력 테이블 */}
      {history.length > 0 && (
        <div className="dividend-history">
          <div className="dividend-history-title">최근 배당 이력</div>
          <div className="dividend-table">
            <div className="dividend-row dividend-header-row">
              <span className="div-col div-col-date">기준일</span>
              <span className="div-col div-col-type">종류</span>
              <span className="div-col div-col-dps">DPS</span>
              <span className="div-col div-col-pay">지급일</span>
            </div>
            {history.map((d, i) => (
              <div key={i} className="dividend-row">
                <span className="div-col div-col-date">{formatDivDate(d.record_date)}</span>
                <span className="div-col div-col-type">{d.dividend_type || '-'}</span>
                <span className="div-col div-col-dps">{d.dividend_per_share.toLocaleString()}원</span>
                <span className="div-col div-col-pay">{d.payment_date ? formatDivDate(d.payment_date) : '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDivDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// ── 핵심 지표 카드 ──

type MetricColor = 'good' | 'normal' | 'warning';

function MetricCard({ label, value, unit = '', sub, color = 'normal' }: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  sub?: string;
  color?: MetricColor;
}) {
  const colorClass = color === 'good' ? 'metric-good' : color === 'warning' ? 'metric-warning' : '';
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${colorClass}`}>
        {value !== null && value !== undefined ? `${value}${unit}` : '-'}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function getMetricColor(
  value: number | null | undefined,
  avg: number | null,
  betterWhen: 'higher' | 'lower'
): MetricColor {
  if (value === null || value === undefined || avg === null) return 'normal';
  if (betterWhen === 'higher') return value >= avg ? 'good' : 'warning';
  return value <= avg ? 'good' : 'warning';
}

// ── RSI/MACD 헬퍼 ──

function TimingGradeBadge({ rsi, macd, signal }: { rsi: number | null; macd: number | null; signal: number | null }) {
  if (rsi === null || macd === null || signal === null) {
    return (
      <div className="timing-grade-badge timing-grade-gray">
        ⚪ 판단 불가 — 데이터 부족
      </div>
    );
  }

  const isGolden = macd > signal;
  const isOverheat = rsi >= 70;
  const isOversold = rsi <= 30;

  if (isOverheat) {
    return (
      <div className="timing-grade-badge timing-grade-red">
        🔴 과열 주의 — RSI 과매수{isGolden ? '' : ' + MACD 하락'}
      </div>
    );
  }

  if (isGolden) {
    return (
      <div className="timing-grade-badge timing-grade-green">
        🟢 진입 적기 — {isOversold ? 'RSI 저점 + ' : 'RSI 중립 + '}MACD 상승
      </div>
    );
  }

  return (
    <div className="timing-grade-badge timing-grade-yellow">
      🟡 관망 — {isOversold ? 'RSI 저점이나 ' : ''}MACD 하락 중, 전환 대기
    </div>
  );
}

function formatTradeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일(${weekday})`;
}

function getRsiColor(rsi: number | null): string {
  if (rsi === null) return '';
  if (rsi >= 70) return 'metric-warning';
  if (rsi <= 30) return 'metric-good';
  return '';
}

function getRsiStatus(rsi: number | null): string {
  if (rsi === null) return '-';
  if (rsi >= 70) return '🔴 과열 (과매수)';
  if (rsi <= 30) return '🟢 저점 (과매도)';
  return '⚪ 중립';
}

function getMacdColor(macd: number | null, signal: number | null): string {
  if (macd === null || signal === null) return '';
  return macd > signal ? 'metric-good' : 'metric-warning';
}

function getMacdStatus(macd: number | null, signal: number | null): string {
  if (macd === null || signal === null) return '-';
  return macd > signal ? '🟢 상승 추세' : '🔴 하락 추세';
}

// ── 재무 추이 행 ──

function FinanceRow({ data }: { data: Financials }) {
  return (
    <div className="finance-row">
      <span className="finance-year">{data.fiscal_year}</span>
      <span className="finance-val">{formatTril(data.revenue)}</span>
      <span className="finance-val">{formatTril(data.operating_income)}</span>
      <span className="finance-val">{data.roe ?? '-'}%</span>
    </div>
  );
}

function formatTril(value: number | null): string {
  if (value === null) return '-';
  // 백만원 단위 → 조 단위
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + '조';
  }
  // 억 단위
  if (Math.abs(value) >= 100) {
    return Math.round(value / 100).toLocaleString() + '억';
  }
  return value.toLocaleString() + '백만';
}

// ── 동종업계 비교 바 ──

function ComparisonBar({ label, value, avg, unit = '', maxVal, betterWhen }: {
  label: string;
  value: number;
  avg: number;
  unit?: string;
  maxVal: number;
  betterWhen: 'higher' | 'lower';
}) {
  const barPercent = maxVal > 0 ? Math.min((value / maxVal) * 100, 100) : 0;
  const avgPercent = maxVal > 0 ? Math.min((avg / maxVal) * 100, 100) : 0;
  const isBetter = betterWhen === 'higher' ? value >= avg : value <= avg;
  const barColor = isBetter ? 'var(--color-green)' : 'var(--color-yellow)';

  return (
    <div className="comparison-item">
      <div className="comparison-label">
        <span>{label}</span>
        <span className={isBetter ? 'metric-good' : 'metric-warning'}>
          {value}{unit}
        </span>
      </div>
      <div className="comparison-track">
        <div className="comparison-fill" style={{ width: `${barPercent}%`, background: barColor }} />
        <div className="comparison-avg-line" style={{ left: `${avgPercent}%` }} />
      </div>
    </div>
  );
}

// ── 시야 AI 탭 ──

const QUICK_QUESTIONS = [
  '이 종목 투자 매력은?',
  '재무 건전성은 어때?',
  '업종 대비 저평가야?',
  '최근 실적 추세는?',
];

function AiTab({ stockDetail, stockName }: { stockDetail: StockDetailData; stockName: string }) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevStockRef = useRef<string>(stockDetail.stock.stock_code);

  // 종목 변경 시 대화 초기화
  useEffect(() => {
    if (prevStockRef.current !== stockDetail.stock.stock_code) {
      setMessages([]);
      setError(null);
      prevStockRef.current = stockDetail.stock.stock_code;
    }
  }, [stockDetail.stock.stock_code]);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(question?: string) {
    const q = question || input.trim();
    if (!q || loading) return;

    setInput('');
    setError(null);

    const userMsg: AiMessage = { role: 'user', content: q };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const reply = await askSiyaAi(q, stockDetail, messages);
      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 응답 오류');
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-tab">
      {/* 메시지 영역 */}
      <div className="ai-messages">
        {messages.length === 0 && !loading && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">🤖</div>
            <div className="ai-welcome-title">시야 AI</div>
            <div className="ai-welcome-sub">{stockName}에 대해 물어보세요</div>
            <div className="ai-quick-btns">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} className="ai-quick-btn" onClick={() => handleSend(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
            <div className="ai-msg-label">{msg.role === 'user' ? '나' : '시야'}</div>
            <div className="ai-msg-content">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-msg-label">시야</div>
            <div className="ai-msg-content ai-typing">분석 중...</div>
          </div>
        )}

        {error && (
          <div className="ai-error">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="ai-input-area">
        <textarea
          className="ai-input"
          placeholder={`${stockName}에 대해 질문하세요...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
        <button
          className="ai-send-btn"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
}
