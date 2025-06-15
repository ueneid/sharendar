import { injectable, inject } from 'inversify';
import { Result, ok, err } from 'neverthrow';
import type { ActivityRepository } from '@/domain/activity/repository';
import { 
  createActivity,
  updateActivity,
  completeActivity,
  reopenActivity
} from '@/domain/activity/operations';
import { 
  validateCreateActivityCommand,
  validateUpdateActivityCommand
} from '@/domain/activity/validations';
import type { 
  Activity, 
  CreateActivityCommand,
  UpdateActivityCommand,
  ActivityError 
} from '@/domain/activity/types';
import type { ActivityId } from '@/domain/shared/branded-types';

/**
 * ActivityUseCase
 * ビジネスロジックの調整とドメイン操作の実行
 */
@injectable()
export class ActivityUseCase {
  constructor(
    @inject('ActivityRepository') private activityRepository: ActivityRepository
  ) {}

  // === Command Operations ===

  async createActivity(command: CreateActivityCommand): Promise<Result<Activity, ActivityError>> {
    // バリデーション
    const validationResult = validateCreateActivityCommand(command);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    // ドメイン操作でActivityを作成（テスト用のシンプルなcreatActivity関数を使用）
    const activity = createActivity(
      command.title,
      command.category,
      command.priority || 'medium',
      {
        startDate: command.startDate,
        endDate: command.endDate,
        dueDate: command.dueDate,
        isAllDay: command.isAllDay,
        memberIds: command.memberIds ? [...command.memberIds] : undefined,
        description: command.description
      }
    );

    // リポジトリに保存
    return await this.activityRepository.save(activity);
  }

  async updateActivity(id: ActivityId, command: UpdateActivityCommand): Promise<Result<Activity, ActivityError>> {
    // 既存のActivityを取得
    const existingResult = await this.activityRepository.findById(id);
    if (existingResult.isErr()) {
      return err(existingResult.error);
    }
    
    if (!existingResult.value) {
      return err({
        type: 'NotFoundError',
        message: 'アクティビティが見つかりません',
        id
      });
    }

    // ドメイン操作でActivityを更新
    const updateResult = updateActivity(existingResult.value, command);
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }

    // リポジトリに保存
    return await this.activityRepository.save(updateResult.value);
  }

  async deleteActivity(id: ActivityId): Promise<Result<void, ActivityError>> {
    // 既存のActivityが存在するか確認
    const existingResult = await this.activityRepository.findById(id);
    if (existingResult.isErr()) {
      return err(existingResult.error);
    }
    
    if (!existingResult.value) {
      return err({
        type: 'NotFoundError',
        message: 'アクティビティが見つかりません',
        id
      });
    }

    // リポジトリから削除
    return await this.activityRepository.delete(id);
  }

  async getActivityById(id: ActivityId): Promise<Result<Activity, ActivityError>> {
    const result = await this.activityRepository.findById(id);
    if (result.isErr()) {
      return err(result.error);
    }
    
    if (!result.value) {
      return err({
        type: 'NotFoundError',
        message: 'アクティビティが見つかりません',
        id
      });
    }

    return ok(result.value);
  }

  async getAllActivities(): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    return await this.activityRepository.findAll();
  }

  async completeActivity(id: ActivityId): Promise<Result<Activity, ActivityError>> {
    // 既存のActivityを取得
    const existingResult = await this.activityRepository.findById(id);
    if (existingResult.isErr()) {
      return err(existingResult.error);
    }
    
    if (!existingResult.value) {
      return err({
        type: 'NotFoundError',
        message: 'アクティビティが見つかりません',
        id
      });
    }

    // ドメイン操作で完了させる
    const completeResult = completeActivity(existingResult.value);
    if (completeResult.isErr()) {
      return err(completeResult.error);
    }

    // リポジトリに保存
    return await this.activityRepository.save(completeResult.value);
  }

  async reopenActivity(id: ActivityId): Promise<Result<Activity, ActivityError>> {
    // 既存のActivityを取得
    const existingResult = await this.activityRepository.findById(id);
    if (existingResult.isErr()) {
      return err(existingResult.error);
    }
    
    if (!existingResult.value) {
      return err({
        type: 'NotFoundError',
        message: 'アクティビティが見つかりません',
        id
      });
    }

    // ドメイン操作で再開する
    const reopenResult = reopenActivity(existingResult.value);
    if (reopenResult.isErr()) {
      return err(reopenResult.error);
    }

    // リポジトリに保存
    return await this.activityRepository.save(reopenResult.value);
  }

  // === Query Operations ===

  async getActivitiesByDateRange(startDate: string, endDate: string): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    return await this.activityRepository.findByDateRange(startDate, endDate);
  }

  async getActivitiesByMemberId(memberId: string): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    return await this.activityRepository.findByMemberId(memberId);
  }

  async getOverdueActivities(): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    return await this.activityRepository.findOverdue();
  }

  async getUpcomingActivities(days: number): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    return await this.activityRepository.findUpcoming(days);
  }
}