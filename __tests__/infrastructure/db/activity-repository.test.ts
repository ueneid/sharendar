import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DexieActivityRepository } from '@/infrastructure/db/activity-repository';
import { db } from '@/infrastructure/db/schema';
import type { Activity } from '@/domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '@/domain/shared/branded-types';

describe('DexieActivityRepository', () => {
  let repository: DexieActivityRepository;
  let testActivity: Activity;

  beforeEach(async () => {
    // テスト用にDBをクリーンな状態に
    await db.delete();
    await db.open();
    
    repository = new DexieActivityRepository();
    
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

  afterEach(async () => {
    // テスト後のクリーンアップ
    await db.delete();
  });

  describe('save', () => {
    it('should save a new activity successfully', async () => {
      const result = await repository.save(testActivity);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(testActivity.id);
        expect(result.value.title).toBe(testActivity.title);
        expect(result.value.category).toBe('task');
        expect(result.value.checklist).toHaveLength(2);
      }
    });

    it('should update an existing activity', async () => {
      // 最初に保存
      await repository.save(testActivity);
      
      // 更新されたActivity
      const updatedActivity = {
        ...testActivity,
        title: asActivityTitle('更新されたタスク'),
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12'),
        updatedAt: asDateString('2025-06-12')
      };
      
      const result = await repository.save(updatedActivity);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('更新されたタスク');
        expect(result.value.status).toBe('completed');
        expect(result.value.completedAt).toBe('2025-06-12');
      }
    });
  });

  describe('findById', () => {
    it('should find an existing activity by id', async () => {
      // 事前に保存
      await repository.save(testActivity);
      
      const result = await repository.findById(testActivity.id);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).not.toBeNull();
        expect(result.value?.id).toBe(testActivity.id);
        expect(result.value?.title).toBe(testActivity.title);
        expect(result.value?.checklist).toHaveLength(2);
      }
    });

    it('should return null for non-existent activity', async () => {
      const nonExistentId = asActivityId('non-existent');
      
      const result = await repository.findById(nonExistentId);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle database errors gracefully', async () => {
      // データベースを閉じてエラーを発生させる
      await db.close();
      
      const result = await repository.findById(testActivity.id);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('DatabaseError');
        expect(result.error.message).toContain('アクティビティの取得に失敗しました');
      }
    });
  });

  describe('findAll', () => {
    it('should return all activities ordered by updatedAt desc', async () => {
      const activity1 = {
        ...testActivity,
        id: asActivityId('activity-1'),
        title: asActivityTitle('タスク1'),
        updatedAt: asDateString('2025-06-10')
      };
      
      const activity2 = {
        ...testActivity,
        id: asActivityId('activity-2'),
        title: asActivityTitle('タスク2'),
        updatedAt: asDateString('2025-06-12')
      };
      
      // 順番に保存
      await repository.save(activity1);
      await repository.save(activity2);
      
      const result = await repository.findAll();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        // 新しい順に並んでいることを確認
        expect(result.value[0].title).toBe('タスク2');
        expect(result.value[1].title).toBe('タスク1');
      }
    });

    it('should return empty array when no activities exist', async () => {
      const result = await repository.findAll();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('delete', () => {
    it('should delete an existing activity', async () => {
      // 事前に保存
      await repository.save(testActivity);
      
      const deleteResult = await repository.delete(testActivity.id);
      expect(deleteResult.isOk()).toBe(true);
      
      // 削除されたことを確認
      const findResult = await repository.findById(testActivity.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it('should succeed even when deleting non-existent activity', async () => {
      const nonExistentId = asActivityId('non-existent');
      
      const result = await repository.delete(nonExistentId);
      
      expect(result.isOk()).toBe(true);
    });
  });

  describe('findByDateRange', () => {
    it('should find activities within date range', async () => {
      const activity1 = {
        ...testActivity,
        id: asActivityId('activity-1'),
        startDate: asDateString('2025-06-15'),
        dueDate: asDateString('2025-06-16')
      };
      
      const activity2 = {
        ...testActivity,
        id: asActivityId('activity-2'),
        startDate: asDateString('2025-06-20'),
        dueDate: asDateString('2025-06-21')
      };
      
      const activity3 = {
        ...testActivity,
        id: asActivityId('activity-3'),
        startDate: asDateString('2025-06-25'),
        dueDate: asDateString('2025-06-26')
      };
      
      await repository.save(activity1);
      await repository.save(activity2);
      await repository.save(activity3);
      
      // 2025-06-15 から 2025-06-22 の範囲で検索
      const result = await repository.findByDateRange('2025-06-15', '2025-06-22');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        const ids = result.value.map(a => a.id);
        expect(ids).toContain('activity-1');
        expect(ids).toContain('activity-2');
        expect(ids).not.toContain('activity-3');
      }
    });
  });

  describe('findByMemberId', () => {
    it('should find activities assigned to specific member', async () => {
      const member1Activity = {
        ...testActivity,
        id: asActivityId('member1-activity'),
        memberIds: [asMemberId('member-1')]
      };
      
      const member2Activity = {
        ...testActivity,
        id: asActivityId('member2-activity'),
        memberIds: [asMemberId('member-2')]
      };
      
      const sharedActivity = {
        ...testActivity,
        id: asActivityId('shared-activity'),
        memberIds: [asMemberId('member-1'), asMemberId('member-2')]
      };
      
      await repository.save(member1Activity);
      await repository.save(member2Activity);
      await repository.save(sharedActivity);
      
      const result = await repository.findByMemberId('member-1');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        const ids = result.value.map(a => a.id);
        expect(ids).toContain('member1-activity');
        expect(ids).toContain('shared-activity');
        expect(ids).not.toContain('member2-activity');
      }
    });
  });

  describe('findByStatus', () => {
    it('should find activities by status', async () => {
      const pendingActivity = {
        ...testActivity,
        id: asActivityId('pending-activity'),
        status: 'pending' as const
      };
      
      const completedActivity = {
        ...testActivity,
        id: asActivityId('completed-activity'),
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      await repository.save(pendingActivity);
      await repository.save(completedActivity);
      
      const result = await repository.findByStatus('pending');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].id).toBe('pending-activity');
        expect(result.value[0].status).toBe('pending');
      }
    });
  });

  describe('findOverdue', () => {
    it('should find overdue incomplete activities', async () => {
      const overdueActivity = {
        ...testActivity,
        id: asActivityId('overdue-activity'),
        dueDate: asDateString('2025-06-01'), // 過去の日付
        status: 'pending' as const
      };
      
      const futureActivity = {
        ...testActivity,
        id: asActivityId('future-activity'),
        dueDate: asDateString('2025-12-31'), // 未来の日付
        status: 'pending' as const
      };
      
      const completedOverdueActivity = {
        ...testActivity,
        id: asActivityId('completed-overdue'),
        dueDate: asDateString('2025-06-01'), // 過去の日付だが完了済み
        status: 'completed' as const,
        completedAt: asDateString('2025-06-12')
      };
      
      await repository.save(overdueActivity);
      await repository.save(futureActivity);
      await repository.save(completedOverdueActivity);
      
      const result = await repository.findOverdue();
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].id).toBe('overdue-activity');
      }
    });
  });

  describe('findUpcoming', () => {
    it('should find activities within specified days', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 8);
      
      const todayActivity = {
        ...testActivity,
        id: asActivityId('today-activity'),
        startDate: asDateString(today.toISOString().split('T')[0])
      };
      
      const tomorrowActivity = {
        ...testActivity,
        id: asActivityId('tomorrow-activity'),
        startDate: asDateString(tomorrow.toISOString().split('T')[0])
      };
      
      const nextWeekActivity = {
        ...testActivity,
        id: asActivityId('nextweek-activity'),
        startDate: asDateString(nextWeek.toISOString().split('T')[0])
      };
      
      await repository.save(todayActivity);
      await repository.save(tomorrowActivity);
      await repository.save(nextWeekActivity);
      
      // 今後3日間のアクティビティを検索
      const result = await repository.findUpcoming(3);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        const ids = result.value.map(a => a.id);
        expect(ids).toContain('today-activity');
        expect(ids).toContain('tomorrow-activity');
        expect(ids).not.toContain('nextweek-activity');
      }
    });
  });
});