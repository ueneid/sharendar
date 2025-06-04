import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  FamilyMemberRepository, 
  CalendarEventRepository, 
  TaskRepository,
  type DatabaseError 
} from '@/infrastructure/db/repository';
import { db } from '@/infrastructure/db/schema';
import type { FamilyMember } from '@/domain/family/types';
import type { CalendarEvent } from '@/domain/calendar/types';
import type { Task } from '@/domain/tasks/types';
import { 
  asMemberId, 
  asEventId, 
  asTaskId,
  asDateString,
  asMemberName,
  asEventTitle,
  asTaskTitle,
  asColor
} from '@/domain/shared/branded-types';

// テスト用のモックデータ
const mockFamilyMember: FamilyMember = {
  id: asMemberId('test-member-1'),
  name: asMemberName('テスト太郎'),
  avatar: '👦',
  color: asColor('#0ea5e9')
};

const mockCalendarEvent: CalendarEvent = {
  id: asEventId('test-event-1'),
  title: asEventTitle('テストイベント'),
  date: asDateString('2024-03-15'),
  time: '10:00' as any,
  memberIds: [asMemberId('test-member-1')],
  type: 'event',
  memo: 'テストメモ'
};

const mockTask: Task = {
  id: asTaskId('test-task-1'),
  title: asTaskTitle('テストタスク'),
  dueDate: asDateString('2024-03-20'),
  priority: 'medium',
  status: 'pending',
  memberIds: [asMemberId('test-member-1')],
  checklist: [
    {
      id: 'checklist-1',
      title: 'チェック項目1',
      checked: false
    }
  ],
  createdAt: asDateString('2024-03-15'),
  completedAt: undefined
};

