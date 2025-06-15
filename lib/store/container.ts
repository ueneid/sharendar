/**
 * ストアからDIコンテナのユースケースにアクセスするためのユーティリティ
 */

import { getInitializedContainer } from '@/infrastructure/di/container';
import { TYPES } from '@/application/shared/types';
import type { FamilyMemberUseCase } from '@/application/family/use-cases';
import type { ActivityUseCase } from '@/application/activity/use-cases';

// DIコンテナ初期化の再エクスポート
export { getInitializedContainer };

// ユースケースの取得ヘルパー
export const getUseCases = () => {
  const container = getInitializedContainer();
  return {
    familyMember: container.get<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase),
    activity: container.get<ActivityUseCase>('ActivityUseCase'),
  };
};

// 個別のユースケース取得ヘルパー
export const getFamilyMemberUseCase = () => {
  const container = getInitializedContainer();
  return container.get<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase);
};

export const getActivityUseCase = () => {
  const container = getInitializedContainer();
  return container.get<ActivityUseCase>('ActivityUseCase');
};