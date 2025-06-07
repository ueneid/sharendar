/**
 * タスク管理のユースケース
 * コマンドとクエリを組み合わせた高レベルな操作
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Result } from 'neverthrow';
import type { Task, Priority } from '@/domain/tasks/types';
import type { ITaskRepository } from '@/domain/tasks/repository';
import { TYPES } from '@/application/shared/types';

// コマンドとクエリの再エクスポート
export {
  createTask,
  updateTask,
  deleteTask,
  completeTaskCommand,
  reopenTaskCommand,
  addChecklistItemCommand,
  updateChecklistItemCommand,
  toggleChecklistItemCommand,
  removeChecklistItemCommand,
  type CreateTaskCommand,
  type UpdateTaskCommand,
  type AddChecklistItemCommand,
  type UpdateChecklistItemCommand,
  type ToggleChecklistItemCommand,
  type CommandError
} from './commands';

export {
  getAllTasks,
  getTaskById,
  getTasksByStatus,
  getTasksByDueDate,
  getTasksByDueDateRange,
  getTasksByMemberId,
  getTasksByPriority,
  getPendingTasks,
  getCompletedTasks,
  getOverdueTasks,
  getTodaysTasks,
  getThisWeeksTasks,
  taskExists,
  getTaskStatistics,
  type QueryError
} from './queries';

// 統合エラー型
export type TaskUseCaseError = 
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

/**
 * タスク管理のファサード
 * InversifyJSで依存性注入を行う
 */
@injectable()
export class TaskUseCase {
  constructor(
    @inject(TYPES.ITaskRepository)
    private readonly repository: ITaskRepository
  ) {}

  /**
   * 新しいタスクを作成
   */
  async createTask(
    title: string,
    options?: {
      dueDate?: string;
      priority?: Priority;
      memberIds?: string[];
      checklist?: { title: string }[];
    }
  ): Promise<Result<Task, TaskUseCaseError>> {
    const { createTask } = await import('./commands');
    
    return createTask(
      {
        title,
        dueDate: options?.dueDate,
        priority: options?.priority,
        memberIds: options?.memberIds,
        checklist: options?.checklist
      },
      this.repository
    );
  }

  /**
   * タスクを更新
   */
  async updateTask(
    id: string,
    updates: {
      title?: string;
      dueDate?: string | null;
      priority?: Priority;
      memberIds?: string[];
    }
  ): Promise<Result<Task, TaskUseCaseError>> {
    const { updateTask } = await import('./commands');
    
    return updateTask(
      {
        id,
        ...updates
      },
      this.repository
    );
  }

  /**
   * タスクを削除
   */
  async deleteTask(id: string): Promise<Result<void, TaskUseCaseError>> {
    const { deleteTask } = await import('./commands');
    
    return deleteTask(id, this.repository);
  }

  /**
   * タスクを完了する
   */
  async completeTask(id: string): Promise<Result<Task, TaskUseCaseError>> {
    const { completeTaskCommand } = await import('./commands');
    
    return completeTaskCommand(id, this.repository);
  }

  /**
   * タスクを再開する
   */
  async reopenTask(id: string): Promise<Result<Task, TaskUseCaseError>> {
    const { reopenTaskCommand } = await import('./commands');
    
    return reopenTaskCommand(id, this.repository);
  }

  /**
   * チェックリストアイテムを追加
   */
  async addChecklistItem(
    taskId: string,
    title: string
  ): Promise<Result<Task, TaskUseCaseError>> {
    const { addChecklistItemCommand } = await import('./commands');
    
    return addChecklistItemCommand({ taskId, title }, this.repository);
  }

  /**
   * チェックリストアイテムを更新
   */
  async updateChecklistItem(
    taskId: string,
    itemId: string,
    title: string
  ): Promise<Result<Task, TaskUseCaseError>> {
    const { updateChecklistItemCommand } = await import('./commands');
    
    return updateChecklistItemCommand({ taskId, itemId, title }, this.repository);
  }

  /**
   * チェックリストアイテムをトグル
   */
  async toggleChecklistItem(
    taskId: string,
    itemId: string
  ): Promise<Result<Task, TaskUseCaseError>> {
    const { toggleChecklistItemCommand } = await import('./commands');
    
    return toggleChecklistItemCommand({ taskId, itemId }, this.repository);
  }

  /**
   * チェックリストアイテムを削除
   */
  async removeChecklistItem(
    taskId: string,
    itemId: string
  ): Promise<Result<Task, TaskUseCaseError>> {
    const { removeChecklistItemCommand } = await import('./commands');
    
    return removeChecklistItemCommand(taskId, itemId, this.repository);
  }

  /**
   * すべてのタスクを取得
   */
  async getAllTasks(): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getAllTasks } = await import('./queries');
    
    return getAllTasks(this.repository);
  }

  /**
   * IDでタスクを取得
   */
  async getTaskById(id: string): Promise<Result<Task, TaskUseCaseError>> {
    const { getTaskById } = await import('./queries');
    
    return getTaskById(id, this.repository);
  }

  /**
   * 未完了のタスクを取得
   */
  async getPendingTasks(): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getPendingTasks } = await import('./queries');
    
    return getPendingTasks(this.repository);
  }

  /**
   * 完了済みのタスクを取得
   */
  async getCompletedTasks(): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getCompletedTasks } = await import('./queries');
    
    return getCompletedTasks(this.repository);
  }

  /**
   * 期限切れのタスクを取得
   */
  async getOverdueTasks(): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getOverdueTasks } = await import('./queries');
    
    return getOverdueTasks(this.repository);
  }

  /**
   * 今日のタスクを取得
   */
  async getTodaysTasks(): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getTodaysTasks } = await import('./queries');
    
    return getTodaysTasks(this.repository);
  }

  /**
   * 今週のタスクを取得
   */
  async getThisWeeksTasks(): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getThisWeeksTasks } = await import('./queries');
    
    return getThisWeeksTasks(this.repository);
  }

  /**
   * メンバーのタスクを取得
   */
  async getTasksByMemberId(memberId: string): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getTasksByMemberId } = await import('./queries');
    
    return getTasksByMemberId(memberId, this.repository);
  }

  /**
   * 優先度でタスクを取得
   */
  async getTasksByPriority(priority: Priority): Promise<Result<readonly Task[], TaskUseCaseError>> {
    const { getTasksByPriority } = await import('./queries');
    
    return getTasksByPriority(priority, this.repository);
  }

  /**
   * タスクの統計情報を取得
   */
  async getTaskStatistics(): Promise<Result<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  }, TaskUseCaseError>> {
    const { getTaskStatistics } = await import('./queries');
    
    return getTaskStatistics(this.repository);
  }

  /**
   * タスクが存在するかチェック
   */
  async taskExists(id: string): Promise<Result<boolean, TaskUseCaseError>> {
    const { taskExists } = await import('./queries');
    
    return taskExists(id, this.repository);
  }
}