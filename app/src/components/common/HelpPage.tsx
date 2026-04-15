interface HelpPageProps {
  onClose: () => void;
}

export default function HelpPage({ onClose }: HelpPageProps) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2 className="help-title">❓ 시야 도움말</h2>
          <button className="help-close" onClick={onClose}>✕</button>
        </div>

        <div className="help-body">
          {/* 종합 점수 */}
          <section className="help-section">
            <h3>📊 종합 점수란?</h3>
            <p>종합 점수는 종목의 <strong>수익성(품질)</strong>, <strong>저평가 정도(밸류에이션)</strong>, <strong>재무 개선 추세(개선)</strong>를 하나의 숫자로 요약한 지표입니다.</p>
            <p>점수가 높을수록 "잘 벌고, 싸고, 점점 좋아지는" 종목이라는 뜻입니다.</p>
            <p><strong>종합 점수 = 품질(50점) + 밸류에이션(20점) + 개선(30점) = 100점 만점</strong></p>

            <div className="help-subsection">
              <h4>품질 점수 (50점 만점) — "이 기업이 얼마나 잘 벌고 있나?"</h4>
              <table className="help-table">
                <thead><tr><th>항목</th><th>배점</th><th>의미</th><th>계산</th></tr></thead>
                <tbody>
                  <tr><td>ROE</td><td>20점</td><td>자기자본으로 얼마나 효율적으로 돈을 버는지</td><td>ROE 20% = 20점 만점</td></tr>
                  <tr><td>ROA</td><td>15점</td><td>전체 자산을 얼마나 효율적으로 활용하는지</td><td>ROA 10% = 15점 만점</td></tr>
                  <tr><td>영업이익률</td><td>15점</td><td>매출에서 실제로 남는 이익의 비율</td><td>15% = 15점 만점</td></tr>
                </tbody>
              </table>
            </div>

            <div className="help-subsection">
              <h4>밸류에이션 점수 (20점 만점) — "지금 주가가 싼 편인가?"</h4>
              <table className="help-table">
                <thead><tr><th>항목</th><th>배점</th><th>의미</th><th>계산</th></tr></thead>
                <tbody>
                  <tr><td>PBR 점수</td><td>10점</td><td>순자산 대비 주가 할인율. 1 미만이면 "청산가치 이하"</td><td>PBR 낮을수록 고득점</td></tr>
                  <tr><td>PER 상대점수</td><td>10점</td><td>비교 그룹 내에서 상대적으로 얼마나 저평가인지</td><td>평균 PER 대비 낮을수록 고득점</td></tr>
                </tbody>
              </table>
              <p style={{marginTop: '8px', fontSize: '13px'}}><strong>⚠️ PER 상대점수는 모드에 따라 비교 기준이 다릅니다:</strong></p>
              <table className="help-table">
                <thead><tr><th>모드</th><th>PER 비교 기준</th><th>이유</th></tr></thead>
                <tbody>
                  <tr><td><strong>테마 분석</strong></td><td>선택한 테마 내 평균 PER</td><td>같은 테마 종목들 사이에서 비교</td></tr>
                  <tr><td><strong>스크리너</strong></td><td>필터 통과 종목 전체 평균 PER</td><td>시장 전체에서 비교</td></tr>
                  <tr><td><strong>관심종목 / 검색</strong></td><td>KRX 업종 평균 PER</td><td>같은 산업 내에서 비교</td></tr>
                </tbody>
              </table>
              <p className="help-note">* 따라서 같은 종목이라도 테마/스크리너/검색에서 종합점수가 약간 다를 수 있습니다. 이는 비교 대상 그룹이 다르기 때문입니다.</p>
            </div>

            <div className="help-subsection">
              <h4>개선 점수 (30점 만점) — "재무가 좋아지고 있나?"</h4>
              <p>현재 수치가 낮더라도 "점점 나아지고 있는" 종목을 찾아내는 지표입니다.</p>
              <table className="help-table">
                <thead><tr><th>항목</th><th>배점</th><th>의미</th><th>계산</th></tr></thead>
                <tbody>
                  <tr><td>ROE 개선</td><td>12점</td><td>수익성이 전년보다 좋아졌는지</td><td>전년 대비 +6%p = 12점 만점</td></tr>
                  <tr><td>영업이익률 개선</td><td>12점</td><td>이익률이 전년보다 높아졌는지</td><td>전년 대비 +6%p = 12점 만점</td></tr>
                  <tr><td>PBR 하락</td><td>6점</td><td>주가가 가치 대비 더 싸졌는지</td><td>전년 대비 -0.6 = 6점 만점</td></tr>
                </tbody>
              </table>
              <p className="help-note">* 개선만 반영합니다 (악화 시 0점, 감점은 없음)</p>
            </div>

            <div className="help-example">
              <strong>예시: 삼성전자</strong> (ROE 15.2%, ROA 8.5%, 영업이익률 12.3%, PBR 1.42, PER 12.3)
              <br />→ 품질 40.25점 + 밸류 8.8점 + 개선 8.7점 = <strong>57.75점</strong> / 100점
            </div>
          </section>

          {/* 테마 분석 지표 */}
          <section className="help-section">
            <h3>📈 테마 분석 지표</h3>
            <p>테마 카드에는 <strong>신뢰도</strong>(테마의 힘)와 <strong>타이밍</strong>(진입 시점)이라는 두 가지 독립적인 축이 있습니다. 이 둘을 조합한 <strong>종합 해석</strong>이 카드 하단에 표시됩니다.</p>

            <div className="help-subsection">
              <h4>신뢰도 (HIGH / MEDIUM / LOW) — "이 테마가 진짜 뜨고 있나?"</h4>
              <p>기관과 외국인이 실제로 돈을 넣고 있고, 거래가 활발하며, 종목들이 함께 움직이면 "진짜 뜨는 테마"라고 볼 수 있습니다.</p>
              <table className="help-table">
                <thead><tr><th>시그널</th><th>배점</th><th>왜 중요한가</th></tr></thead>
                <tbody>
                  <tr><td>거래량 급증</td><td>30점</td><td>관심이 급증하면 거래량이 먼저 늘어납니다</td></tr>
                  <tr><td>기관/외국인 매집</td><td>50점</td><td>큰손이 사면 테마가 지속될 가능성이 높습니다</td></tr>
                  <tr><td>동반 상승</td><td>20점</td><td>한 종목만 오르는 건 테마가 아닙니다</td></tr>
                </tbody>
              </table>
              <div className="help-grades">
                <span className="help-grade help-grade-high">HIGH: 70~100점</span>
                <span className="help-grade help-grade-medium">MEDIUM: 40~69점</span>
                <span className="help-grade help-grade-low">LOW: 0~39점</span>
              </div>
              <p className="help-note">* 현재 기관/외국인 데이터 미수집 상태(pykrx API 고장)로 수급 점수 0점 → 전체 테마 LOW 표시 중</p>
            </div>

            <div className="help-subsection">
              <h4>타이밍 (🟢 / 🟡 / 🔴) — "지금 들어가도 괜찮은 시점인가?"</h4>
              <p>테마가 강하더라도 이미 과열 상태면 진입이 위험합니다. 타이밍 지표는 RSI(과열도)와 MACD(추세 방향)를 조합해 "지금이 적절한 진입 시점인지" 판단합니다.</p>
              <table className="help-table">
                <thead><tr><th>지표</th><th>무엇을 측정하나</th><th>기준</th></tr></thead>
                <tbody>
                  <tr><td>RSI (14일)</td><td>주가가 너무 올랐는지(과매수) / 너무 떨어졌는지(과매도)</td><td>70↑ 과열 / 30~70 중립 / 30↓ 저점</td></tr>
                  <tr><td>GC (골든크로스)</td><td>테마 내 종목 중 상승 전환 신호가 난 비율</td><td>60%↑ 상승추세 / 40~60% 혼조 / 40%↓ 하락</td></tr>
                </tbody>
              </table>
              <div className="help-grades">
                <span className="help-grade help-grade-green">🟢 진입 적기: 과열 아님 + 상승 추세</span>
                <span className="help-grade help-grade-red">🔴 과열주의: 과매수이거나 하락 추세</span>
                <span className="help-grade help-grade-yellow">🟡 관망: 추세 불명확, 지켜보기</span>
              </div>
            </div>

            <div className="help-subsection">
              <h4>신뢰도 × 타이밍 = 종합 해석</h4>
              <p>테마 카드 하단에 두 지표를 조합한 한 줄 요약이 표시됩니다.</p>
              <table className="help-table">
                <thead><tr><th>신뢰도</th><th>타이밍</th><th>종합 해석</th><th>의미</th></tr></thead>
                <tbody>
                  <tr><td>HIGH</td><td>🟢 진입 적기</td><td>✨ 강한 테마 + 좋은 타이밍</td><td>가장 좋은 조합</td></tr>
                  <tr><td>HIGH</td><td>🔴 과열주의</td><td>⚠️ 강한 테마이나 과열 주의</td><td>테마는 강한데 이미 많이 올랐음</td></tr>
                  <tr><td>HIGH</td><td>🟡 관망</td><td>🔍 강한 테마, 추세 혼조</td><td>테마 강하지만 방향이 불명확</td></tr>
                  <tr><td>MEDIUM</td><td>🟢 진입 적기</td><td>📈 보통 테마 + 좋은 타이밍</td><td>테마력은 보통이나 진입 시점은 좋음</td></tr>
                  <tr><td>LOW</td><td>🟢 진입 적기</td><td>📈 추세 좋으나 테마 힘 약함</td><td>추세는 좋지만 테마 자체 힘이 약함</td></tr>
                  <tr><td>LOW</td><td>🔴 과열주의</td><td>💤 약한 테마 + 나쁜 타이밍</td><td>피하는 게 좋은 조합</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 스크리너 필터 */}
          <section className="help-section">
            <h3>🔍 스크리너 필터</h3>
            <p>스크리너 필터는 원하는 조건에 맞는 종목만 골라내는 도구입니다. 기본값은 가치투자에 적합한 추천 기준입니다.</p>
            <table className="help-table">
              <thead><tr><th>필터</th><th>기본값</th><th>쉽게 말하면</th><th>예시</th></tr></thead>
              <tbody>
                <tr><td>PER</td><td>≤ 15</td><td>벌어들이는 돈 대비 주가가 싼지</td><td>PER 10 = 10년치 이익으로 회사를 살 수 있음</td></tr>
                <tr><td>PBR</td><td>≤ 1.5</td><td>가진 재산 대비 주가가 싼지</td><td>PBR 0.8 = 회사 재산의 80% 가격에 살 수 있음</td></tr>
                <tr><td>ROE</td><td>≥ 10%</td><td>돈을 잘 버는 기업인지</td><td>ROE 15% = 자본 100원으로 매년 15원 벌음</td></tr>
                <tr><td>부채비율</td><td>≤ 100%</td><td>빚이 너무 많지 않은지</td><td>100% = 빚과 자기 돈이 같은 수준</td></tr>
                <tr><td>배당수익률</td><td>≥ 0%</td><td>투자하면 배당금을 얼마나 받는지</td><td>3% = 100만원 투자 시 연 3만원 배당</td></tr>
              </tbody>
            </table>
            <p className="help-note">* 슬라이더로 조건을 조정하면 결과가 실시간으로 변합니다</p>
          </section>

          {/* 동종업계 비교 */}
          <section className="help-section">
            <h3>🏢 동종업계 비교</h3>
            <p>같은 산업에 속한 다른 기업들과 비교하여 이 종목이 얼마나 뛰어난지 보여줍니다.</p>
            <p>바가 노란 선(업종 평균)을 넘으면 업종 평균보다 우수한 것입니다.</p>
            <table className="help-table">
              <thead><tr><th>구분</th><th>동종업계 비교</th><th>테마</th></tr></thead>
              <tbody>
                <tr><td>분류 기준</td><td>KRX 공식 업종 분류<br/>(예: "통신 및 방송 장비 제조업")</td><td>시야 앱 자체 투자 테마<br/>(예: "AI/반도체")</td></tr>
                <tr><td>용도</td><td>같은 산업 내 객관적 비교</td><td>투자 트렌드 기반 종목 묶기</td></tr>
                <tr><td>예시</td><td>삼성전자 vs 같은 "통신장비 제조업" 기업들</td><td>삼성전자가 속한 "AI/반도체" 테마 종목들</td></tr>
              </tbody>
            </table>
            <p className="help-note">* 이 두 분류는 별개입니다. 삼성전자는 업종은 "통신장비 제조업"이지만 테마는 "AI/반도체"에 속합니다.</p>
          </section>

          {/* 투자 용어 사전 */}
          <section className="help-section">
            <h3>📖 투자 용어 사전</h3>
            <table className="help-table">
              <thead><tr><th>용어</th><th>쉽게 말하면</th><th>예시</th></tr></thead>
              <tbody>
                <tr><td><strong>PER</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>주가수익비율</span></td><td>벌어들이는 돈 대비 주가가 비싼지 싼지. 낮을수록 저평가</td><td>PER 10 = 10년치 이익으로 시총 회수</td></tr>
                <tr><td><strong>PBR</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>주가순자산비율</span></td><td>가진 재산 대비 주가. 1 미만이면 재산보다 싸게 거래</td><td>PBR 0.8 = 순자산보다 20% 할인</td></tr>
                <tr><td><strong>ROE</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>자기자본이익률</span></td><td>자기 돈으로 얼마나 효율적으로 버는지. 높을수록 좋음</td><td>ROE 15% = 자본 100원 → 연 15원 이익</td></tr>
                <tr><td><strong>ROA</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>총자산이익률</span></td><td>전체 자산(자기돈+빌린돈)으로 얼마나 버는지</td><td>ROA 8% = 자산 100원 → 연 8원 이익</td></tr>
                <tr><td><strong>부채비율</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>Debt/Equity</span></td><td>빚이 자기 돈의 몇 배인지. 낮을수록 안전</td><td>100% = 빚과 자기 돈이 같음</td></tr>
                <tr><td><strong>RSI</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>상대강도지수</span></td><td>최근 주가가 너무 올랐는지(70↑) 너무 떨어졌는지(30↓)</td><td>RSI 25 = 과매도, 반등 가능성</td></tr>
                <tr><td><strong>MACD</strong><br/><span style={{fontSize: '11px', color: 'var(--color-text-secondary)'}}>이동평균수렴확산</span></td><td>추세가 상승으로 전환하는지(골든크로스) 하락으로 전환하는지</td><td>골든크로스 = 상승 전환 신호</td></tr>
              </tbody>
            </table>
          </section>

          {/* 데이터 현황 */}
          <section className="help-section">
            <h3>📊 데이터 현황</h3>
            <p>시야 앱이 사용하는 각 데이터의 출처와 갱신 주기입니다. 일부 지표는 사용자에게 보이는 시점에 실시간 계산되고, 나머지는 배치 작업으로 DB에 저장됩니다.</p>
            <table className="help-table help-data-table">
              <thead>
                <tr>
                  <th>데이터</th>
                  <th>소스</th>
                  <th>갱신 시점</th>
                  <th>앱 표시</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>종목 마스터</td>
                  <td>KRX (한국거래소)</td>
                  <td><span className="data-badge data-badge-manual">수동 (필요 시)</span></td>
                  <td>종목명, 코드</td>
                </tr>
                <tr>
                  <td>업종</td>
                  <td>KRX (한국거래소)</td>
                  <td><span className="data-badge data-badge-manual">수동 (필요 시)</span></td>
                  <td>업종 표시</td>
                </tr>
                <tr>
                  <td>일별 시세</td>
                  <td>한국투자증권 API</td>
                  <td><span className="data-badge data-badge-daily">매일 16:00 자동</span></td>
                  <td>현재가, 등락률, 캔들차트</td>
                </tr>
                <tr>
                  <td>PER / PBR</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-daily">매일 16:00 자동</span></td>
                  <td>핵심 지표</td>
                </tr>
                <tr>
                  <td>배당수익률 / DPS</td>
                  <td>한국투자증권 API</td>
                  <td><span className="data-badge data-badge-weekly">매주 월 17:00 자동</span></td>
                  <td>핵심 지표</td>
                </tr>
                <tr>
                  <td>재무제표</td>
                  <td>DART 공시</td>
                  <td><span className="data-badge data-badge-yearly">연 1회 (4~5월)</span></td>
                  <td>재무 추이</td>
                </tr>
                <tr>
                  <td>ROE / ROA / 영업이익률 / 부채비율</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-yearly">재무제표 수집 시</span></td>
                  <td>핵심 지표</td>
                </tr>
                <tr>
                  <td>기관/외국인 수급</td>
                  <td>한국투자증권 API</td>
                  <td><span className="data-badge data-badge-daily">매일 16:00 자동</span></td>
                  <td>테마 신뢰도</td>
                </tr>
                <tr>
                  <td>RSI / MACD</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-daily">매일 16:00 자동</span></td>
                  <td>타이밍 지표</td>
                </tr>
                <tr>
                  <td>테마 목록 / 매핑</td>
                  <td>수동 등록</td>
                  <td><span className="data-badge data-badge-manual">초기 설정</span></td>
                  <td>테마 목록</td>
                </tr>
                <tr>
                  <td>공시 목록</td>
                  <td>DART 공시</td>
                  <td><span className="data-badge data-badge-hourly">매시 정각 자동</span></td>
                  <td>공시사항 탭</td>
                </tr>
                <tr>
                  <td>종합 점수</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-live">화면 표시 시</span></td>
                  <td>점수 바 차트</td>
                </tr>
                <tr>
                  <td>테마 신뢰도</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-live">화면 표시 시</span></td>
                  <td>HIGH/MEDIUM/LOW</td>
                </tr>
                <tr>
                  <td>타이밍 등급</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-live">화면 표시 시</span></td>
                  <td>🟢🟡🔴</td>
                </tr>
                <tr>
                  <td>업종 평균</td>
                  <td>자체 계산</td>
                  <td><span className="data-badge data-badge-live">화면 표시 시</span></td>
                  <td>동종업계 비교</td>
                </tr>
                <tr>
                  <td>시야 AI</td>
                  <td>Claude API</td>
                  <td><span className="data-badge data-badge-live">질문 시</span></td>
                  <td>AI 탭</td>
                </tr>
              </tbody>
            </table>
            <p className="help-note">* 배치 작업은 GitHub Actions로 자동 실행됩니다. 한국 증시 휴장일에는 갱신이 없습니다.</p>
          </section>

          <div className="help-disclaimer">
            ⚠️ 이 앱의 모든 분석은 참고용이며, 투자 결정은 본인 판단으로 하세요.
          </div>
        </div>
      </div>
    </div>
  );
}
