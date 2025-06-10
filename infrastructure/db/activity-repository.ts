import { Result, ok, err } from 'neverthrow';
import Dexie from 'dexie';
import { db, type DBActivity } from './schema';
import type { 
  Activity, 
  ActivityError 
} from '@/domain/activity/types';
import type { ActivityRepository } from '@/domain/activity/repository';
import { 
  ActivityId,
  asActivityId, 
  asActivityTitle, 
  asDateString, 
  asTimeString,
  asMemberId 
} from '@/domain/shared/branded-types';

/**
 * IndexedDB (Dexie) を使ったActivityRepository実装
 */
export class DexieActivityRepository implements ActivityRepository {
  
  // === Helper Methods ===
  
  private toActivity(dbActivity: DBActivity): Activity {
    return {
      id: asActivityId(dbActivity.id),
      title: asActivityTitle(dbActivity.title),
      description: dbActivity.description,
      
      // 時間・日付
      startDate: dbActivity.startDate ? asDateString(dbActivity.startDate) : undefined,
      startTime: dbActivity.startTime ? asTimeString(dbActivity.startTime) : undefined,
      endDate: dbActivity.endDate ? asDateString(dbActivity.endDate) : undefined,
      endTime: dbActivity.endTime ? asTimeString(dbActivity.endTime) : undefined,
      dueDate: dbActivity.dueDate ? asDateString(dbActivity.dueDate) : undefined,
      isAllDay: dbActivity.isAllDay,
      
      // 分類・状態
      category: dbActivity.category,
      status: dbActivity.status,
      priority: dbActivity.priority,
      
      // 人・場所
      memberIds: dbActivity.memberIds.map(asMemberId),
      location: dbActivity.location,
      
      // タスク機能
      checklist: dbActivity.checklist || [],
      completedAt: dbActivity.completedAt ? asDateString(dbActivity.completedAt) : undefined,
      
      // メタデータ
      createdAt: asDateString(dbActivity.createdAt),
      updatedAt: asDateString(dbActivity.updatedAt),
      tags: dbActivity.tags || [],
      
      // 将来拡張
      recurrence: dbActivity.recurrence,
    };
  }
  
