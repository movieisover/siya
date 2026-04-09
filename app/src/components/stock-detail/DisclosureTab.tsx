import { useState, useEffect } from 'react';
import { useDisclosures, type Disclosure } from '../../hooks/useDisclosures';

export default function DisclosureTab() {
  const { disclosures, loading, error, fetchDisclosures } = useDisclosures();
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // 오늘
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 날짜 변경 또는 검색 시 데이터 조회
  useEffect(() => {
    fetchDisclosures(selectedDate, searchQuery);
  }, [selectedDate, searchQuery, fetchDisclosures]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  return (
    <div className="disclosure-tab">
      {/* 날짜 선택 + 검색 */}
      <div className="disclosure-controls">
        <input
          type="date"
          className="disclosure-date-input"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
        <div className="disclosure-search-row">
          <input
            className="disclosure-search-input"
            placeholder="기업명 또는 공시제목 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchInput && (
            <button className="disclosure-clear-btn" onClick={clearSearch}>✕</button>
          )}
        </div>
      </div>

      {/* 결과 */}
      <div className="disclosure-list">
        {loading && (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div>공시 조회 중...</div>
          </div>
        )}

        {error && (
          <div className="ai-error">{error}</div>
        )}

        {!loading && !error && disclosures.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div>{selectedDate} 공시가 없습니다</div>
            {searchQuery && <div style={{ fontSize: '0.8rem', marginTop: 4 }}>검색어: "{searchQuery}"</div>}
          </div>
        )}

        {!loading && disclosures.length > 0 && (
          <>
            <div className="disclosure-count">
              총 {disclosures.length}건
              {searchQuery && <span> (검색: "{searchQuery}")</span>}
            </div>
            {disclosures.map((d) => (
              <DisclosureItem key={d.rcept_no} disclosure={d} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function DisclosureItem({ disclosure }: { disclosure: Disclosure }) {
  const handleClick = () => {
    if (disclosure.dart_url) {
      window.open(disclosure.dart_url, '_blank');
    }
  };

  return (
    <div className="disclosure-item" onClick={handleClick}>
      <div className="disclosure-corp">{disclosure.corp_name}</div>
      <div className="disclosure-title">{disclosure.report_name}</div>
      {disclosure.flr_name && (
        <div className="disclosure-submitter">{disclosure.flr_name}</div>
      )}
    </div>
  );
}
