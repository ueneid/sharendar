import { describe, it, expect } from 'vitest';
import {
  createActivity,
  updateActivityStatus,
  addChecklistItem,
  toggleChecklistItem,
  calculateProgress,
  isOverdue
} from '@/domain/activity/operations';
import {
  validateActivityTitle,
  validateActivityDates,
  validateActivityMembers
} from '@/domain/activity/validations';
import type { Activity, ActivityCategory, ActivityStatus, ActivityPriority } from '@/domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '@/domain/shared/branded-types';

describe('Activity Domain Operations', () => {
  describe('createActivity', () => {
    it('should create a basic activity with required fields', () => {
      // このテストは失敗するはず - まだcreateActivity関数が実装されていない
      const title = 'テストタスク';
      const category: ActivityCategory = 'task';
      const priority: ActivityPriority = 'medium';
      
      const activity = createActivity(title, category, priority);
      
      expect(activity.title).toBe('テストタスク');
      expect(activity.category).toBe('task');
      expect(activity.priority).toBe('medium');
      expect(activity.status).toBe('pending');
      expect(activity.id).toBeDefined();
      expect(activity.createdAt).toBeDefined();
      expect(activity.updatedAt).toBeDefined();
      expect(activity.memberIds).toEqual([]);
      expect(activity.checklist).toEqual([]);
      expect(activity.tags).toEqual([]);
      expect(activity.isAllDay).toBe(true);
    });

    it('should create an event activity with start date', () => {
      const title = '家族会議';
      const category: ActivityCategory = 'event';
      const priority: ActivityPriority = 'high';
      const startDate = '2025-06-15';
      
      const activity = createActivity(title, category, priority, {
        startDate,
        isAllDay: false
      });
      
      expect(activity.category).toBe('event');
      expect(activity.startDate).toBe('2025-06-15');
      expect(activity.isAllDay).toBe(false);
    });
  });

  describe('updateActivityStatus', () => {
    it('should update activity status to completed', () => {
      // このテストも失敗するはず
      const activity: Activity = {
        id: asActivityId('test-1'),
        title: asActivityTitle('テストタスク'),
        category: 'task',
        status: 'pending',
        priority: 'medium',
        memberIds: [],
        checklist: [],
        isAllDay: true,
        createdAt: asDateString('2025-06-11'),
        updatedAt: asDateString('2025-06-11'),
        tags: []
      };

      const newStatus: ActivityStatus = 'completed';
      const completedAt = '2025-06-11';
      
      const updatedActivity = updateActivityStatus(activity, newStatus, completedAt);
      
      expect(updatedActivity.status).toBe('completed');
      expect(updatedActivity.completedAt).toBe('2025-06-11');
      expect(updatedActivity.updatedAt).toBe('2025-06-11');
    });
  });

  describe('checklistItem operations', () => {
    it('should add checklist item to activity', () => {
      const activity: Activity = {
        id: asActivityId('test-1'),
        title: asActivityTitle('テストタスク'),
        category: 'task',
        status: 'pending',
        priority: 'medium',
        memberIds: [],
        checklist: [],
        isAllDay: true,
        createdAt: asDateString('2025-06-11'),
        updatedAt: asDateString('2025-06-11'),
        tags: []
      };

      const updatedActivity = addChecklistItem(activity, '持ち物を準備する');
      
      expect(updatedActivity.checklist).toHaveLength(1);
      expect(updatedActivity.checklist[0].title).toBe('持ち物を準備する');
      expect(updatedActivity.checklist[0].checked).toBe(false);
      expect(updatedActivity.checklist[0].id).toBeDefined();
    });

    it('should toggle checklist item status', () => {
      const activity: Activity = {
        id: asActivityId('test-1'),
        title: asActivityTitle('テストタスク'),
        category: 'task',
        status: 'pending',
        priority: 'medium',
        memberIds: [],
        checklist: [
          { id: 'item-1', title: '持ち物を準備する', checked: false }
        ],
        isAllDay: true,
        createdAt: asDateString('2025-06-11'),
        updatedAt: asDateString('2025-06-11'),
        tags: []
      };

      const updatedActivity = toggleChecklistItem(activity, 'item-1');
      
      expect(updatedActivity.checklist[0].checked).toBe(true);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const checklist = [
        { id: '1', title: 'item1', checked: true },
        { id: '2', title: 'item2', checked: false },
        { id: '3', title: 'item3', checked: true }
      ];

      const progress = calculateProgress(checklist);
      
      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(67); // 2/3 = 0.666... ≈ 67%
    });

    it('should return zero progress for empty checklist', () => {
      const progress = calculateProgress([]);
      
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });

  describe('isOverdue', () => {
    it('should detect overdue activities', () => {
      const activity: Activity = {
        id: asActivityId('test-1'),
        title: asActivityTitle('期限切れタスク'),
        category: 'task',
        status: 'pending',
        priority: 'high',
        memberIds: [],
        checklist: [],
        dueDate: asDateString('2025-06-01'), // 過去の日付
        isAllDay: true,
        createdAt: asDateString('2025-05-01'),
        updatedAt: asDateString('2025-05-01'),
        tags: []
      };

      expect(isOverdue(activity)).toBe(true);
    });

    it('should not mark completed activities as overdue', () => {
      const activity: Activity = {
        id: asActivityId('test-1'),
        title: asActivityTitle('完了タスク'),
        category: 'task',
        status: 'completed',
        priority: 'high',
        memberIds: [],
        checklist: [],
        dueDate: asDateString('2025-06-01'), // 過去の日付
        isAllDay: true,
        createdAt: asDateString('2025-05-01'),
        updatedAt: asDateString('2025-05-01'),
        tags: []
      };

      expect(isOverdue(activity)).toBe(false);
    });
  });
});

describe('Activity Domain Validations', () => {
  describe('validateActivityTitle', () => {
    it('should accept valid titles', () => {
      const result = validateActivityTitle('有効なタイトル');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('有効なタイトル');
      }
    });

    it('should reject empty titles', () => {
      const result = validateActivityTitle('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('タイトル');
      }
    });

    it('should reject titles that are too long', () => {
      const longTitle = 'a'.repeat(101); // 100文字を超える
      const result = validateActivityTitle(longTitle);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('validateActivityDates', () => {
    it('should accept valid date ranges', () => {
      const startDate = asDateString('2025-06-15');
      const endDate = asDateString('2025-06-16');
      
      const result = validateActivityDates(startDate, endDate);
      expect(result.isOk()).toBe(true);
    });

    it('should reject invalid date ranges where end is before start', () => {
      const startDate = asDateString('2025-06-16');
      const endDate = asDateString('2025-06-15');
      
      const result = validateActivityDates(startDate, endDate);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('validateActivityMembers', () => {
    it('should accept valid member IDs', () => {
      const memberIds = [asMemberId('member-1'), asMemberId('member-2')];
      
      const result = validateActivityMembers(memberIds);
      expect(result.isOk()).toBe(true);
    });

    it('should reject duplicate member IDs', () => {
      const memberIds = [asMemberId('member-1'), asMemberId('member-1')];
      
      const result = validateActivityMembers(memberIds);
      expect(result.isErr()).toBe(true);
    });
  });
});