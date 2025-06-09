/**
 * ストア共通のヘルパー関数
 */

import type { AsyncState, AsyncActions } from './types';

// 非同期状態管理のヘルパー
export const createAsyncActions = <T extends AsyncState>(
  set: (partial: Partial<T>) => void
): {
  execute: (operation: () => Promise<void>) => Promise<void>;
} => ({
  execute: async (operation: () => Promise<void>) => {
    try {
      set({ loading: true, error: null } as Partial<T>);
      await operation();
    } catch (error) {
      const errorMessage = normalizeError(error);
      set({ error: errorMessage } as Partial<T>);
      throw error;
    } finally {
      set({ loading: false } as Partial<T>);
    }
  },
});

// 楽観的更新のヘルパー
export const createOptimisticState = <TData, TState extends AsyncState>(
  set: (partial: Partial<TState>) => void,
  getter: (state: TState) => TData,
  setter: (state: TState, data: TData) => Partial<TState>
) => ({
  executeOptimistic: async <TResult>(
    optimisticUpdate: (current: TData) => TData,
    serverOperation: () => Promise<TResult>,
    onSuccess: (result: TResult, current: TData) => TData
  ) => {
    const currentState = getter({} as TState);
    const optimisticData = optimisticUpdate(currentState);
    
    // 楽観的更新を適用
    set(setter({} as TState, optimisticData));
    
    try {
      set({ loading: true, error: null } as Partial<TState>);
      const result = await serverOperation();
      
      // 成功時の最終状態を設定
      const finalData = onSuccess(result, optimisticData);
      set({ ...setter({} as TState, finalData), loading: false } as Partial<TState>);
    } catch (error) {
      // エラー時は元の状態に戻す
      set({
        ...setter({} as TState, currentState),
        loading: false,
        error: normalizeError(error)
      } as Partial<TState>);
      throw error;
    }
  }
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
  setError: (error: string | null) => {},
  reset: () => {},
});