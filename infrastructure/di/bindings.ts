import 'reflect-metadata';
import { injectable } from 'inversify';
import type { Container } from 'inversify';
import { TYPES } from '@/application/shared/types';
import type { IFamilyMemberRepository } from '@/domain/family/repository';
import type { ICalendarEventRepository } from '@/domain/calendar/repository';
import type { ITaskRepository } from '@/domain/tasks/repository';
import { FamilyMemberRepository, CalendarEventRepository, TaskRepository } from '@/infrastructure/db/repository';
import { FamilyMemberUseCase } from '@/application/family/use-cases';
import { CalendarEventUseCase } from '@/application/calendar/use-cases';
import { TaskUseCase } from '@/application/tasks/use-cases';

/**
 * Infrastructure層でRepositoryを@injectableにする
 */
@injectable()
class InjectableFamilyMemberRepository extends FamilyMemberRepository {}

@injectable()
class InjectableCalendarEventRepository extends CalendarEventRepository {}

@injectable()
class InjectableTaskRepository extends TaskRepository {}

/**
 * DIコンテナにバインディングを設定
 * Infrastructure層が具体的な実装をApplication層のインターフェースにバインド
 */
export const configureContainer = (container: Container): void => {
  // Repository のバインディング
  container.bind<IFamilyMemberRepository>(TYPES.IFamilyMemberRepository)
           .to(InjectableFamilyMemberRepository)
           .inSingletonScope();

  container.bind<ICalendarEventRepository>(TYPES.ICalendarEventRepository)
           .to(InjectableCalendarEventRepository)
           .inSingletonScope();

  container.bind<ITaskRepository>(TYPES.ITaskRepository)
           .to(InjectableTaskRepository)
           .inSingletonScope();

  // UseCase のバインディング
  container.bind<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase)
           .to(FamilyMemberUseCase)
           .inTransientScope();

  container.bind<CalendarEventUseCase>(TYPES.CalendarEventUseCase)
           .to(CalendarEventUseCase)
           .inTransientScope();

  container.bind<TaskUseCase>(TYPES.TaskUseCase)
           .to(TaskUseCase)
           .inTransientScope();
};