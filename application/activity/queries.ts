import { Result } from 'neverthrow';
import type { Activity, ActivityError } from '@/domain/activity/types';
import type { ActivityId } from '@/domain/shared/branded-types';

/**
 * ActivityのQuery DTOs
 * データ取得・検索のための型定義
 */

// === Basic Queries ===

export type GetActivityByIdDTO = Readonly<{
  id: string;
}>;

export type GetActivityByIdResult = Result<Activity | null, ActivityError>;

export type GetAllActivitiesResult = Result<ReadonlyArray<Activity>, ActivityError>;

// === Filter & Search Queries ===

export type GetActivitiesByDateRangeDTO = Readonly<{
  startDate: string;
  endDate: string;
}>;

export type GetActivitiesByDateRangeResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetActivitiesByMemberDTO = Readonly<{
  memberId: string;
}>;

export type GetActivitiesByMemberResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetActivitiesByStatusDTO = Readonly<{
  status: string;
}>;

export type GetActivitiesByStatusResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetActivitiesByCategories = Readonly<{
  categories: ReadonlyArray<string>;
}>;

export type GetActivitiesByCategoriesResult = Result<ReadonlyArray<Activity>, ActivityError>;

// === Special Queries ===

export type GetOverdueActivitiesResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetUpcomingActivitiesDTO = Readonly<{
  days: number;
}>;

export type GetUpcomingActivitiesResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetTodayActivitiesResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetWeekActivitiesResult = Result<ReadonlyArray<Activity>, ActivityError>;

export type GetMonthActivitiesDTO = Readonly<{
  year: number;
  month: number;
}>;

export type GetMonthActivitiesResult = Result<ReadonlyArray<Activity>, ActivityError>;

// === Activity Statistics ===

export type ActivityStats = Readonly<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  postponed: number;
  overdue: number;
}>;

export type GetActivityStatsResult = Result<ActivityStats, ActivityError>;

export type GetActivityStatsByMemberDTO = Readonly<{
  memberId: string;
}>;

export type GetActivityStatsByMemberResult = Result<ActivityStats, ActivityError>;