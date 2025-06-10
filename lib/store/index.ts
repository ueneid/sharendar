/**
 * Zustandストアの統合エクスポート
 */

// ストア
export { useFamilyMemberStore } from './family-store';
export { useActivityStore } from './activity-store';

// セレクター
export {
  useFamilyMembers,
  useSelectedMember,
  useFamilyMemberForm,
  useFamilyMemberAsync,
} from './family-store';

// Legacy stores removed - migrated to ActivityStore

// 型定義
export type {
  UIState,
  AsyncState,
  BaseStore,
  AsyncActions,
  OptimisticActions,
} from './types';

// ヘルパー
export {
  createAsyncActions,
  createOptimisticState,
  normalizeError,
  generateTempId,
  createInitialAsyncState,
} from './helpers';

// DIコンテナ統合
export {
  getUseCases,
  getFamilyMemberUseCase,
  getActivityUseCase,
} from './container';