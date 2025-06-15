import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Activity, ActivityCategory, ActivityStatus, CreateActivityCommand, UpdateActivityCommand } from '@/domain/activity/types';
import type { ActivityId } from '@/domain/shared/branded-types';
import { asActivityId } from '@/domain/shared/branded-types';
import { ActivityUseCase } from '@/application/activity/use-cases';
import { getInitializedContainer } from '@/lib/store/container';

/**
 * 統一Activityストア
 * TDDアプローチで実装されたシンプルなインターフェース
 */

interface ActivityStore {
  // === State ===
  activities: Activity[];
  selectedActivity: ActivityId | null;
  isLoading: boolean;
  error: string | null;

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
  
  // Utility Methods
  getActivityById: (id: ActivityId) => Activity | undefined;
  getActivitiesByCategory: (category: ActivityCategory) => Activity[];
  getActivitiesByStatus: (status: ActivityStatus) => Activity[];
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
    };
  })
);