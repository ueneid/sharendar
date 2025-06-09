/**
 * Zustandストアの統合エクスポート
 */

// ストア
export { useFamilyMemberStore } from './family-store';
export { useCalendarStore } from './calendar-store';

// セレクター
export {
  useFamilyMembers,
  useSelectedMember,
  useFamilyMemberForm,
  useFamilyMemberAsync,
} from './family-store';

export {
  useCalendarEvents,
  useFilteredEvents,
  useSelectedDate,
  useCalendarView,
  useCalendarFilter,
  useEventForm,
  useCalendarAsync,
} from './calendar-store';

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
  getCalendarEventUseCase,
  getTaskUseCase,
} from './container';