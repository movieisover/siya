import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserTheme {
  id: number;
  user_id: string;
  theme_name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useUserThemes(userId: string | null) {
  const [themes, setThemes] = useState<UserTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 사용자 테마 로드
  const loadThemes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('user_themes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('theme_name');

    if (!error && data) {
      setThemes(data as UserTheme[]);
      setInitialized(data.length > 0);
    }
    setLoading(false);
  }, [userId]);

  // 최초 접속 시 기본 테마 복사
  const initializeFromDefaults = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. 시스템 기본 테마 조회
      const { data: defaultThemes } = await supabase
        .from('themes')
        .select('theme_name, description')
        .eq('is_active', true)
        .order('theme_name');

      if (!defaultThemes || defaultThemes.length === 0) {
        setLoading(false);
        return;
      }

      // 2. user_themes에 복사
      const userThemeRows = defaultThemes.map((t, i) => ({
        user_id: userId,
        theme_name: t.theme_name,
        description: t.description,
        sort_order: i,
      }));

      const { data: insertedThemes, error: insertError } = await supabase
        .from('user_themes')
        .insert(userThemeRows)
        .select();

      if (insertError || !insertedThemes) {
        console.error('테마 초기화 실패:', insertError);
        setLoading(false);
        return;
      }

      // 3. 테마 이름 → user_theme_id 매핑
      const nameToId: Record<string, number> = {};
      for (const ut of insertedThemes) {
        nameToId[ut.theme_name] = ut.id;
      }

      // 4. 시스템 기본 종목 매핑 조회
      const { data: defaultMappings } = await supabase
        .from('stock_themes')
        .select('stock_code, themes!inner(theme_name)')
        .order('stock_code');

      if (defaultMappings && defaultMappings.length > 0) {
        // 5. user_stock_themes에 복사
        const userMappingRows = defaultMappings
          .map((m: any) => {
            const themeName = m.themes?.theme_name;
            const userThemeId = themeName ? nameToId[themeName] : null;
            if (!userThemeId) return null;
            return {
              user_id: userId,
              user_theme_id: userThemeId,
              stock_code: m.stock_code,
            };
          })
          .filter(Boolean);

        if (userMappingRows.length > 0) {
          const { error: mappingError } = await supabase
            .from('user_stock_themes')
            .insert(userMappingRows);

          if (mappingError) {
            console.error('종목 매핑 초기화 실패:', mappingError);
          }
        }
      }

      // 6. 다시 로드
      await loadThemes();
    } catch (err) {
      console.error('초기화 에러:', err);
    }

    setLoading(false);
  }, [userId, loadThemes]);

  // 최초 로드
  useEffect(() => {
    if (userId) {
      loadThemes();
    }
  }, [userId, loadThemes]);

  // 테마 추가
  const addTheme = useCallback(async (themeName: string) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_themes')
      .insert({ user_id: userId, theme_name: themeName })
      .select()
      .single();

    if (!error && data) {
      await loadThemes();
      return data as UserTheme;
    }
    return null;
  }, [userId, loadThemes]);

  // 테마 이름 변경
  const renameTheme = useCallback(async (themeId: number, newName: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('user_themes')
      .update({ theme_name: newName })
      .eq('id', themeId)
      .eq('user_id', userId);

    if (!error) {
      await loadThemes();
      return true;
    }
    return false;
  }, [userId, loadThemes]);

  // 테마 삭제 (종목 매핑도 CASCADE로 자동 삭제)
  const deleteTheme = useCallback(async (themeId: number) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('user_themes')
      .delete()
      .eq('id', themeId)
      .eq('user_id', userId);

    if (!error) {
      await loadThemes();
      return true;
    }
    return false;
  }, [userId, loadThemes]);

  // 테마에 종목 추가
  const addStock = useCallback(async (themeId: number, stockCode: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('user_stock_themes')
      .insert({ user_id: userId, user_theme_id: themeId, stock_code: stockCode });

    if (!error) return true;
    return false;
  }, [userId]);

  // 테마에서 종목 제거
  const removeStock = useCallback(async (themeId: number, stockCode: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('user_stock_themes')
      .delete()
      .eq('user_theme_id', themeId)
      .eq('stock_code', stockCode);

    if (!error) return true;
    return false;
  }, [userId]);

  // 테마의 종목 목록 조회
  const getThemeStocks = useCallback(async (themeId: number): Promise<string[]> => {
    const { data } = await supabase
      .from('user_stock_themes')
      .select('stock_code')
      .eq('user_theme_id', themeId);

    return data ? data.map((d: any) => d.stock_code) : [];
  }, []);

  return {
    themes,
    loading,
    initialized,
    initializeFromDefaults,
    loadThemes,
    addTheme,
    renameTheme,
    deleteTheme,
    addStock,
    removeStock,
    getThemeStocks,
  };
}
