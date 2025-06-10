/**
 * タスク管理ストア
 * Application層のTaskUseCaseと統合
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, TaskId, Priority } from '@/domain/tasks/types';
import type { MemberId } from '@/domain/family/types';
import type { DateString } from '@/domain/shared/branded-types';
import { getTaskUseCase, getCalendarEventUseCase } from './container';
import { createAsyncActions, createInitialAsyncState, normalizeError } from './helpers';
import type { AsyncState, BaseStore } from './types';
import type { CalendarEvent } from '@/domain/calendar/types';
import { asTaskId, asTaskTitle, asDateString } from '@/domain/shared/branded-types';

// ===== CalendarEventからTaskへの変換 =====

const convertCalendarEventToTask = (event: CalendarEvent): Task => ({
  id: asTaskId(`calendar_${event.id}`), // プレフィックス付きで重複を避ける
  title: asTaskTitle(event.title),
  dueDate: event.date,
  priority: 'medium' as Priority, // デフォルト優先度
  status: 'pending' as const,
  memberIds: event.memberIds,
  checklist: [], // CalendarEventにはchecklistがないので空配列
  createdAt: event.date, // 作成日として日付を使用
  memo: event.memo,
});

// ===== 状態の型定義 =====

interface TaskFilter {
  memberIds: string[];
  status: 'all' | 'pending' | 'completed';
  priority: Priority | 'all';
  dueDateRange: {
    start?: DateString;
    end?: DateString;
  };
}

interface TaskForm {
  isOpen: boolean;
  editingTask: Task | null;
}

interface TaskState extends AsyncState, BaseStore {
  // データ状態
  tasks: readonly Task[];
  selectedTaskId: TaskId | null;
  
  // UI状態
  filter: TaskFilter;
  form: TaskForm;
  
  // 基本操作
  loadTasks: () => Promise<void>;
  createTask: (title: string, options?: {
    dueDate?: DateString;
    priority?: Priority;
    memberIds?: string[];
    checklist?: Array<{ title: string }>;
    memo?: string;
  }) => Promise<void>;
  updateTask: (id: TaskId, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: TaskId) => Promise<void>;
  
  // タスク操作
  completeTask: (id: TaskId) => Promise<void>;
  reopenTask: (id: TaskId) => Promise<void>;
  
  // 選択・フィルタ
  selectTask: (id: TaskId | null) => void;
  setFilter: (updates: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  
  // フォーム管理
  openTaskForm: (task?: Task) => void;
  closeTaskForm: () => void;
  
  // 状態管理
  reset: () => void;
  
  // 非同期操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  execute: <R>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: string) => void
  ) => Promise<void>;
  
  // 計算プロパティ用のゲッター
  getFilteredTasks: () => readonly Task[];
  getTasksByMember: (memberId: MemberId) => readonly Task[];
  getTasksByDate: (date: DateString) => readonly Task[];
  getOverdueTasks: () => readonly Task[];
  getTaskProgress: (taskId: TaskId) => { completed: number; total: number; percentage: number };
}

// ===== 初期状態 =====

const initialFilter: TaskFilter = {
  memberIds: [],
  status: 'all',
  priority: 'all',
  dueDateRange: {},
};

const initialForm: TaskForm = {
  isOpen: false,
  editingTask: null,
};

// ===== ストア作成 =====

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => {
      const asyncActions = createAsyncActions(set);
      
      return {
        // 初期状態
        ...createInitialAsyncState(),
        tasks: [],
        selectedTaskId: null,
        filter: initialFilter,
        form: initialForm,

        // 基本操作
        loadTasks: async () => {
          await asyncActions.execute(async () => {
            // 1. 専用のTasksを取得
            const taskUseCase = getTaskUseCase();
            const taskResult = await taskUseCase.getAllTasks();
            
            if (taskResult.isErr()) {
              throw new Error(taskResult.error.message);
            }
            
            // 2. カレンダーからタスクタイプのイベントを取得
            const calendarUseCase = getCalendarEventUseCase();
            const eventResult = await calendarUseCase.getAllEvents();
            
            if (eventResult.isErr()) {
              throw new Error(eventResult.error.message);
            }
            
            // 3. CalendarEventのtask型をTaskに変換
            const calendarTasks = eventResult.value
              .filter(event => event.type === 'task')
              .map(convertCalendarEventToTask);
            
            // 4. 両方を統合
            const allTasks = [...taskResult.value, ...calendarTasks];
            
            set({ tasks: allTasks });
          });
        },

        createTask: async (title, options = {}) => {
          await asyncActions.execute(async () => {
            const useCase = getTaskUseCase();
            const result = await useCase.createTask(title, options);
            
            if (result.isErr()) {
              throw new Error(result.error.message);
            }
            
            set(state => ({ 
              tasks: [...state.tasks, result.value],
              form: { isOpen: false, editingTask: null }
            }));
          });
        },

        updateTask: async (id, updates) => {
          await asyncActions.execute(async () => {
            const useCase = getTaskUseCase();
            const result = await useCase.updateTask(id, updates);
            
            if (result.isErr()) {
              throw new Error(result.error.message);
            }
            
            set(state => ({
              tasks: state.tasks.map(task => 
                task.id === id ? result.value : task
              ),
              form: { isOpen: false, editingTask: null }
            }));
          });
        },

        deleteTask: async (id) => {
          await asyncActions.execute(async () => {
            const useCase = getTaskUseCase();
            const result = await useCase.deleteTask(id);
            
            if (result.isErr()) {
              throw new Error(result.error.message);
            }
            
            set(state => ({
              tasks: state.tasks.filter(task => task.id !== id),
              selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId
            }));
          });
        },

      // タスク操作
      completeTask: async (id) => {
        await get().updateTask(id, {
          status: 'completed',
          completedAt: new Date().toISOString().split('T')[0] as DateString,
        });
      },

      reopenTask: async (id) => {
        await get().updateTask(id, {
          status: 'pending',
          completedAt: undefined,
        });
      },

      // 選択・フィルタ
      selectTask: (id) => {
        set({ selectedTaskId: id });
      },

      setFilter: (updates) => {
        set(state => ({
          filter: { ...state.filter, ...updates }
        }));
      },

      clearFilter: () => {
        set({ filter: initialFilter });
      },

      // フォーム管理
      openTaskForm: (task) => {
        set({
          form: {
            isOpen: true,
            editingTask: task || null,
          }
        });
      },

      closeTaskForm: () => {
        set({
          form: {
            isOpen: false,
            editingTask: null,
          }
        });
      },


      // 計算プロパティ用のゲッター
      getFilteredTasks: () => {
        const { tasks, filter } = get();
        
        return tasks.filter(task => {
          // メンバーフィルター
          if (filter.memberIds.length > 0) {
            const hasMatchingMember = task.memberIds.some(id => 
              filter.memberIds.includes(id)
            );
            if (!hasMatchingMember) return false;
          }

          // ステータスフィルター
          if (filter.status !== 'all' && task.status !== filter.status) {
            return false;
          }

          // 優先度フィルター
          if (filter.priority !== 'all' && task.priority !== filter.priority) {
            return false;
          }

          // 期限フィルター
          if (task.dueDate) {
            if (filter.dueDateRange.start && task.dueDate < filter.dueDateRange.start) {
              return false;
            }
            if (filter.dueDateRange.end && task.dueDate > filter.dueDateRange.end) {
              return false;
            }
          }

          return true;
        });
      },

      getTasksByMember: (memberId) => {
        return get().tasks.filter(task => 
          task.memberIds.includes(memberId)
        );
      },

      getTasksByDate: (date) => {
        return get().tasks.filter(task => task.dueDate === date);
      },

      getOverdueTasks: () => {
        const today = new Date().toISOString().split('T')[0] as DateString;
        return get().tasks.filter(task => 
          task.status === 'pending' && 
          task.dueDate && 
          task.dueDate < today
        );
      },

      getTaskProgress: (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) {
          return { completed: 0, total: 0, percentage: 0 };
        }

        const total = task.checklist.length;
        const completed = task.checklist.filter(item => item.checked).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage };
      },
      
      // 状態管理
      reset: () => {
        set({
          ...createInitialAsyncState(),
          tasks: [],
          selectedTaskId: null,
          filter: initialFilter,
          form: initialForm,
        });
      },
      
      // 非同期操作
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      execute: async <R,>(
        operation: () => Promise<R>,
        onSuccess?: (result: R) => void,
        onError?: (error: string) => void
      ) => {
        try {
          set({ loading: true, error: null });
          const result = await operation();
          if (onSuccess) {
            onSuccess(result);
          }
        } catch (error) {
          const errorMessage = normalizeError(error);
          set({ error: errorMessage });
          if (onError) {
            onError(errorMessage);
          }
          throw error;
        } finally {
          set({ loading: false });
        }
      },
    };
    },
    { name: 'task-store' }
  )
);

// ===== セレクター =====

export const useTasks = () => useTaskStore(state => state.tasks);
export const useFilteredTasks = () => useTaskStore(state => state.getFilteredTasks());
export const useSelectedTask = () => {
  const selectedTaskId = useTaskStore(state => state.selectedTaskId);
  const tasks = useTaskStore(state => state.tasks);
  return selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;
};

export const useTaskFilter = () => useTaskStore(state => state.filter);
export const useTaskForm = () => useTaskStore(state => state.form);
export const useTaskAsync = () => useTaskStore(state => ({
  loading: state.loading,
  error: state.error,
  setError: state.setError,
}));

export const useOverdueTasks = () => useTaskStore(state => state.getOverdueTasks());
export const useTasksByMember = (memberId: MemberId) => 
  useTaskStore(state => state.getTasksByMember(memberId));