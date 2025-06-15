import 'reflect-metadata';
import { injectable } from 'inversify';
import type { Container } from 'inversify';
import { TYPES } from '@/application/shared/types';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import type { ActivityRepository } from '@/domain/activity/repository';
import { DexieFamilyMemberRepository } from '@/infrastructure/db/family-member-repository';
import { DexieActivityRepository } from '@/infrastructure/db/activity-repository';
import { FamilyMemberUseCase } from '@/application/family/use-cases';
import { ActivityUseCase } from '@/application/activity/use-cases';

/**
 * Infrastructure層でRepositoryを@injectableにする
 */

@injectable()
class InjectableActivityRepository extends DexieActivityRepository {}

@injectable()
class InjectableFamilyMemberRepository extends DexieFamilyMemberRepository {}

/**
 * DIコンテナにバインディングを設定
 * Infrastructure層が具体的な実装をApplication層のインターフェースにバインド
 */
export const configureContainer = (container: Container): void => {
  // Repository のバインディング
  container.bind<IFamilyMemberRepository>(TYPES.IFamilyMemberRepository)
           .to(InjectableFamilyMemberRepository)
           .inSingletonScope();

  container.bind<ActivityRepository>('ActivityRepository')
           .to(InjectableActivityRepository)
           .inSingletonScope();

  // UseCase のバインディング
  container.bind<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase)
           .to(FamilyMemberUseCase)
           .inTransientScope();

  container.bind<ActivityUseCase>('ActivityUseCase')
           .to(ActivityUseCase)
           .inTransientScope();
};