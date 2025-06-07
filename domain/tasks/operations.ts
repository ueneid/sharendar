import { Task, Priority, TaskStatus, ChecklistItem } from './types';
import { TaskId, TaskTitle, DateString, MemberId } from '@/domain/shared/branded-types';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';

/**
 * タスクに関する純粋関数
 */

// 新しいタスクを作成
export const createTask = (params: {
  title: TaskTitle;
  priority?: Priority;
  dueDate?: DateString;
  memberIds?: ReadonlyArray<MemberId>;
  checklist?: ReadonlyArray<ChecklistItem>;
}): Task => ({
  id: nanoid() as TaskId,
  title: params.title,
  priority: params.priority || 'medium',
  status: 'pending',
  dueDate: params.dueDate,
  memberIds: params.memberIds || [],
  checklist: params.checklist || [],
  createdAt: format(new Date(), 'yyyy-MM-dd') as DateString,
});

// タスクのタイトルを更新
export const updateTaskTitle = (
  task: Task,
  title: TaskTitle
): Task => ({
  ...task,
  title,
});

// タスクの期限を更新
export const updateTaskDueDate = (
  task: Task,
  dueDate: DateString | undefined
): Task => ({
  ...task,
  dueDate,
});

// タスクの優先度を更新
export const updateTaskPriority = (
  task: Task,
  priority: Priority
): Task => ({
  ...task,
  priority,
});

// タスクの担当者を更新
export const assignMembersToTask = (
  task: Task,
  memberIds: ReadonlyArray<MemberId>
): Task => ({
  ...task,
  memberIds,
});

// タスクを完了する
export const completeTask = (
  task: Task,
  completedAt: DateString = format(new Date(), 'yyyy-MM-dd') as DateString
): Task => ({
  ...task,
  status: 'completed' as const,
  completedAt,
});

// タスクを未完了に戻す
export const uncompleteTask = (
  task: Task
): Task => ({
  ...task,
  status: 'pending' as const,
  completedAt: undefined,
});

// チェックリストアイテムを追加
export const addChecklistItem = (
  task: Task,
  title: string
): Task => ({
  ...task,
  checklist: [
    ...task.checklist,
    {
      id: nanoid(),
      title,
      checked: false,
    },
  ],
});

// チェックリストアイテムを削除
export const removeChecklistItem = (
  task: Task,
  itemId: string
): Task => ({
  ...task,
  checklist: task.checklist.filter(item => item.id !== itemId),
});

// チェックリストアイテムの状態を切り替え
export const toggleChecklistItem = (
  task: Task,
  itemId: string
): Task => ({
  ...task,
  checklist: task.checklist.map(item =>
    item.id === itemId
      ? { ...item, checked: !item.checked }
      : item
  ),
});

// 特定のステータスのタスクをフィルタリング
export const filterTasksByStatus = (
  tasks: ReadonlyArray<Task>,
  status: TaskStatus
): ReadonlyArray<Task> => {
  return tasks.filter(task => task.status === status);
};

// 特定のメンバーが担当するタスクをフィルタリング
export const filterTasksByMember = (
  tasks: ReadonlyArray<Task>,
  memberId: MemberId
): ReadonlyArray<Task> => {
  return tasks.filter(task => task.memberIds.includes(memberId));
};

// 期限切れのタスクをフィルタリング
export const filterOverdueTasks = (
  tasks: ReadonlyArray<Task>,
  currentDate: DateString
): ReadonlyArray<Task> => {
  return tasks.filter(task => 
    task.status === 'pending' && 
    task.dueDate && 
    task.dueDate < currentDate
  );
};

// チェックリストの完了率を計算
export const calculateChecklistProgress = (
  checklist: ReadonlyArray<ChecklistItem>
): number => {
  if (checklist.length === 0) return 100;
  const checkedCount = checklist.filter(item => item.checked).length;
  return Math.round((checkedCount / checklist.length) * 100);
};

// メンバーIDを更新
export const updateTaskMemberIds = (
  task: Task,
  memberIds: ReadonlyArray<MemberId>
): Task => ({
  ...task,
  memberIds,
});

// チェックリストアイテムを更新
export const updateChecklistItem = (
  task: Task,
  itemId: string,
  title: string
): Task => ({
  ...task,
  checklist: task.checklist.map(item =>
    item.id === itemId
      ? { ...item, title }
      : item
  ),
});

// タスクを再開
export const reopenTask = (
  task: Task
): Task => ({
  ...task,
  status: 'pending' as const,
  completedAt: undefined,
});

// チェックリストアイテムを作成
export const createChecklistItem = (
  title: string
): ChecklistItem => ({
  id: nanoid(),
  title,
  checked: false,
});

// タスクが期限切れかチェック
export const isTaskOverdue = (
  task: Task,
  currentDate: DateString
): boolean => {
  return task.status === 'pending' && 
         task.dueDate !== undefined && 
         task.dueDate < currentDate;
};