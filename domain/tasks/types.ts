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
}>;

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed';

export type ChecklistItem = Readonly<{
  id: string;
  title: string;
  checked: boolean;
}>;