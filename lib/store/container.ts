/**
 * ストアからDIコンテナのユースケースにアクセスするためのユーティリティ
 */

import { container } from '@/infrastructure/di/container';
import { TYPES } from '@/application/shared/types';
import type { FamilyMemberUseCase } from '@/application/family/use-cases';
import type { CalendarEventUseCase } from '@/application/calendar/use-cases';
import type { TaskUseCase } from '@/application/tasks/use-cases';

// ユースケースの取得ヘルパー
export const getUseCases = () => ({
  familyMember: container.get<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase),
  calendarEvent: container.get<CalendarEventUseCase>(TYPES.CalendarEventUseCase),
  task: container.get<TaskUseCase>(TYPES.TaskUseCase),
});

// 個別のユースケース取得ヘルパー
export const getFamilyMemberUseCase = () => 
  container.get<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase);

export const getCalendarEventUseCase = () => 
  container.get<CalendarEventUseCase>(TYPES.CalendarEventUseCase);

export const getTaskUseCase = () => 
  container.get<TaskUseCase>(TYPES.TaskUseCase);