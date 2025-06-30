import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityUseCase } from '@/application/activity/use-cases';
import type { ActivityRepository } from '@/domain/activity/repository';
import type { Activity, CreateActivityCommand, UpdateActivityCommand } from '@/domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '@/domain/shared/branded-types';
import { ok, err } from 'neverthrow';

describe('ActivityUseCase', () => {
  let useCase: ActivityUseCase;
  let mockRepository: ActivityRepository;
  let testActivity: Activity;

  beforeEach(() => {
    // Repositoryのモック作成
    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findByDateRange: vi.fn(),
      findByMemberId: vi.fn(),
      findByStatus: vi.fn(),
      findOverdue: vi.fn(),
      findUpcoming: vi.fn(),
    };
    
    useCase = new ActivityUseCase(mockRepository);
    
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

  describe('createActivity', () => {
    it('should create a new activity successfully', async () => {
      const command: CreateActivityCommand = {
        title: 'テストタスク',
        category: 'task',
        priority: 'medium',
        description: 'テスト用のタスクです',
        memberIds: ['member-1'],
        dueDate: '2025-06-20',
        checklist: [
          { title: 'チェック項目1', checked: false },
          { title: 'チェック項目2', checked: false }
        ]
      };
      
      // モックの設定：保存が成功する
      (mockRepository.save as any).mockResolvedValue(ok(testActivity));
      
      const result = await useCase.createActivity(command);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('テストタスク');
        expect(result.value.category).toBe('task');
        expect(result.value.status).toBe('pending');
      }
      
      // repositoryのsaveが呼ばれたことを確認
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors', async () => {
      const invalidCommand: CreateActivityCommand = {
        title: '', // 空のタイトル（バリデーションエラー）
        category: 'task',
        priority: 'medium'
      };
      
      const result = await useCase.createActivity(invalidCommand);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ValidationError');
        expect(result.error.message).toContain('タイトル');
      }
      
      // バリデーションエラーの場合はsaveが呼ばれない
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const command: CreateActivityCommand = {
        title: 'テストタスク',
        category: 'task',
        priority: 'medium'
      };
      
      // モックの設定：保存が失敗する
      const dbError = { 
        type: 'DatabaseError' as const, 
        message: 'データベース接続エラー' 
      };
      (mockRepository.save as any).mockResolvedValue(err(dbError));
      
      const result = await useCase.createActivity(command);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('DatabaseError');
        expect(result.error.message).toBe('データベース接続エラー');
      }
    });
  });

  describe('updateActivity', () => {
    it('should update an existing activity successfully', async () => {
      const updateCommand: UpdateActivityCommand = {
        title: '更新されたタスク',
        status: 'completed',
        completedAt: '2025-06-12'
      };
      
      const updatedActivity = {
        ...testActivity,
        title: asActivityTitle('更新されたタスク'),
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(testActivity));
      (mockRepository.save as any).mockResolvedValue(ok(updatedActivity));
      
      const result = await useCase.updateActivity(testActivity.id, updateCommand);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('更新されたタスク');
        expect(result.value.status).toBe('completed');
        expect(result.value.completedAt).toBe('2025-06-12');
      }
      
      expect(mockRepository.findById).toHaveBeenCalledWith(testActivity.id);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return NotFoundError when activity does not exist', async () => {
      const updateCommand: UpdateActivityCommand = {
        title: '更新されたタスク'
      };
      
      // モックの設定：アクティビティが見つからない
      (mockRepository.findById as any).mockResolvedValue(ok(null));
      
      const result = await useCase.updateActivity(testActivity.id, updateCommand);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NotFoundError');
        expect(result.error.message).toContain('アクティビティが見つかりません');
      }
      
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteActivity', () => {
    it('should delete an existing activity successfully', async () => {
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(testActivity));
      (mockRepository.delete as any).mockResolvedValue(ok(undefined));
      
      const result = await useCase.deleteActivity(testActivity.id);
      
      expect(result.isOk()).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(testActivity.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(testActivity.id);
    });

    it('should return NotFoundError when trying to delete non-existent activity', async () => {
      // モックの設定：アクティビティが見つからない
      (mockRepository.findById as any).mockResolvedValue(ok(null));
      
      const result = await useCase.deleteActivity(testActivity.id);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NotFoundError');
        expect(result.error.message).toContain('アクティビティが見つかりません');
      }
      
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getActivityById', () => {
    it('should return activity when it exists', async () => {
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(testActivity));
      
      const result = await useCase.getActivityById(testActivity.id);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(testActivity);
      }
    });

    it('should return NotFoundError when activity does not exist', async () => {
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(null));
      
      const result = await useCase.getActivityById(testActivity.id);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NotFoundError');
      }
    });
  });

  describe('getAllActivities', () => {
    it('should return all activities', async () => {
      const activities = [testActivity];
      
      // モックの設定
      (mockRepository.findAll as any).mockResolvedValue(ok(activities));
      
      const result = await useCase.getAllActivities();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toEqual(testActivity);
      }
    });

    it('should return empty array when no activities exist', async () => {
      // モックの設定
      (mockRepository.findAll as any).mockResolvedValue(ok([]));
      
      const result = await useCase.getAllActivities();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('completeActivity', () => {
    it('should complete a pending activity', async () => {
      const completedActivity = {
        ...testActivity,
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(testActivity));
      (mockRepository.save as any).mockResolvedValue(ok(completedActivity));
      
      const result = await useCase.completeActivity(testActivity.id);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('completed');
        expect(result.value.completedAt).toBeDefined();
      }
    });

    it('should return ConflictError when activity is already completed', async () => {
      const alreadyCompletedActivity = {
        ...testActivity,
        status: 'completed' as const,
        completedAt: asDateString('2025-06-10')
      };
      
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(alreadyCompletedActivity));
      
      const result = await useCase.completeActivity(testActivity.id);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ConflictError');
        expect(result.error.message).toContain('既に完了しています');
      }
    });
  });

  describe('reopenActivity', () => {
    it('should reopen a completed activity', async () => {
      const completedActivity = {
        ...testActivity,
        status: 'completed' as const,
        completedAt: asDateString('2025-06-10')
      };
      
      const reopenedActivity = {
        ...completedActivity,
        status: 'pending' as const,
        completedAt: undefined
      };
      
      // モックの設定
      (mockRepository.findById as any).mockResolvedValue(ok(completedActivity));
      (mockRepository.save as any).mockResolvedValue(ok(reopenedActivity));
      
      const result = await useCase.reopenActivity(testActivity.id);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe('pending');
        expect(result.value.completedAt).toBeUndefined();
      }
    });

    it('should return ConflictError when activity is not completed', async () => {
      // モックの設定：未完了のアクティビティ
      (mockRepository.findById as any).mockResolvedValue(ok(testActivity));
      
      const result = await useCase.reopenActivity(testActivity.id);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('ConflictError');
        expect(result.error.message).toContain('完了状態ではありません');
      }
    });
  });

  describe('getActivitiesByDateRange', () => {
    it('should return activities within date range', async () => {
      const activities = [testActivity];
      
      // モックの設定
      (mockRepository.findByDateRange as any).mockResolvedValue(ok(activities));
      
      const result = await useCase.getActivitiesByDateRange('2025-06-15', '2025-06-20');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
      }
      
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith('2025-06-15', '2025-06-20');
    });
  });

  describe('getActivitiesByMemberId', () => {
    it('should return activities assigned to member', async () => {
      const activities = [testActivity];
      
      // モックの設定
      (mockRepository.findByMemberId as any).mockResolvedValue(ok(activities));
      
      const result = await useCase.getActivitiesByMemberId('member-1');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
      }
      
      expect(mockRepository.findByMemberId).toHaveBeenCalledWith('member-1');
    });
  });

  describe('getOverdueActivities', () => {
    it('should return overdue activities', async () => {
      const overdueActivity = {
        ...testActivity,
        dueDate: asDateString('2025-06-01')
      };
      
      // モックの設定
      (mockRepository.findOverdue as any).mockResolvedValue(ok([overdueActivity]));
      
      const result = await useCase.getOverdueActivities();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].dueDate).toBe('2025-06-01');
      }
    });
  });

  describe('getUpcomingActivities', () => {
    it('should return upcoming activities within specified days', async () => {
      const activities = [testActivity];
      
      // モックの設定
      (mockRepository.findUpcoming as any).mockResolvedValue(ok(activities));
      
      const result = await useCase.getUpcomingActivities(7);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
      }
      
      expect(mockRepository.findUpcoming).toHaveBeenCalledWith(7);
    });
  });
});