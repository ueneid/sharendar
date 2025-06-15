import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Activity, ActivityCategory, ActivityStatus, ActivityPriority, CreateActivityCommand, UpdateActivityCommand } from '@/domain/activity/types';
import type { ActivityId, MemberId, DateString } from '@/domain/shared/branded-types';
import { asActivityId } from '@/domain/shared/branded-types';
import { ActivityUseCase } from '@/application/activity/use-cases';
import { getInitializedContainer } from '@/lib/store/container';

/**
 * 統一Activityストア
 * TDDアプローチで実装されたシンプルなインターフェース
 */

// === Filter Types ===

export type ActivityFilters = Readonly<{
  categories: ReadonlyArray<ActivityCategory>;
  statuses: ReadonlyArray<ActivityStatus>;
  priorities: ReadonlyArray<ActivityPriority>;
  memberIds: ReadonlyArray<MemberId>;
  dateRange?: {
    start?: DateString;
    end?: DateString;
  };
  showCompleted: boolean;
}>;

// カレンダー用フィルター型（互換性のため保持）
export interface CalendarFilter {
  memberIds: string[];
  categories: ActivityCategory[];
  showCompleted: boolean;
}

interface ActivityStore {
  // === State ===
  activities: Activity[];
  selectedActivity: ActivityId | null;
  isLoading: boolean;
  error: string | null;
  filters: ActivityFilters;

  // === Actions ===
  
  // Data Operations
  loadAllActivities: () => Promise<void>;
  createActivity: (command: CreateActivityCommand) => Promise<void>;
  updateActivity: (id: ActivityId, command: UpdateActivityCommand) => Promise<void>;
  deleteActivity: (id: ActivityId) => Promise<void>;
  
  // Status Operations
  completeActivity: (id: ActivityId) => Promise<void>;
  reopenActivity: (id: ActivityId) => Promise<void>;
  
  // UI State
  selectActivity: (id: ActivityId | null) => void;
  clearError: () => void;
  
  // Filter Operations
  setFilter: <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => void;
  clearFilter: (key: keyof ActivityFilters) => void;
  resetFilters: () => void;
  
