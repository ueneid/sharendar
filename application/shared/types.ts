/**
 * DI コンテナで使用するシンボル定義
 * インターフェースと実装をバインドするためのキー
 */

export const TYPES = {
  // Repository interfaces
  IFamilyMemberRepository: Symbol.for('IFamilyMemberRepository'),
  ICalendarEventRepository: Symbol.for('ICalendarEventRepository'),
  ITaskRepository: Symbol.for('ITaskRepository'),
  
  // Use Cases
  FamilyMemberUseCase: Symbol.for('FamilyMemberUseCase'),
  CalendarEventUseCase: Symbol.for('CalendarEventUseCase'),
  TaskUseCase: Symbol.for('TaskUseCase'),
} as const;

// 型定義
export type DITypes = typeof TYPES;