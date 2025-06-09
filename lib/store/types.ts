/**
 * ストア関連の共通型定義
 */

// UI状態の基本型
export interface UIState {
  loading: boolean;
  error: string | null;
}

// 非同期操作の状態
export interface AsyncState {
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  reset: () => void;
}

// リセット可能なストアの基本インターフェース
export interface BaseStore {
  reset: () => void;
}

// 非同期操作のヘルパー型
export interface AsyncActions<T> {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleAsyncOperation: <R>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: string) => void
  ) => Promise<void>;
}

// 楽観的更新のヘルパー型
export interface OptimisticActions<T> {
  optimisticAdd: (item: T) => void;
  optimisticUpdate: (id: string, updates: Partial<T>) => void;
  optimisticRemove: (id: string) => void;
  revert: () => void;
}