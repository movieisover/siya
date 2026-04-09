import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Disclosure {
  id: number;
  rcept_no: string;
  corp_code: string | null;
  stock_code: string | null;
  corp_name: string;
  report_name: string;
  rcept_date: string;
  report_type: string | null;
  flr_name: string | null;
  dart_url: string | null;
  collected_at: string;
}

export function useDisclosures() {
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDisclosures = useCallback(async (date: string, searchQuery?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('disclosures')
        .select('*')
        .eq('rcept_date', date)
        .order('collected_at', { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        // corp_name 또는 report_name에서 검색
        query = query.or(
          `corp_name.ilike.%${searchQuery.trim()}%,report_name.ilike.%${searchQuery.trim()}%`
        );
      }

      const { data, error: fetchError } = await query.limit(500);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setDisclosures(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '공시 조회 오류');
      setDisclosures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { disclosures, loading, error, fetchDisclosures };
}
