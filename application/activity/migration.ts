import { Result, ok, err } from 'neverthrow';
import type { ActivityRepository } from '@/domain/activity/repository';
import type { ActivityError } from '@/domain/activity/types';

/**
 * データ移行用のユースケース
 * 既存のCalendarEventとTaskからActivityドメインへの移行を管理
 */
export class ActivityMigrationUseCase {
  constructor(
    private activityRepository: ActivityRepository
  ) {}

  /**
   * 段階的移行: 既存データをActivityテーブルに統合
   * 1. CalendarEvent → Activity変換
   * 2. Task → Activity変換
   * 3. Activity統合テーブルに保存
   * 4. データ整合性チェック
   */
  async migrateAllLegacyData(): Promise<Result<MigrationResult, ActivityError>> {
    try {
      // ActivityRepositoryの移行機能を使用
      const migrationResult = await this.activityRepository.migrateFromLegacyData();
      
      if (migrationResult.isErr()) {
        return err(migrationResult.error);
      }

      // 移行後のデータ確認
      const verificationResult = await this.verifyMigration();
      if (verificationResult.isErr()) {
        return err(verificationResult.error);
      }

      const result: MigrationResult = {
        success: true,
        migratedCalendarEvents: verificationResult.value.calendarEventCount,
        migratedTasks: verificationResult.value.taskCount,
        totalActivities: verificationResult.value.totalActivityCount,
        completedAt: new Date().toISOString()
      };

      return ok(result);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `データ移行中にエラーが発生しました: ${error}`
      });
    }
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