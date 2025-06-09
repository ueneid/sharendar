/**
 * Tasks Zustandストア (簡略版)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, TaskId, Priority } from '@/domain/tasks/types';
import type { MemberId } from '@/domain/family/types';
import type { DateString } from '@/domain/shared/branded-types';

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

interface TaskState {
  // データ状態
  tasks: readonly Task[];
  selectedTaskId: TaskId | null;
  
  // UI状態
  filter: TaskFilter;
  form: TaskForm;
  loading: boolean;
  error: string | null;
  
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
  setError: (error: string | null) => void;
  reset: () => void;
  
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
    (set, get) => ({
      // 初期状態
      tasks: [],
      selectedTaskId: null,
      filter: initialFilter,
      form: initialForm,
      loading: false,
      error: null,

      // 基本操作 (モック実装)
      loadTasks: async () => {
        set({ loading: true, error: null });
        try {
          // TODO: Application層との統合
          set({ tasks: [], loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'エラーが発生しました', loading: false });
        }
      },

      createTask: async (title, options = {}) => {
        set({ loading: true, error: null });
        try {
          // TODO: Application層との統合
          const newTask: Task = {
            id: `task_${Date.now()}` as TaskId,
            title: title as any,
            dueDate: options.dueDate,
            priority: options.priority || 'medium',
            status: 'pending',
            memberIds: (options.memberIds || []) as MemberId[],
            checklist: (options.checklist || []).map(item => ({
              id: `item_${Date.now()}`,
              title: item.title,
              checked: false,
            })),
            memo: options.memo,
            createdAt: new Date().toISOString().split('T')[0] as DateString,
          };
          
          set(state => ({ 
            tasks: [newTask, ...state.tasks],
            loading: false,
            form: { isOpen: false, editingTask: null }
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'エラーが発生しました', loading: false });
        }
      },

      updateTask: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id ? { ...task, ...updates } : task
            ),
            loading: false,
            form: { isOpen: false, editingTask: null }
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'エラーが発生しました', loading: false });
        }
      },

      deleteTask: async (id) => {
        set({ loading: true, error: null });
        try {
          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id),
            selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
            loading: false
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'エラーが発生しました', loading: false });
        }
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

      // 状態管理
      setError: (error) => {
        set({ error });
      },

      reset: () => {
        set({
          tasks: [],
          selectedTaskId: null,
          filter: initialFilter,
          form: initialForm,
          loading: false,
          error: null,
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
    }),
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