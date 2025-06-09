/**
 * ストア共通のヘルパー関数
 */

import type { AsyncState, AsyncActions } from './types';

// 非同期状態管理のヘルパー
export const createAsyncActions = <T extends AsyncState>(
  set: (partial: Partial<T>) => void,
  get: () => T
): AsyncActions<T> => ({
  setLoading: (loading: boolean) => set({ loading } as Partial<T>),
  
  setError: (error: string | null) => set({ error } as Partial<T>),
  
  handleAsyncOperation: async <R>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: string) => void
  ) => {
    const { setLoading, setError } = createAsyncActions(set, get);
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await operation();
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  },
});

// 楽観的更新のヘルパー
export const createOptimisticState = <T extends { id: string }>(
  items: T[]
): {
  items: T[];
  optimisticAdd: (item: T) => T[];
  optimisticUpdate: (id: string, updates: Partial<T>) => T[];
  optimisticRemove: (id: string) => T[];
} => ({
  items,
  
  optimisticAdd: (item: T) => [...items, item],
  
  optimisticUpdate: (id: string, updates: Partial<T>) =>
    items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ),
  
  optimisticRemove: (id: string) =>
    items.filter(item => item.id !== id),
});

// エラーメッセージの正規化
export const normalizeError = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '不明なエラーが発生しました';
};

// 楽観的更新での一時的なIDを生成
export const generateTempId = (): string => `temp_${Date.now()}_${Math.random()}`;

// UI状態の初期値
export const createInitialAsyncState = (): AsyncState => ({
  loading: false,
  error: null,
});