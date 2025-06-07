import { Result, ok, err } from 'neverthrow';
import type { Task, TaskStatus, Priority } from '@/domain/tasks/types';
import { asTaskId, asDateString, asMemberId } from '@/domain/shared/branded-types';
import type { ITaskRepository } from '@/domain/tasks/repository';
import { isTaskOverdue, calculateChecklistProgress } from '@/domain/tasks/operations';

/**
 * タスク管理のクエリ操作
 * 状態を変更しない読み取り専用操作（Read）
 */

// クエリのエラー型
export type QueryError = 
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string }
  | { type: 'ValidationError'; message: string };

/**
 * すべてのタスクを取得する
 */
export const getAllTasks = async (
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const result = await repository.findAll();
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * IDでタスクを取得する
 */
export const getTaskById = async (
  id: string,
  repository: ITaskRepository
): Promise<Result<Task, QueryError>> => {
  const result = await repository.findById(asTaskId(id));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  const task = result.value;
  if (!task) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  return ok(task);
};

/**
 * ステータスでタスクを取得する
 */
export const getTasksByStatus = async (
  status: TaskStatus,
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const result = await repository.findByStatus(status);
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * 期限日でタスクを取得する
 */
export const getTasksByDueDate = async (
  dueDate: string,
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  // 日付のバリデーション
  try {
    const dateString = asDateString(dueDate);
    const result = await repository.findByDueDate(dateString);
    
    if (result.isErr()) {
      return err({
        type: 'DatabaseError',
        message: result.error.message
      });
    }

    return ok(result.value);
  } catch (error) {
    return err({
      type: 'ValidationError',
      message: '無効な日付形式です'
    });
  }
};

/**
 * 期限日の範囲でタスクを取得する
 */
export const getTasksByDueDateRange = async (
  startDate: string,
  endDate: string,
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  // 日付のバリデーション
  try {
    const start = asDateString(startDate);
    const end = asDateString(endDate);
    
    const result = await repository.findByDueDateRange(start, end);
    
    if (result.isErr()) {
      return err({
        type: 'DatabaseError',
        message: result.error.message
      });
    }

    return ok(result.value);
  } catch (error) {
    return err({
      type: 'ValidationError',
      message: '無効な日付形式です'
    });
  }
};

/**
 * メンバーIDでタスクを取得する
 */
export const getTasksByMemberId = async (
  memberId: string,
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const result = await repository.findByMemberId(asMemberId(memberId));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * 優先度でタスクを取得する
 */
export const getTasksByPriority = async (
  priority: Priority,
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const result = await repository.findByPriority(priority);
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * 未完了のタスクを取得する
 */
export const getPendingTasks = async (
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  return getTasksByStatus('pending', repository);
};

/**
 * 完了済みのタスクを取得する
 */
export const getCompletedTasks = async (
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  return getTasksByStatus('completed', repository);
};

/**
 * 期限切れのタスクを取得する
 */
export const getOverdueTasks = async (
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const pendingResult = await getPendingTasks(repository);
  
  if (pendingResult.isErr()) {
    return err(pendingResult.error);
  }

  const today = new Date();
  const todayString = asDateString(today.toISOString().split('T')[0]);
  
  const overdueTasks = pendingResult.value.filter(task => 
    task.dueDate && isTaskOverdue(task, todayString)
  );

  return ok(overdueTasks);
};

/**
 * 今日が期限のタスクを取得する
 */
export const getTodaysTasks = async (
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  return getTasksByDueDate(todayString, repository);
};

/**
 * 今週が期限のタスクを取得する
 */
export const getThisWeeksTasks = async (
  repository: ITaskRepository
): Promise<Result<readonly Task[], QueryError>> => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  return getTasksByDueDateRange(startDate, endDate, repository);
};

/**
 * タスクが存在するかチェックする
 */
export const taskExists = async (
  id: string,
  repository: ITaskRepository
): Promise<Result<boolean, QueryError>> => {
  const result = await repository.findById(asTaskId(id));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value !== null);
};

/**
 * タスクの統計情報を取得する
 */
export const getTaskStatistics = async (
  repository: ITaskRepository
): Promise<Result<{
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}, QueryError>> => {
  const allTasksResult = await getAllTasks(repository);
  
  if (allTasksResult.isErr()) {
    return err(allTasksResult.error);
  }

  const allTasks = allTasksResult.value;
  const today = asDateString(new Date().toISOString().split('T')[0]);

  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    overdue: allTasks.filter(t => 
      t.status === 'pending' && t.dueDate && isTaskOverdue(t, today)
    ).length,
    highPriority: allTasks.filter(t => t.priority === 'high').length,
    mediumPriority: allTasks.filter(t => t.priority === 'medium').length,
    lowPriority: allTasks.filter(t => t.priority === 'low').length,
  };

  return ok(stats);
};