import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import type { WatchlistItem } from '../types/stock';

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    setItems((data as WatchlistItem[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** 관심종목 추가 */
  async function add(stockCode: string, memo?: string) {
    if (!user) return;
    const { error } = await supabase
      .from('watchlist')
      .insert({ user_id: user.id, stock_code: stockCode, memo: memo || null });

    if (!error) await load();
  }

  /** 관심종목 삭제 */
  async function remove(stockCode: string) {
    if (!user) return;
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('stock_code', stockCode);

    if (!error) await load();
  }

  /** 메모 수정 */
  async function updateMemo(stockCode: string, memo: string) {
    if (!user) return;
    const { error } = await supabase
      .from('watchlist')
      .update({ memo: memo || null })
      .eq('user_id', user.id)
      .eq('stock_code', stockCode);

    if (!error) await load();
  }

  /** 관심종목 여부 확인 */
  function isWatched(stockCode: string): boolean {
    return items.some((item) => item.stock_code === stockCode);
  }

  /** 특정 종목의 메모 가져오기 */
  function getMemo(stockCode: string): string | null {
    return items.find((item) => item.stock_code === stockCode)?.memo ?? null;
  }

  /** 관심종목 코드 목록 */
  const codes = items.map((item) => item.stock_code);

  return { items, codes, loading, add, remove, updateMemo, isWatched, getMemo, reload: load };
}
