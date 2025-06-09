import { TaskId, TaskTitle, DateString, MemberId } from '@/domain/shared/branded-types';

/**
 * タスクのドメインモデル
 */
export type Task = Readonly<{
  id: TaskId;
  title: TaskTitle;
  dueDate?: DateString;
  priority: Priority;
  status: TaskStatus;
  memberIds: ReadonlyArray<MemberId>;
  checklist: ReadonlyArray<ChecklistItem>;
  createdAt: DateString;
  completedAt?: DateString;
  memo?: string;
}>;

export type Priority = 'high' | 'medium' | 'low';
export type TaskPriority = Priority; // エイリアス
export type TaskStatus = 'pending' | 'completed';

export type ChecklistItem = Readonly<{
  id: string;
  title: string;
  checked: boolean;
}>;

// コマンド型定義
export type CreateTaskCommand = {
  title: string;
  dueDate?: DateString;
  priority: Priority;
  memberIds: ReadonlyArray<MemberId>;
  checklist: ReadonlyArray<{ title: string }>;
  memo?: string;
};

export type UpdateTaskCommand = {
  id: TaskId;
  title?: string;
  dueDate?: DateString;
  priority?: Priority;
  status?: TaskStatus;
  memberIds?: ReadonlyArray<MemberId>;
  checklist?: ReadonlyArray<ChecklistItem>;
  memo?: string;
  completedAt?: DateString;
};

// エクスポート
export type { TaskId };