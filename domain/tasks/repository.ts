import { Result } from 'neverthrow';
import type { Task, TaskStatus, Priority } from './types';
import type { TaskId, DateString, MemberId } from '@/domain/shared/branded-types';

/**
 * タスクリポジトリのインターフェース
 * Domain層でインターフェースを定義し、Infrastructure層で実装する
 * 依存性逆転の原則 (DIP) に従った設計
 */

export type TaskRepositoryError = {
  type: 'DatabaseError';
  message: string;
};

export interface ITaskRepository {
  /**
   * タスクを保存する
   */
  save(task: Task): Promise<Result<void, TaskRepositoryError>>;

  /**
   * IDでタスクを取得する
   */
  findById(id: TaskId): Promise<Result<Task | null, TaskRepositoryError>>;

  /**
   * すべてのタスクを取得する
   */
  findAll(): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * ステータスでタスクを検索する
   */
  findByStatus(status: TaskStatus): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * 期限日でタスクを検索する
   */
  findByDueDate(dueDate: DateString): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * 期限日の範囲でタスクを検索する
   */
  findByDueDateRange(startDate: DateString, endDate: DateString): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * メンバーIDでタスクを検索する
   */
  findByMemberId(memberId: MemberId): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * 優先度でタスクを検索する
   */
  findByPriority(priority: Priority): Promise<Result<readonly Task[], TaskRepositoryError>>;

  /**
   * タスクを削除する
   */
  delete(id: TaskId): Promise<Result<void, TaskRepositoryError>>;
}