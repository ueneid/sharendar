import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActivityStore } from '@/lib/store/activity-store';
import type { ActivityUseCase } from '@/application/activity/use-cases';
import type { Activity } from '@/domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '@/domain/shared/branded-types';
import { ok, err } from 'neverthrow';

// ActivityUseCaseのモック
const mockActivityUseCase = {
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
  getActivityById: vi.fn(),
  getAllActivities: vi.fn(),
  completeActivity: vi.fn(),
  reopenActivity: vi.fn(),
  getActivitiesByDateRange: vi.fn(),
  getActivitiesByMemberId: vi.fn(),
  getOverdueActivities: vi.fn(),
  getUpcomingActivities: vi.fn(),
} as unknown as ActivityUseCase;

// DIコンテナのモック
vi.mock('@/lib/store/container', () => ({
  getInitializedContainer: () => ({
    get: (key: string) => {
      if (key === 'ActivityUseCase') return mockActivityUseCase;
      if (key === 'ActivityRepository') return {}; // 必要に応じてモック
      throw new Error(`Mock not found for ${key}`);
    }
  })
}));

describe('useActivityStore', () => {
  let testActivity: Activity;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    
    // Zustandストアをリセット
    const { result } = renderHook(() => useActivityStore());
    result.current.activities.length = 0;
    result.current.selectedActivity = null;
    result.current.isLoading = false;
    result.current.error = null;
    
    // テスト用のActivityデータ
    testActivity = {
      id: asActivityId('test-activity-1'),
      title: asActivityTitle('テストタスク'),
      description: 'テスト用のタスクです',
      category: 'task',
      status: 'pending',
      priority: 'medium',
      memberIds: [asMemberId('member-1')],
      checklist: [
        { id: 'check-1', title: 'チェック項目1', checked: false },
        { id: 'check-2', title: 'チェック項目2', checked: true }
      ],
      isAllDay: true,
      startDate: asDateString('2025-06-15'),
      dueDate: asDateString('2025-06-20'),
      createdAt: asDateString('2025-06-11'),
      updatedAt: asDateString('2025-06-11'),
      tags: ['重要', '家事']
    };
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useActivityStore());
      
      expect(result.current.activities).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedActivity).toBeNull();
    });
  });

  describe('loadAllActivities', () => {
    it('should load activities successfully', async () => {
      const activities = [testActivity];
      mockActivityUseCase.getAllActivities = vi.fn().mockResolvedValue(ok(activities));
      
      const { result } = renderHook(() => useActivityStore());
      
      await act(async () => {
        await result.current.loadAllActivities();
      });
      
      expect(result.current.activities).toEqual(activities);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockActivityUseCase.getAllActivities).toHaveBeenCalledTimes(1);
    });

    it('should handle loading error', async () => {
      const error = {
        type: 'DatabaseError' as const,
        message: 'データベース接続エラー'
      };
      mockActivityUseCase.getAllActivities = vi.fn().mockResolvedValue(err(error));
      
      const { result } = renderHook(() => useActivityStore());
      
      await act(async () => {
        await result.current.loadAllActivities();
      });
      
      expect(result.current.activities).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('アクティビティの読み込みに失敗しました: データベース接続エラー');
    });

    it('should show loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockActivityUseCase.getAllActivities = vi.fn().mockReturnValue(promise);
      
      const { result } = renderHook(() => useActivityStore());
      
      // 非同期操作を開始
      act(() => {
        result.current.loadAllActivities();
      });
      
      // ローディング状態を確認
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      
      // 操作完了
      await act(async () => {
        resolvePromise!(ok([testActivity]));
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activities).toEqual([testActivity]);
    });
  });

  describe('createActivity', () => {
    it('should create activity successfully', async () => {
      const command = {
        title: 'テストタスク',
        category: 'task' as const,
        priority: 'medium' as const
      };
      
      mockActivityUseCase.createActivity = vi.fn().mockResolvedValue(ok(testActivity));
      
      const { result } = renderHook(() => useActivityStore());
      
      await act(async () => {
        await result.current.createActivity(command);
      });
      
      expect(result.current.activities).toContain(testActivity);
      expect(mockActivityUseCase.createActivity).toHaveBeenCalledWith(command);
    });

    it('should handle creation error', async () => {
      const command = {
        title: '',
        category: 'task' as const,
        priority: 'medium' as const
      };
      
      const error = {
        type: 'ValidationError' as const,
        message: 'タイトルを入力してください',
        field: 'title'
      };
      
      mockActivityUseCase.createActivity = vi.fn().mockResolvedValue(err(error));
      
      const { result } = renderHook(() => useActivityStore());
      
      await act(async () => {
        await result.current.createActivity(command);
      });
      
      expect(result.current.activities).toEqual([]);
      expect(result.current.error).toBe('アクティビティの作成に失敗しました: タイトルを入力してください');
    });
  });

  describe('updateActivity', () => {
    it('should update activity successfully', async () => {
      const updatedActivity = {
        ...testActivity,
        title: asActivityTitle('更新されたタスク'),
        status: 'completed' as const
      };
      
      // 既存のアクティビティを設定
      const { result } = renderHook(() => useActivityStore());
      act(() => {
        result.current.activities = [testActivity];
      });
      
      mockActivityUseCase.updateActivity = vi.fn().mockResolvedValue(ok(updatedActivity));
      
      const updateCommand = {
        title: '更新されたタスク',
        status: 'completed' as const
      };
      
      await act(async () => {
        await result.current.updateActivity(testActivity.id, updateCommand);
      });
      
      expect(result.current.activities[0].title).toBe('更新されたタスク');
      expect(result.current.activities[0].status).toBe('completed');
      expect(mockActivityUseCase.updateActivity).toHaveBeenCalledWith(testActivity.id, updateCommand);
    });

    it('should handle update error', async () => {
      const error = {
        type: 'NotFoundError' as const,
        message: 'アクティビティが見つかりません',
        id: testActivity.id
      };
      
      mockActivityUseCase.updateActivity = vi.fn().mockResolvedValue(err(error));
      
      const { result } = renderHook(() => useActivityStore());
      
      await act(async () => {
        await result.current.updateActivity(testActivity.id, { title: '更新' });
      });
      
      expect(result.current.error).toBe('アクティビティの更新に失敗しました: アクティビティが見つかりません');
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity successfully', async () => {
      // 既存のアクティビティを設定
      const { result } = renderHook(() => useActivityStore());
      act(() => {
        result.current.activities = [testActivity];
      });
      
      mockActivityUseCase.deleteActivity = vi.fn().mockResolvedValue(ok(undefined));
      
      await act(async () => {
        await result.current.deleteActivity(testActivity.id);
      });
      
      expect(result.current.activities).toEqual([]);
      expect(mockActivityUseCase.deleteActivity).toHaveBeenCalledWith(testActivity.id);
    });

    it('should handle deletion error', async () => {
      const error = {
        type: 'NotFoundError' as const,
        message: 'アクティビティが見つかりません',
        id: testActivity.id
      };
      
      mockActivityUseCase.deleteActivity = vi.fn().mockResolvedValue(err(error));
      
      const { result } = renderHook(() => useActivityStore());
      
      await act(async () => {
        await result.current.deleteActivity(testActivity.id);
      });
      
      expect(result.current.error).toBe('アクティビティの削除に失敗しました: アクティビティが見つかりません');
    });
  });

  describe('completeActivity', () => {
    it('should complete activity successfully', async () => {
      const completedActivity = {
        ...testActivity,
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      // 既存のアクティビティを設定
      const { result } = renderHook(() => useActivityStore());
      act(() => {
        result.current.activities = [testActivity];
      });
      
      mockActivityUseCase.completeActivity = vi.fn().mockResolvedValue(ok(completedActivity));
      
      await act(async () => {
        await result.current.completeActivity(testActivity.id);
      });
      
      expect(result.current.activities[0].status).toBe('completed');
      expect(result.current.activities[0].completedAt).toBe('2025-06-12');
      expect(mockActivityUseCase.completeActivity).toHaveBeenCalledWith(testActivity.id);
    });
  });

  describe('reopenActivity', () => {
    it('should reopen completed activity successfully', async () => {
      const completedActivity = {
        ...testActivity,
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      const reopenedActivity = {
        ...completedActivity,
        status: 'pending' as const,
        completedAt: undefined
      };
      
      // 完了済みアクティビティを設定
      const { result } = renderHook(() => useActivityStore());
      act(() => {
        result.current.activities = [completedActivity];
      });
      
      mockActivityUseCase.reopenActivity = vi.fn().mockResolvedValue(ok(reopenedActivity));
      
      await act(async () => {
        await result.current.reopenActivity(testActivity.id);
      });
      
      expect(result.current.activities[0].status).toBe('pending');
      expect(result.current.activities[0].completedAt).toBeUndefined();
      expect(mockActivityUseCase.reopenActivity).toHaveBeenCalledWith(testActivity.id);
    });
  });

  describe('selectActivity', () => {
    it('should select activity', () => {
      const { result } = renderHook(() => useActivityStore());
      
      act(() => {
        result.current.selectActivity(testActivity.id);
      });
      
      expect(result.current.selectedActivity).toBe(testActivity.id);
    });

    it('should clear selection when passing null', () => {
      const { result } = renderHook(() => useActivityStore());
      
      // 最初に選択
      act(() => {
        result.current.selectActivity(testActivity.id);
      });
      
      // 選択をクリア
      act(() => {
        result.current.selectActivity(null);
      });
      
      expect(result.current.selectedActivity).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useActivityStore());
      
      // エラーを設定
      act(() => {
        result.current.error = 'テストエラー';
      });
      
      // エラーをクリア
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('getActivityById', () => {
    it('should return activity by id', () => {
      const { result } = renderHook(() => useActivityStore());
      
      // アクティビティを設定
      act(() => {
        result.current.activities = [testActivity];
      });
      
      const activity = result.current.getActivityById(testActivity.id);
      expect(activity).toEqual(testActivity);
    });

    it('should return undefined for non-existent activity', () => {
      const { result } = renderHook(() => useActivityStore());
      
      const activity = result.current.getActivityById(asActivityId('non-existent'));
      expect(activity).toBeUndefined();
    });
  });

  describe('getActivitiesByCategory', () => {
    it('should filter activities by category', () => {
      const eventActivity = {
        ...testActivity,
        id: asActivityId('event-activity'),
        category: 'event' as const
      };
      
      const { result } = renderHook(() => useActivityStore());
      
      // 異なるカテゴリのアクティビティを設定
      act(() => {
        result.current.activities = [testActivity, eventActivity];
      });
      
      const taskActivities = result.current.getActivitiesByCategory('task');
      const eventActivities = result.current.getActivitiesByCategory('event');
      
      expect(taskActivities).toHaveLength(1);
      expect(taskActivities[0].category).toBe('task');
      expect(eventActivities).toHaveLength(1);
      expect(eventActivities[0].category).toBe('event');
    });
  });

  describe('getActivitiesByStatus', () => {
    it('should filter activities by status', () => {
      const completedActivity = {
        ...testActivity,
        id: asActivityId('completed-activity'),
        status: 'completed' as const
      };
      
      const { result } = renderHook(() => useActivityStore());
      
      // 異なるステータスのアクティビティを設定
      act(() => {
        result.current.activities = [testActivity, completedActivity];
      });
      
      const pendingActivities = result.current.getActivitiesByStatus('pending');
      const completedActivities = result.current.getActivitiesByStatus('completed');
      
      expect(pendingActivities).toHaveLength(1);
      expect(pendingActivities[0].status).toBe('pending');
      expect(completedActivities).toHaveLength(1);
      expect(completedActivities[0].status).toBe('completed');
    });
  });
});