  // Utility Methods
  getActivityById: (id: ActivityId) => Activity | undefined;
  getActivitiesByCategory: (category: ActivityCategory) => Activity[];
  getActivitiesByStatus: (status: ActivityStatus) => Activity[];
  getFilteredActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>()(
  subscribeWithSelector((set, get) => {
    // Use Cases (lazy initialization with error handling)
    const getUseCases = () => {
      try {
        const container = getInitializedContainer();
        return {
          activityUseCase: container.get<ActivityUseCase>('ActivityUseCase'),
        };
      } catch (error) {
        console.error('Failed to initialize ActivityUseCase:', error);
        // モック実装を返すかエラーをスロー
        throw error;
      }
    };

    return {
      // === Initial State ===
      activities: [],
      selectedActivity: null,
      isLoading: false,
      error: null,
      filters: {
        categories: [],
        statuses: [],
        priorities: [],
        memberIds: [],
        dateRange: undefined,
        showCompleted: true
      },

      // === Data Operations ===
      loadAllActivities: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const { activityUseCase } = getUseCases();
          const result = await activityUseCase.getAllActivities();
          
          if (result.isErr()) {
            set({ 
              isLoading: false, 
              error: `アクティビティの読み込みに失敗しました: ${result.error.message}`,
              activities: []
            });
            return;
          }
          
          set({ 
            activities: [...result.value], 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: `アクティビティの読み込みに失敗しました: ${error}`,
            activities: []
          });
        }
      },

      createActivity: async (command: CreateActivityCommand) => {
        set({ isLoading: true, error: null });
        
        try {
          const { activityUseCase } = getUseCases();
          const result = await activityUseCase.createActivity(command);
          
          if (result.isErr()) {
            set({ 
              isLoading: false, 
              error: `アクティビティの作成に失敗しました: ${result.error.message}`
            });
            return;
          }
          
          const currentActivities = get().activities;
          set({ 
            activities: [...currentActivities, result.value], 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: `アクティビティの作成に失敗しました: ${error}`
          });
        }
      },

      updateActivity: async (id: ActivityId, command: UpdateActivityCommand) => {
        set({ isLoading: true, error: null });
        
        try {
          const { activityUseCase } = getUseCases();
          const result = await activityUseCase.updateActivity(id, command);
          
          if (result.isErr()) {
            set({ 
              isLoading: false, 
              error: `アクティビティの更新に失敗しました: ${result.error.message}`
            });
            return;
          }
          
          const currentActivities = get().activities;
          const updatedActivities = currentActivities.map(activity =>
            activity.id === id ? result.value : activity
          );
          
          set({ 
            activities: updatedActivities, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: `アクティビティの更新に失敗しました: ${error}`
          });
        }
      },

      deleteActivity: async (id: ActivityId) => {
        set({ isLoading: true, error: null });
        
        try {
          const { activityUseCase } = getUseCases();
          const result = await activityUseCase.deleteActivity(id);
          
          if (result.isErr()) {
            set({ 
              isLoading: false, 
              error: `アクティビティの削除に失敗しました: ${result.error.message}`
            });
            return;
          }
          
          const currentActivities = get().activities;
          const filteredActivities = currentActivities.filter(activity => activity.id !== id);
          
          set({ 
            activities: filteredActivities, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: `アクティビティの削除に失敗しました: ${error}`
          });
        }
      },

      // === Status Operations ===
      completeActivity: async (id: ActivityId) => {
        set({ isLoading: true, error: null });
        
        try {
          const { activityUseCase } = getUseCases();
          const result = await activityUseCase.completeActivity(id);
          
          if (result.isErr()) {
            set({ 
              isLoading: false, 
              error: `アクティビティの完了に失敗しました: ${result.error.message}`
            });
            return;
          }
          
          const currentActivities = get().activities;
          const updatedActivities = currentActivities.map(activity =>
            activity.id === id ? result.value : activity
          );
          
          set({ 
            activities: updatedActivities, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: `アクティビティの完了に失敗しました: ${error}`
          });
        }
      },

      reopenActivity: async (id: ActivityId) => {
        set({ isLoading: true, error: null });
        
        try {
          const { activityUseCase } = getUseCases();
          const result = await activityUseCase.reopenActivity(id);
          
          if (result.isErr()) {
            set({ 
              isLoading: false, 
              error: `アクティビティの再開に失敗しました: ${result.error.message}`
            });
            return;
          }
          
          const currentActivities = get().activities;
          const updatedActivities = currentActivities.map(activity =>
            activity.id === id ? result.value : activity
          );
          
          set({ 
            activities: updatedActivities, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: `アクティビティの再開に失敗しました: ${error}`
          });
        }
      },

      // === UI State ===
      selectActivity: (id: ActivityId | null) => {
        set({ selectedActivity: id });
      },

      clearError: () => {
        set({ error: null });
      },

      // === Utility Methods ===
      getActivityById: (id: ActivityId) => {
        const activities = get().activities;
        return activities.find(activity => activity.id === id);
      },

      getActivitiesByCategory: (category: ActivityCategory) => {
        const activities = get().activities;
        return activities.filter(activity => activity.category === category);
      },

      getActivitiesByStatus: (status: ActivityStatus) => {
        const activities = get().activities;
        return activities.filter(activity => activity.status === status);
      },

      // === Filter Operations ===
      setFilter: <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => {
        set(state => ({
          filters: {
            ...state.filters,
            [key]: value
          }
        }));
      },

      clearFilter: (key: keyof ActivityFilters) => {
        set(state => {
          const newFilters = { ...state.filters };
          
          switch (key) {
            case 'categories':
              newFilters.categories = [];
              break;
            case 'statuses':
              newFilters.statuses = [];
              break;
            case 'priorities':
              newFilters.priorities = [];
              break;
            case 'memberIds':
              newFilters.memberIds = [];
              break;
            case 'dateRange':
              newFilters.dateRange = undefined;
              break;
            case 'showCompleted':
              newFilters.showCompleted = true;
              break;
          }
          
          return { filters: newFilters };
        });
      },

      resetFilters: () => {
        set({
          filters: {
            categories: [],
            statuses: [],
            priorities: [],
            memberIds: [],
            dateRange: undefined,
            showCompleted: true
          }
        });
      },

      getFilteredActivities: () => {
        const { activities, filters } = get();
        
        return activities.filter(activity => {
          // Category filter
          if (filters.categories.length > 0 && !filters.categories.includes(activity.category)) {
            return false;
          }
          
          // Member filter
          if (filters.memberIds.length > 0) {
            const hasCommonMember = filters.memberIds.some(memberId => 
              activity.memberIds.some(activityMemberId => activityMemberId === memberId)
            );
            if (!hasCommonMember) {
              return false;
            }
          }
          
          // Status filter
          if (filters.statuses.length > 0 && !filters.statuses.includes(activity.status)) {
            return false;
          }
          
          // Priority filter
          if (filters.priorities.length > 0 && !filters.priorities.includes(activity.priority)) {
            return false;
          }
          
          // Show completed filter
          if (!filters.showCompleted && activity.status === 'completed') {
            return false;
          }
          
          // Date range filter
          if (filters.dateRange?.start || filters.dateRange?.end) {
            const activityStartDate = activity.startDate ? new Date(activity.startDate) : null;
            const activityEndDate = activity.endDate ? new Date(activity.endDate) : null;
            const activityDueDate = activity.dueDate ? new Date(activity.dueDate) : null;
            
            let matchesDateRange = false;
            
            // Activityが指定された日付範囲に含まれるかチェック
            const checkDateInRange = (date: Date | null) => {
              if (!date) return false;
              
              const fromCheck = !filters.dateRange?.start || date >= new Date(filters.dateRange.start);
              const toCheck = !filters.dateRange?.end || date <= new Date(filters.dateRange.end);
              
              return fromCheck && toCheck;
            };
            
            // 開始日、終了日、期限のいずれかが範囲内にあればマッチ
            if (checkDateInRange(activityStartDate) || 
                checkDateInRange(activityEndDate) || 
                checkDateInRange(activityDueDate)) {
              matchesDateRange = true;
            }
            
            if (!matchesDateRange) {
              return false;
            }
          }
          
          return true;
        });
      },
    };
  })
);