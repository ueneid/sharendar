/**
 * 家族メンバー管理のApplication層エントリーポイント
 * InversifyJS DI Container を使用
 */

import { container } from '@/application/shared/container';
import { TYPES } from '@/application/shared/types';
import { FamilyMemberUseCase } from './use-cases';
import type { IFamilyMemberRepository } from '@/domain/family/repository';

/**
 * DI Container が初期化されているかチェック
 */
const ensureContainerInitialized = (): void => {
  if (!container.isBound(TYPES.IFamilyMemberRepository)) {
    throw new Error(
      'DIコンテナが初期化されていません。アプリケーション起動時に configureContainer() を呼び出してください。'
    );
  }
};

/**
 * DI Container から FamilyMemberUseCase を取得
 */
export const getFamilyUseCase = (): FamilyMemberUseCase => {
  ensureContainerInitialized();
  return container.get<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase);
};

/**
 * テスト用: カスタムRepositoryでFamilyMemberUseCaseを作成
 */
export const createFamilyUseCase = (repository: IFamilyMemberRepository): FamilyMemberUseCase => {
  return new FamilyMemberUseCase(repository);
};

// 主要な型とクラスの再エクスポート
export { FamilyMemberUseCase } from './use-cases';
export type {
  CreateFamilyMemberCommand,
  UpdateFamilyMemberCommand,
  CommandError,
  QueryError,
  FamilyUseCaseError
} from './use-cases';

// 個別の関数も使いたい場合のためのエクスポート
export * as FamilyCommands from './commands';
export * as FamilyQueries from './queries';