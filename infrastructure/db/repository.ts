import { Result, ok, err } from 'neverthrow';
import type { FamilyMember } from '@/domain/family/types';
import type { CalendarEvent } from '@/domain/calendar/types';
import type { Task } from '@/domain/tasks/types';
import type { 
  MemberId, 
  EventId, 
  TaskId,
  DateString
} from '@/domain/shared/branded-types';
import type { 
  IFamilyMemberRepository,
  FamilyMemberRepositoryError
} from '@/domain/family/repository';
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
import { db, type FamilyMemberDTO, type CalendarEventDTO, type TaskDTO } from './schema';

/**
 * データベースエラーの型定義
 */
export type DatabaseError = {
  type: 'DatabaseError';
  message: string;
};

/**
 * DTOからDomainオブジェクトへの変換
 */
const mapFamilyMemberFromDTO = (dto: FamilyMemberDTO): FamilyMember => ({
  id: asMemberId(dto.id),
  name: asMemberName(dto.name),
  avatar: dto.avatar,
  color: asColor(dto.color)
});

const mapCalendarEventFromDTO = (dto: CalendarEventDTO): CalendarEvent => ({
  id: asEventId(dto.id),
  title: asEventTitle(dto.title),
  date: asDateString(dto.date),
  time: dto.time ? dto.time as any : undefined, // TimeStringのアサーション
  memberIds: dto.memberIds.map(asMemberId),
  type: dto.type,
  memo: dto.memo
});

const mapTaskFromDTO = (dto: TaskDTO): Task => ({
  id: asTaskId(dto.id),
  title: asTaskTitle(dto.title),
  dueDate: dto.dueDate ? asDateString(dto.dueDate) : undefined,
  priority: dto.priority,
  status: dto.status,
  memberIds: dto.memberIds.map(asMemberId),
  checklist: dto.checklist,
  createdAt: asDateString(dto.createdAt),
  completedAt: dto.completedAt ? asDateString(dto.completedAt) : undefined
});

/**
 * DomainオブジェクトからDTOへの変換
 */
const mapFamilyMemberToDTO = (domain: FamilyMember): FamilyMemberDTO => ({
  id: domain.id,
  name: domain.name,
  avatar: domain.avatar,
  color: domain.color
});

const mapCalendarEventToDTO = (domain: CalendarEvent): CalendarEventDTO => ({
  id: domain.id,
  title: domain.title,
  date: domain.date,
  time: domain.time,
  memberIds: domain.memberIds.map(id => id as string),
  type: domain.type,
  memo: domain.memo
});

const mapTaskToDTO = (domain: Task): TaskDTO => ({
  id: domain.id,
  title: domain.title,
  dueDate: domain.dueDate,
  priority: domain.priority,
  status: domain.status,
  memberIds: domain.memberIds.map(id => id as string),
  checklist: domain.checklist as any, // ChecklistItemDTOと同じ構造
  createdAt: domain.createdAt,
  completedAt: domain.completedAt
});

/**
 * 家族メンバーリポジトリ
 * Domain層のIFamilyMemberRepositoryインターフェースを実装
 */
export class FamilyMemberRepository implements IFamilyMemberRepository {
  async save(member: FamilyMember): Promise<Result<void, FamilyMemberRepositoryError>> {
    try {
      await db.familyMembers.put(mapFamilyMemberToDTO(member));
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `家族メンバーの保存に失敗しました: ${error}`
      });
    }
  }

  async findById(id: MemberId): Promise<Result<FamilyMember | null, FamilyMemberRepositoryError>> {
    try {
      const dto = await db.familyMembers.get(id);
      return ok(dto ? mapFamilyMemberFromDTO(dto) : null);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `家族メンバーの取得に失敗しました: ${error}`
      });
    }
  }

  async findAll(): Promise<Result<readonly FamilyMember[], FamilyMemberRepositoryError>> {
    try {
      const dtos = await db.familyMembers.toArray();
      const members = dtos.map(mapFamilyMemberFromDTO);
      return ok(members);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `家族メンバー一覧の取得に失敗しました: ${error}`
      });
    }
  }

  async delete(id: MemberId): Promise<Result<void, FamilyMemberRepositoryError>> {
    try {
      await db.familyMembers.delete(id);
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `家族メンバーの削除に失敗しました: ${error}`
      });
    }
  }
}

/**
 * カレンダーイベントリポジトリ
 */
