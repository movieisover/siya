import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface SearchResult {
  stock_code: string;
  stock_name: string;
  market: string;
}

interface MobileSearchProps {
  onSelect: (code: string, name?: string) => void;
  onClose: () => void;
}

export default function MobileSearch({ onSelect, onClose }: MobileSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 열릴 때 입력창 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 검색 실행 (디바운스 300ms, 2글자 이상)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('stocks')
          .select('stock_code, stock_name, market')
          .or(`stock_name.ilike.%${q}%,stock_code.ilike.%${q}%`)
          .eq('is_active', true)
          .order('stock_name');

        if (!error && data) {
          setResults(data as SearchResult[]);
        }
      } catch {
        // 조용히 무시
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handleSelect(code: string, name: string) {
    onSelect(code, name);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && results.length === 1) {
      handleSelect(results[0].stock_code, results[0].stock_name);
    }
  }

  const q = query.trim();

  return (
    <div className="mobile-search-overlay">
      <div className="mobile-search-bar">
        <button className="mobile-search-back" onClick={onClose} aria-label="닫기">
          ←
        </button>
        <input
          ref={inputRef}
          className="mobile-search-input"
          type="text"
          inputMode="search"
          placeholder="종목명 또는 종목코드 (2글자 이상)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            className="mobile-search-clear"
            onClick={() => setQuery('')}
            aria-label="지우기"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mobile-search-results">
        {q.length < 2 ? (
          <div className="mobile-search-hint">
            종목명 또는 종목코드를 2글자 이상 입력하세요
          </div>
        ) : loading ? (
          <div className="mobile-search-hint">검색 중...</div>
        ) : results.length === 0 ? (
          <div className="mobile-search-hint">검색 결과가 없습니다</div>
        ) : (
          results.map((r) => (
            <button
              key={r.stock_code}
              className="mobile-search-item"
              onClick={() => handleSelect(r.stock_code, r.stock_name)}
            >
              <span className="mobile-search-item-name">{r.stock_name}</span>
              <span className="mobile-search-item-meta">
                <span className="mobile-search-item-code">{r.stock_code}</span>
                <span className="mobile-search-item-market">{r.market}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
