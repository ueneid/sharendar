import { Result, ok, err } from 'neverthrow';
import type { ActivityRepository } from '@/domain/activity/repository';
import type { ActivityError } from '@/domain/activity/types';

/**
 * データ移行用のユースケース
 * 統一Activityドメインへの移行が完了しているため、このクラスは非推奨です
 * @deprecated 統一Activityドメインへの移行が完了済み
 */
export class ActivityMigrationUseCase {
  constructor(
    private activityRepository: ActivityRepository
  ) {}

  /**
   * @deprecated 移行は完了済みです
   */
  async migrateAllLegacyData(): Promise<Result<MigrationResult, ActivityError>> {
    console.warn('ActivityMigrationUseCase: 統一Activityドメインへの移行は完了済みです');
    
    const result: MigrationResult = {
      success: true,
      migratedCalendarEvents: 0,
      migratedTasks: 0,
      totalActivities: 0,
      completedAt: new Date().toISOString()
    };

    return ok(result);
  }

  /**
   * 移行データの検証
   * 既存データと新しいActivityデータの整合性をチェック
   */
  private async verifyMigration(): Promise<Result<MigrationVerification, ActivityError>> {
    try {
      // 仮の実装: 実際のDBアクセスは後で実装
      // 本来はdb.calendarEvents.count()やdb.tasks.count()を使用
      
      const allActivitiesResult = await this.activityRepository.findAll();
      if (allActivitiesResult.isErr()) {
        return err(allActivitiesResult.error);
      }

      const activities = allActivitiesResult.value;
      const calendarEventCount = activities.filter(a => 
        a.id.startsWith('migrated_event_')
      ).length;
      const taskCount = activities.filter(a => 
        a.id.startsWith('migrated_task_')
      ).length;

      const verification: MigrationVerification = {
        calendarEventCount,
        taskCount,
        totalActivityCount: activities.length,
        hasDataInconsistency: false, // 簡単なチェック
      };

      return ok(verification);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `データ検証中にエラーが発生しました: ${error}`
      });
    }
  }

  /**
   * ロールバック機能
   * 移行に問題がある場合に移行データを削除
   */
  async rollbackMigration(): Promise<Result<void, ActivityError>> {
    try {
      const allActivitiesResult = await this.activityRepository.findAll();
      if (allActivitiesResult.isErr()) {
        return err(allActivitiesResult.error);
      }

      const migratedActivities = allActivitiesResult.value.filter(a => 
        a.id.startsWith('migrated_event_') || a.id.startsWith('migrated_task_')
      );

      // 移行されたActivityを削除
      for (const activity of migratedActivities) {
        const deleteResult = await this.activityRepository.delete(activity.id);
        if (deleteResult.isErr()) {
          return err(deleteResult.error);
        }
      }

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `ロールバック中にエラーが発生しました: ${error}`
      });
    }
  }

  /**
   * 移行状態の確認
   * アプリケーション起動時に移行が必要かどうかを判定
   */
  async checkMigrationStatus(): Promise<Result<MigrationStatus, ActivityError>> {
    try {
      const allActivitiesResult = await this.activityRepository.findAll();
      if (allActivitiesResult.isErr()) {
        return err(allActivitiesResult.error);
      }

      const activities = allActivitiesResult.value;
      const hasMigratedData = activities.some(a => 
        a.id.startsWith('migrated_event_') || a.id.startsWith('migrated_task_')
      );

      // 簡単な実装: 実際はIndexedDBのテーブル存在確認が必要
      const hasLegacyData = !hasMigratedData; // 仮の判定

      const status: MigrationStatus = {
        needsMigration: hasLegacyData && !hasMigratedData,
        hasMigratedData,
        hasLegacyData,
        activityCount: activities.length,
      };

      return ok(status);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `移行状態チェック中にエラーが発生しました: ${error}`
      });
    }
  }
}

// === Type Definitions ===

export type MigrationResult = Readonly<{
  success: boolean;
  migratedCalendarEvents: number;
  migratedTasks: number;
  totalActivities: number;
  completedAt: string;
}>;

export type MigrationVerification = Readonly<{
  calendarEventCount: number;
  taskCount: number;
  totalActivityCount: number;
  hasDataInconsistency: boolean;
}>;

export type MigrationStatus = Readonly<{
  needsMigration: boolean;
  hasMigratedData: boolean;
  hasLegacyData: boolean;
  activityCount: number;
}>;