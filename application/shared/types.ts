/**
 * DI コンテナで使用するシンボル定義
 * インターフェースと実装をバインドするためのキー
 */

export const TYPES = {
  // Repository interfaces
  IFamilyMemberRepository: Symbol.for('IFamilyMemberRepository'),
  
  // Use Cases
  FamilyMemberUseCase: Symbol.for('FamilyMemberUseCase'),
} as const;

// 型定義
export type DITypes = typeof TYPES;