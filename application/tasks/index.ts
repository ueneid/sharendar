/**
 * タスク管理のApplication層
 * エクスポートの集約
 */

// ユースケースのエクスポート
export { TaskUseCase } from './use-cases';

// コマンドのエクスポート
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
  type ToggleChecklistItemCommand
} from './commands';

// クエリのエクスポート
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
  getTaskStatistics
} from './queries';

// エラー型のエクスポート
export type {
  CommandError,
  QueryError,
  TaskUseCaseError
} from './use-cases';