  private toDBActivity(activity: Activity): DBActivity {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      
      // 時間・日付
      startDate: activity.startDate,
      startTime: activity.startTime,
      endDate: activity.endDate,
      endTime: activity.endTime,
      dueDate: activity.dueDate,
      isAllDay: activity.isAllDay,
      
      // 分類・状態
      category: activity.category,
      status: activity.status,
      priority: activity.priority,
      
      // 人・場所
      memberIds: [...activity.memberIds],
      location: activity.location,
      
      // タスク機能
      checklist: [...activity.checklist],
      completedAt: activity.completedAt,
      
      // メタデータ
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      tags: [...activity.tags],
      
      // 将来拡張
      recurrence: activity.recurrence,
    };
  }
  
  // === Basic CRUD ===
  
  async findById(id: ActivityId): Promise<Result<Activity | null, ActivityError>> {
    try {
      const dbActivity = await db.activities.get(id);
      if (!dbActivity) {
        return ok(null);
      }
      return ok(this.toActivity(dbActivity));
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `アクティビティの取得に失敗しました: ${error}`
      });
    }
  }
  
  async findAll(): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    try {
      const dbActivities = await db.activities.orderBy('updatedAt').reverse().toArray();
      const activities = dbActivities.map(dbActivity => this.toActivity(dbActivity));
      return ok(activities);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `アクティビティ一覧の取得に失敗しました: ${error}`
      });
    }
  }
  
  async save(activity: Activity): Promise<Result<Activity, ActivityError>> {
    try {
      const dbActivity = this.toDBActivity(activity);
      await db.activities.put(dbActivity);
      return ok(activity);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `アクティビティの保存に失敗しました: ${error}`
      });
    }
  }
  
  async delete(id: ActivityId): Promise<Result<void, ActivityError>> {
    try {
      await db.activities.delete(id);
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `アクティビティの削除に失敗しました: ${error}`
      });
    }
  }
  
  // === Query Methods ===
  
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    try {
      const dbActivities = await db.activities
        .where('startDate')
        .between(startDate, endDate, true, true)
        .or('dueDate')
        .between(startDate, endDate, true, true)
        .toArray();
        
      const activities = dbActivities.map(dbActivity => this.toActivity(dbActivity));
      return ok(activities);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `期間指定検索に失敗しました: ${error}`
      });
    }
  }
  
  async findByMemberId(
    memberId: string
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    try {
      const dbActivities = await db.activities
        .filter(activity => activity.memberIds.includes(memberId))
        .toArray();
        
      const activities = dbActivities.map(dbActivity => this.toActivity(dbActivity));
      return ok(activities);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `メンバー指定検索に失敗しました: ${error}`
      });
    }
  }
  
  async findByStatus(
    status: string
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    try {
      const dbActivities = await db.activities
        .where('status')
        .equals(status)
        .toArray();
        
      const activities = dbActivities.map(dbActivity => this.toActivity(dbActivity));
      return ok(activities);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `ステータス指定検索に失敗しました: ${error}`
      });
    }
  }
  
  async findOverdue(): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dbActivities = await db.activities
        .where('dueDate')
        .below(today)
        .and(activity => activity.status !== 'completed')
        .toArray();
        
      const activities = dbActivities.map(dbActivity => this.toActivity(dbActivity));
      return ok(activities);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `期限切れ検索に失敗しました: ${error}`
      });
    }
  }
  
  async findUpcoming(
    days: number
  ): Promise<Result<ReadonlyArray<Activity>, ActivityError>> {
    try {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);
      
      const todayStr = today.toISOString().split('T')[0];
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const dbActivities = await db.activities
        .where('startDate')
        .between(todayStr, futureDateStr, true, true)
        .or('dueDate')
        .between(todayStr, futureDateStr, true, true)
        .toArray();
        
      const activities = dbActivities.map(dbActivity => this.toActivity(dbActivity));
      return ok(activities);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `今後の予定検索に失敗しました: ${error}`
      });
    }
  }
  
  // === Migration Support ===
  
  async migrateFromLegacyData(): Promise<Result<void, ActivityError>> {
    try {
      // 既存のCalendarEventとTaskを取得
      const events = await db.calendarEvents.toArray();
      const tasks = await db.tasks.toArray();
      
      // CalendarEventをActivityに変換
      const eventActivities: DBActivity[] = events.map(event => ({
        id: `migrated_event_${event.id}`,
        title: event.title,
        description: event.memo,
        startDate: event.date,
        startTime: event.time,
        endDate: undefined,
        endTime: undefined,
        dueDate: event.date,
        isAllDay: !event.time,
        category: 'event' as const,
        status: 'pending' as const,
        priority: 'medium' as const,
        memberIds: [...event.memberIds],
        location: undefined,
        checklist: [],
        completedAt: undefined,
        createdAt: event.date,
        updatedAt: event.date,
        tags: [],
        recurrence: undefined,
      }));
      
      // TaskをActivityに変換
      const taskActivities: DBActivity[] = tasks.map(task => ({
        id: `migrated_task_${task.id}`,
        title: task.title,
        description: task.memo,
        startDate: undefined,
        startTime: undefined,
        endDate: undefined,
        endTime: undefined,
        dueDate: task.dueDate,
        isAllDay: true,
        category: 'task' as const,
        status: task.status,
        priority: task.priority,
        memberIds: [...task.memberIds],
        location: undefined,
        checklist: [...task.checklist],
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.createdAt,
        tags: [],
        recurrence: undefined,
      }));
      
      // 全てのActivityを保存
      const allActivities = [...eventActivities, ...taskActivities];
      await db.activities.bulkPut(allActivities);
      
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `データ移行に失敗しました: ${error}`
      });
    }
  }
}