describe('Repository Tests', () => {
  let familyMemberRepo: FamilyMemberRepository;
  let calendarEventRepo: CalendarEventRepository;
  let taskRepo: TaskRepository;

  beforeEach(async () => {
    // テスト用にDBを初期化
    await db.delete();
    await db.open();
    
    familyMemberRepo = new FamilyMemberRepository();
    calendarEventRepo = new CalendarEventRepository();
    taskRepo = new TaskRepository();
  });

  afterEach(async () => {
    // テスト後クリーンアップ
    await db.delete();
  });

  describe('FamilyMemberRepository', () => {
    it('should save and retrieve a family member', async () => {
      // Save
      const saveResult = await familyMemberRepo.save(mockFamilyMember);
      expect(saveResult.isOk()).toBe(true);

      // Retrieve
      const findResult = await familyMemberRepo.findById(mockFamilyMember.id);
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        const member = findResult.value;
        expect(member).not.toBeNull();
        expect(member?.id).toBe(mockFamilyMember.id);
        expect(member?.name).toBe(mockFamilyMember.name);
        expect(member?.color).toBe(mockFamilyMember.color);
      }
    });

    it('should return null for non-existent member', async () => {
      const findResult = await familyMemberRepo.findById(asMemberId('non-existent'));
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it('should retrieve all family members', async () => {
      // Save multiple members
      await familyMemberRepo.save(mockFamilyMember);
      await familyMemberRepo.save({
        ...mockFamilyMember,
        id: asMemberId('test-member-2'),
        name: asMemberName('テスト花子')
      });

      const findAllResult = await familyMemberRepo.findAll();
      expect(findAllResult.isOk()).toBe(true);
      
      if (findAllResult.isOk()) {
        expect(findAllResult.value).toHaveLength(2);
      }
    });

    it('should delete a family member', async () => {
      // Save first
      await familyMemberRepo.save(mockFamilyMember);

      // Delete
      const deleteResult = await familyMemberRepo.delete(mockFamilyMember.id);
      expect(deleteResult.isOk()).toBe(true);

      // Verify deletion
      const findResult = await familyMemberRepo.findById(mockFamilyMember.id);
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it('should handle deleting non-existent member gracefully', async () => {
      const deleteResult = await familyMemberRepo.delete(asMemberId('non-existent'));
      // Dexieでは存在しないIDを削除してもエラーにならないため、成功を期待
      expect(deleteResult.isOk()).toBe(true);
    });
  });

  describe('CalendarEventRepository', () => {
    it('should save and retrieve a calendar event', async () => {
      // Save
      const saveResult = await calendarEventRepo.save(mockCalendarEvent);
      expect(saveResult.isOk()).toBe(true);

      // Retrieve
      const findResult = await calendarEventRepo.findById(mockCalendarEvent.id);
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        const event = findResult.value;
        expect(event).not.toBeNull();
        expect(event?.id).toBe(mockCalendarEvent.id);
        expect(event?.title).toBe(mockCalendarEvent.title);
        expect(event?.date).toBe(mockCalendarEvent.date);
      }
    });

    it('should find events by date range', async () => {
      // Save events with different dates
      await calendarEventRepo.save(mockCalendarEvent);
      await calendarEventRepo.save({
        ...mockCalendarEvent,
        id: asEventId('test-event-2'),
        date: asDateString('2024-03-16')
      });
      await calendarEventRepo.save({
        ...mockCalendarEvent,
        id: asEventId('test-event-3'),
        date: asDateString('2024-03-25') // Outside range
      });

      const findResult = await calendarEventRepo.findByDateRange(
        asDateString('2024-03-15'),
        asDateString('2024-03-20')
      );
      
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        expect(findResult.value).toHaveLength(2);
        expect(findResult.value.every(event => 
          event.date >= '2024-03-15' && event.date <= '2024-03-20'
        )).toBe(true);
      }
    });

    it('should delete a calendar event', async () => {
      // Save first
      await calendarEventRepo.save(mockCalendarEvent);

      // Delete
      const deleteResult = await calendarEventRepo.delete(mockCalendarEvent.id);
      expect(deleteResult.isOk()).toBe(true);

      // Verify deletion
      const findResult = await calendarEventRepo.findById(mockCalendarEvent.id);
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });
  });

  describe('TaskRepository', () => {
    it('should save and retrieve a task', async () => {
      // Save
      const saveResult = await taskRepo.save(mockTask);
      expect(saveResult.isOk()).toBe(true);

      // Retrieve
      const findResult = await taskRepo.findById(mockTask.id);
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        const task = findResult.value;
        expect(task).not.toBeNull();
        expect(task?.id).toBe(mockTask.id);
        expect(task?.title).toBe(mockTask.title);
        expect(task?.status).toBe(mockTask.status);
        expect(task?.checklist).toHaveLength(1);
      }
    });

    it('should find all tasks', async () => {
      // Save multiple tasks
      await taskRepo.save(mockTask);
      await taskRepo.save({
        ...mockTask,
        id: asTaskId('test-task-2'),
        status: 'completed' as const
      });

      const findAllResult = await taskRepo.findAll();
      expect(findAllResult.isOk()).toBe(true);
      
      if (findAllResult.isOk()) {
        expect(findAllResult.value).toHaveLength(2);
      }
    });

    it('should find tasks by status', async () => {
      // Save tasks with different statuses
      await taskRepo.save(mockTask); // pending
      await taskRepo.save({
        ...mockTask,
        id: asTaskId('test-task-2'),
        status: 'completed' as const
      });

      const pendingResult = await taskRepo.findByStatus('pending');
      expect(pendingResult.isOk()).toBe(true);
      
      if (pendingResult.isOk()) {
        expect(pendingResult.value).toHaveLength(1);
        expect(pendingResult.value[0].status).toBe('pending');
      }

      const completedResult = await taskRepo.findByStatus('completed');
      expect(completedResult.isOk()).toBe(true);
      
      if (completedResult.isOk()) {
        expect(completedResult.value).toHaveLength(1);
        expect(completedResult.value[0].status).toBe('completed');
      }
    });

    it('should delete a task', async () => {
      // Save first
      await taskRepo.save(mockTask);

      // Delete
      const deleteResult = await taskRepo.delete(mockTask.id);
      expect(deleteResult.isOk()).toBe(true);

      // Verify deletion
      const findResult = await taskRepo.findById(mockTask.id);
      expect(findResult.isOk()).toBe(true);
      
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });
  });
});