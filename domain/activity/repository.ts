import { Result } from 'neverthrow';
import type { Activity, ActivityError } from './types';
import type { ActivityId } from '@/domain/shared/branded-types';

/**
 * ActivityRepositoryインターフェース
 * データ永続化の抽象化
 */
export interface ActivityRepository {
  // === Basic CRUD ===
  
  findById(id: ActivityId): Promise<Result<Activity | null, ActivityError>>;
  
  findAll(): Promise<Result<ReadonlyArray<Activity>, ActivityError>>;
  
  save(activity: Activity): Promise<Result<Activity, ActivityError>>;
  
  delete(id: ActivityId): Promise<Result<void, ActivityError>>;
  
  // === Query Methods ===
  
  findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>>;
  
  findByMemberId(
    memberId: string
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>>;
  
  findByStatus(
    status: string
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>>;
  
  findOverdue(): Promise<Result<ReadonlyArray<Activity>, ActivityError>>;
  
  findUpcoming(
    days: number
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>>;
  
  // === Migration Support ===
  // 統一Activityドメインへの移行が完了しているため、移行メソッドは削除されました
}