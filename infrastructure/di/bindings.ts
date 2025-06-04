import 'reflect-metadata';
import { injectable } from 'inversify';
import type { Container } from 'inversify';
import { TYPES } from '@/application/shared/types';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import { FamilyMemberRepository } from '@/infrastructure/db/repository';
import { FamilyMemberUseCase } from '@/application/family/use-cases';

/**
 * Infrastructure層でRepositoryを@injectableにする
 */
@injectable()
class InjectableFamilyMemberRepository extends FamilyMemberRepository {}

/**
 * DIコンテナにバインディングを設定
 * Infrastructure層が具体的な実装をApplication層のインターフェースにバインド
 */
export const configureContainer = (container: Container): void => {
  // Repository のバインディング
  container.bind<IFamilyMemberRepository>(TYPES.IFamilyMemberRepository)
           .to(InjectableFamilyMemberRepository)
           .inSingletonScope();

  // UseCase のバインディング
  container.bind<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase)
           .to(FamilyMemberUseCase)
           .inTransientScope();
};