export class CalendarEventRepository {
  async save(event: CalendarEvent): Promise<Result<void, DatabaseError>> {
    try {
      await db.calendarEvents.put(mapCalendarEventToDTO(event));
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `カレンダーイベントの保存に失敗しました: ${error}`
      });
    }
  }

  async findById(id: EventId): Promise<Result<CalendarEvent | null, DatabaseError>> {
    try {
      const dto = await db.calendarEvents.get(id);
      return ok(dto ? mapCalendarEventFromDTO(dto) : null);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `カレンダーイベントの取得に失敗しました: ${error}`
      });
    }
  }

  async findByDateRange(
    startDate: DateString, 
    endDate: DateString
  ): Promise<Result<readonly CalendarEvent[], DatabaseError>> {
    try {
      const dtos = await db.calendarEvents
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();
      
      const events = dtos.map(mapCalendarEventFromDTO);
      return ok(events);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `カレンダーイベントの期間検索に失敗しました: ${error}`
      });
    }
  }

  async findAll(): Promise<Result<readonly CalendarEvent[], DatabaseError>> {
    try {
      const dtos = await db.calendarEvents.toArray();
      const events = dtos.map(mapCalendarEventFromDTO);
      return ok(events);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `カレンダーイベント一覧の取得に失敗しました: ${error}`
      });
    }
  }

  async findByDate(date: DateString): Promise<Result<readonly CalendarEvent[], DatabaseError>> {
    try {
      const dtos = await db.calendarEvents
        .where('date')
        .equals(date)
        .toArray();
      
      const events = dtos.map(mapCalendarEventFromDTO);
      return ok(events);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `カレンダーイベントの日付検索に失敗しました: ${error}`
      });
    }
  }

  async findByMemberId(memberId: MemberId): Promise<Result<readonly CalendarEvent[], DatabaseError>> {
    try {
      const dtos = await db.calendarEvents
        .filter(event => event.memberIds.includes(memberId))
        .toArray();
      
      const events = dtos.map(mapCalendarEventFromDTO);
      return ok(events);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `メンバーのカレンダーイベント検索に失敗しました: ${error}`
      });
    }
  }

  async delete(id: EventId): Promise<Result<void, DatabaseError>> {
    try {
      await db.calendarEvents.delete(id);
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `カレンダーイベントの削除に失敗しました: ${error}`
      });
    }
  }
}

/**
 * タスクリポジトリ
 */
export class TaskRepository {
  async save(task: Task): Promise<Result<void, DatabaseError>> {
    try {
      await db.tasks.put(mapTaskToDTO(task));
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `タスクの保存に失敗しました: ${error}`
      });
    }
  }

  async findById(id: TaskId): Promise<Result<Task | null, DatabaseError>> {
    try {
      const dto = await db.tasks.get(id);
      return ok(dto ? mapTaskFromDTO(dto) : null);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `タスクの取得に失敗しました: ${error}`
      });
    }
  }

  async findAll(): Promise<Result<readonly Task[], DatabaseError>> {
    try {
      const dtos = await db.tasks.toArray();
      const tasks = dtos.map(mapTaskFromDTO);
      return ok(tasks);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `タスク一覧の取得に失敗しました: ${error}`
      });
    }
  }

  async findByStatus(status: 'pending' | 'completed'): Promise<Result<readonly Task[], DatabaseError>> {
    try {
      const dtos = await db.tasks
        .where('status')
        .equals(status)
        .toArray();
      
      const tasks = dtos.map(mapTaskFromDTO);
      return ok(tasks);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `ステータス別タスク検索に失敗しました: ${error}`
      });
    }
  }

  async findByDueDate(dueDate: DateString): Promise<Result<readonly Task[], DatabaseError>> {
    try {
      const dtos = await db.tasks
        .where('dueDate')
        .equals(dueDate)
        .toArray();
      
      const tasks = dtos.map(mapTaskFromDTO);
      return ok(tasks);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `期限日別タスク検索に失敗しました: ${error}`
      });
    }
  }

  async findByDueDateRange(
    startDate: DateString, 
    endDate: DateString
  ): Promise<Result<readonly Task[], DatabaseError>> {
    try {
      const dtos = await db.tasks
        .where('dueDate')
        .between(startDate, endDate, true, true)
        .toArray();
      
      const tasks = dtos.map(mapTaskFromDTO);
      return ok(tasks);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `期限日範囲別タスク検索に失敗しました: ${error}`
      });
    }
  }

  async findByMemberId(memberId: MemberId): Promise<Result<readonly Task[], DatabaseError>> {
    try {
      const dtos = await db.tasks
        .filter(task => task.memberIds.includes(memberId))
        .toArray();
      
      const tasks = dtos.map(mapTaskFromDTO);
      return ok(tasks);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `メンバー別タスク検索に失敗しました: ${error}`
      });
    }
  }

  async findByPriority(priority: 'high' | 'medium' | 'low'): Promise<Result<readonly Task[], DatabaseError>> {
    try {
      const dtos = await db.tasks
        .where('priority')
        .equals(priority)
        .toArray();
      
      const tasks = dtos.map(mapTaskFromDTO);
      return ok(tasks);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `優先度別タスク検索に失敗しました: ${error}`
      });
    }
  }

  async delete(id: TaskId): Promise<Result<void, DatabaseError>> {
    try {
      await db.tasks.delete(id);
      return ok(undefined);
    } catch (error) {
      return err({
        type: 'DatabaseError',
        message: `タスクの削除に失敗しました: ${error}`
      });
    }
  }
}

// リポジトリインスタンスのエクスポート
export const familyMemberRepository = new FamilyMemberRepository();
export const calendarEventRepository = new CalendarEventRepository();
export const taskRepository = new TaskRepository();