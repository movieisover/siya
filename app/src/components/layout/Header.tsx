import { useState, useEffect, useRef } from 'react';
import type { AppMode } from '../../App';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onStockSelect: (code: string) => void;
  watchlistCount: number;
  onHelpOpen: () => void;
}

function formatDataDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 종가 기준`;
}

interface SearchResult {
  stock_code: string;
  stock_name: string;
  market: string;
}

export default function Header({ mode, onModeChange, onStockSelect, watchlistCount, onHelpOpen }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 시세 데이터 기준일 조회
  useEffect(() => {
    async function fetchLatestDate() {
      try {
        const { data } = await supabase
          .from('price_daily')
          .select('trade_date')
          .order('trade_date', { ascending: false })
          .limit(1)
          .single();
        if (data) {
          setDataDate(data.trade_date);
        }
      } catch {}
    }
    fetchLatestDate();
    // 5분마다 갱신 (업데이트 중 반영용)
    const interval = setInterval(fetchLatestDate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 검색 실행 (디바운스 300ms)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        // 종목코드 정확 매칭 또는 종목명 부분 매칭
        const isCode = /^\d+$/.test(q);
        let query;
        if (isCode) {
          query = supabase
            .from('stocks')
            .select('stock_code, stock_name, market')
            .like('stock_code', `${q}%`)
            .limit(10);
        } else {
          query = supabase
            .from('stocks')
            .select('stock_code, stock_name, market')
            .ilike('stock_name', `%${q}%`)
            .limit(10);
        }

        const { data, error } = await query;
        if (!error && data) {
          setResults(data as SearchResult[]);
          setShowResults(data.length > 0);
          setSelectedIdx(-1);
        }
      } catch {
        // 조용히 무시
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectStock(code: string) {
    onStockSelect(code);
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showResults || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && selectedIdx < results.length) {
        selectStock(results[selectedIdx].stock_code);
      } else if (results.length === 1) {
        selectStock(results[0].stock_code);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  }

  return (
    <header className="header">
      <span className="header-logo">시야</span>
      {dataDate && (
        <span className="data-date-badge">
          {formatDataDate(dataDate)}
        </span>
      )}

      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'theme' ? 'active' : ''}`}
          onClick={() => onModeChange('theme')}
        >
          테마 분석
        </button>
        <button
          className={`mode-tab ${mode === 'screener' ? 'active' : ''}`}
          onClick={() => onModeChange('screener')}
        >
          스크리너
        </button>
        <button
          className={`mode-tab ${mode === 'watchlist' ? 'active' : ''}`}
          onClick={() => onModeChange('watchlist')}
        >
          관심종목{watchlistCount > 0 ? ` (${watchlistCount})` : ''}
        </button>
      </div>

      <div className="search-box" ref={searchRef}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="종목명 또는 종목코드 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {showResults && (
          <div className="search-dropdown">
            {results.map((r, i) => (
              <div
                key={r.stock_code}
                className={`search-result-item ${i === selectedIdx ? 'selected' : ''}`}
                onClick={() => selectStock(r.stock_code)}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span className="search-result-name">{r.stock_name}</span>
                <span className="search-result-code">{r.stock_code}</span>
                <span className="search-result-market">{r.market}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-user">
        <button className="help-btn" onClick={onHelpOpen}>❓</button>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {user?.email}
        </span>
        <button className="logout-btn" onClick={signOut}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
