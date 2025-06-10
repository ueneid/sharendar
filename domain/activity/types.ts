import { 
  ActivityId, 
  ActivityTitle, 
  DateString, 
  TimeString, 
  MemberId 
} from '@/domain/shared/branded-types';

/**
 * 統一Activityドメインモデル
 * CalendarEventとTaskを統合した包括的なエンティティ
 */

// === Core Entity ===

export type Activity = Readonly<{
  id: ActivityId;
  title: ActivityTitle;
  description?: string;
  
  // 時間・日付 (柔軟な時間モデル)
  startDate?: DateString;
  startTime?: TimeString;
  endDate?: DateString;
  endTime?: TimeString;
  dueDate?: DateString;
  isAllDay: boolean;
  
  // 分類・状態
  category: ActivityCategory;
  status: ActivityStatus;
  priority: ActivityPriority;
  
  // 人・場所
  memberIds: ReadonlyArray<MemberId>;
  location?: string;
  
  // タスク機能
  checklist: ReadonlyArray<ChecklistItem>;
  completedAt?: DateString;
  
  // メタデータ
  createdAt: DateString;
  updatedAt: DateString;
  tags: ReadonlyArray<string>;
  
  // 繰り返し (将来拡張用)
  recurrence?: RecurrencePattern;
}>;

// === Category (従来のevent/taskの概念を拡張) ===

export type ActivityCategory = 
  | 'event'        // 一般的なイベント・予定
  | 'task'         // やること・タスク
  | 'appointment'  // 医者・面談など約束事
  | 'deadline'     // 締切・期限
  | 'meeting'      // 会議・集まり
  | 'milestone'    // マイルストーン・節目
  | 'reminder';    // リマインダー・覚えること

// === Status (アクティビティの進行状態) ===

export type ActivityStatus = 
  | 'pending'      // 未着手・予定
  | 'in_progress'  // 進行中・取り組み中
  | 'completed'    // 完了
  | 'cancelled'    // キャンセル
  | 'postponed';   // 延期

// === Priority ===

export type ActivityPriority = 'high' | 'medium' | 'low';

// === Checklist ===

export type ChecklistItem = Readonly<{
  id: string;
  title: string;
  checked: boolean;
  assignedMemberIds?: ReadonlyArray<MemberId>;
}>;

// === Recurrence (将来拡張用) ===

export type RecurrencePattern = Readonly<{
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // 何日/週/月/年おきか
  endDate?: DateString;
  count?: number; // 繰り返し回数
}>;

// === View-specific types ===

// カレンダービュー用のフィルター
export type CalendarFilter = Readonly<{
  categories: ReadonlyArray<ActivityCategory>;
  memberIds: ReadonlyArray<MemberId>;
  showCompleted: boolean;
}>;

// タスクビュー用のフィルター
export type TaskFilter = Readonly<{
  statuses: ReadonlyArray<ActivityStatus>;
  priorities: ReadonlyArray<ActivityPriority>;
  memberIds: ReadonlyArray<MemberId>;
  dueDateRange?: {
    start?: DateString;
    end?: DateString;
  };
}>;

// === Command Types ===

export type CreateActivityCommand = Readonly<{
  title: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  category: ActivityCategory;
  priority?: ActivityPriority;
  memberIds?: ReadonlyArray<string>;
  location?: string;
  checklist?: ReadonlyArray<Omit<ChecklistItem, 'id'>>;
  tags?: ReadonlyArray<string>;
}>;

export type UpdateActivityCommand = Readonly<{
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  category?: ActivityCategory;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  memberIds?: ReadonlyArray<string>;
  location?: string;
  checklist?: ReadonlyArray<ChecklistItem>;
  completedAt?: string;
  tags?: ReadonlyArray<string>;
}>;

// === Error Types ===

export type ActivityError = 
  | { type: 'ValidationError'; message: string; field?: string }
  | { type: 'NotFoundError'; message: string; id: ActivityId }
  | { type: 'ConflictError'; message: string }
  | { type: 'DatabaseError'; message: string };