import { Result, ok, err } from 'neverthrow';
import type { Task, Priority, ChecklistItem } from '@/domain/tasks/types';
import type { TaskTitle, DateString, MemberId } from '@/domain/shared/branded-types';
import { asTaskId, asMemberId, asDateString } from '@/domain/shared/branded-types';
import { 
  createTask as createTaskPure,
  updateTaskTitle,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskMemberIds,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  toggleChecklistItem,
  completeTask,
  reopenTask,
  createChecklistItem
} from '@/domain/tasks/operations';
import { 
  createTaskTitle,
  createDateString,
  validatePriority
} from '@/domain/tasks/validations';
import type { 
  ITaskRepository,
  TaskRepositoryError
} from '@/domain/tasks/repository';

/**
 * タスク管理のコマンド操作
 * 状態を変更する操作（Create, Update, Delete）
 */

// コマンドのエラー型
export type CommandError = 
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

// タスク作成コマンド
export interface CreateTaskCommand {
  title: string;
  dueDate?: string;
  priority?: Priority;
  memberIds?: string[];
  checklist?: { title: string }[];
}

// タスク更新コマンド
export interface UpdateTaskCommand {
  id: string;
  title?: string;
  dueDate?: string | null; // nullは期限をクリアする
  priority?: Priority;
  memberIds?: string[];
}

// チェックリストアイテム追加コマンド
export interface AddChecklistItemCommand {
  taskId: string;
  title: string;
}

// チェックリストアイテム更新コマンド
export interface UpdateChecklistItemCommand {
  taskId: string;
  itemId: string;
  title: string;
}

// チェックリストアイテムトグルコマンド
export interface ToggleChecklistItemCommand {
  taskId: string;
  itemId: string;
}

/**
 * タスクを作成する
 */
export const createTask = async (
  command: CreateTaskCommand,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // バリデーション
  const titleResult = createTaskTitle(command.title);
  if (titleResult.isErr()) {
    return err({ type: 'ValidationError', message: titleResult.error });
  }

  let dueDate: DateString | undefined;
  if (command.dueDate) {
    const dueDateResult = createDateString(command.dueDate);
    if (dueDateResult.isErr()) {
      return err({ type: 'ValidationError', message: dueDateResult.error });
    }
    dueDate = dueDateResult.value;
  }

  // 優先度のバリデーション
  const priority = command.priority || 'medium';
  const priorityResult = validatePriority(priority);
  if (priorityResult.isErr()) {
    return err({ type: 'ValidationError', message: priorityResult.error });
  }

  // MemberIdの変換
  const memberIds = (command.memberIds || []).map(id => asMemberId(id));

  // チェックリストの作成
  const checklist: ChecklistItem[] = (command.checklist || []).map(item =>
    createChecklistItem(item.title)
  );

  // ドメインオブジェクト作成
  const task = createTaskPure({
    title: titleResult.value,
    dueDate,
    priority,
    memberIds,
    checklist
  });

  // 永続化
  const saveResult = await repository.save(task);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(task);
};

/**
 * タスクを更新する
 */
export const updateTask = async (
  command: UpdateTaskCommand,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(command.id));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  let updatedTask = existingTask;

  // タイトルの更新
  if (command.title !== undefined) {
    const titleResult = createTaskTitle(command.title);
    if (titleResult.isErr()) {
      return err({ type: 'ValidationError', message: titleResult.error });
    }
    updatedTask = updateTaskTitle(updatedTask, titleResult.value);
  }

  // 期限の更新
  if (command.dueDate !== undefined) {
    if (command.dueDate === null) {
      // 期限をクリア
      updatedTask = { ...updatedTask, dueDate: undefined };
    } else {
      const dueDateResult = createDateString(command.dueDate);
      if (dueDateResult.isErr()) {
        return err({ type: 'ValidationError', message: dueDateResult.error });
      }
      updatedTask = updateTaskDueDate(updatedTask, dueDateResult.value);
    }
  }

  // 優先度の更新
  if (command.priority !== undefined) {
    const priorityResult = validatePriority(command.priority);
    if (priorityResult.isErr()) {
      return err({ type: 'ValidationError', message: priorityResult.error });
    }
    updatedTask = updateTaskPriority(updatedTask, command.priority);
  }

  // メンバーIDの更新
  if (command.memberIds !== undefined) {
    const memberIds = command.memberIds.map(id => asMemberId(id));
    updatedTask = updateTaskMemberIds(updatedTask, memberIds);
  }

  // 永続化
  const saveResult = await repository.save(updatedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedTask);
};

/**
 * タスクを完了する
 */
export const completeTaskCommand = async (
  taskId: string,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(taskId));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  // 完了日時を現在時刻に設定
  const now = new Date();
  const completedAt = asDateString(now.toISOString().split('T')[0]);
  const completedTask = completeTask(existingTask, completedAt);

  // 永続化
  const saveResult = await repository.save(completedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(completedTask);
};

/**
 * タスクを再開する
 */
export const reopenTaskCommand = async (
  taskId: string,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(taskId));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  const reopenedTask = reopenTask(existingTask);

  // 永続化
  const saveResult = await repository.save(reopenedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(reopenedTask);
};

/**
 * チェックリストアイテムを追加する
 */
export const addChecklistItemCommand = async (
  command: AddChecklistItemCommand,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(command.taskId));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  const updatedTask = addChecklistItem(existingTask, command.title);

  // 永続化
  const saveResult = await repository.save(updatedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedTask);
};

/**
 * チェックリストアイテムを更新する
 */
export const updateChecklistItemCommand = async (
  command: UpdateChecklistItemCommand,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(command.taskId));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  const updatedTask = updateChecklistItem(existingTask, command.itemId, command.title);

  // 永続化
  const saveResult = await repository.save(updatedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedTask);
};

/**
 * チェックリストアイテムをトグルする
 */
export const toggleChecklistItemCommand = async (
  command: ToggleChecklistItemCommand,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(command.taskId));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  const updatedTask = toggleChecklistItem(existingTask, command.itemId);

  // 永続化
  const saveResult = await repository.save(updatedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedTask);
};

/**
 * チェックリストアイテムを削除する
 */
export const removeChecklistItemCommand = async (
  taskId: string,
  itemId: string,
  repository: ITaskRepository
): Promise<Result<Task, CommandError>> => {
  // 既存タスクを取得
  const taskResult = await repository.findById(asTaskId(taskId));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  const existingTask = taskResult.value;
  if (!existingTask) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  const updatedTask = removeChecklistItem(existingTask, itemId);

  // 永続化
  const saveResult = await repository.save(updatedTask);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedTask);
};

/**
 * タスクを削除する
 */
export const deleteTask = async (
  id: string,
  repository: ITaskRepository
): Promise<Result<void, CommandError>> => {
  // 存在確認
  const taskResult = await repository.findById(asTaskId(id));
  if (taskResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: taskResult.error.message
    });
  }

  if (!taskResult.value) {
    return err({
      type: 'NotFound',
      message: '指定されたタスクが見つかりません'
    });
  }

  // 削除実行
  const deleteResult = await repository.delete(asTaskId(id));
  if (deleteResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: deleteResult.error.message
    });
  }

  return ok(undefined);
};