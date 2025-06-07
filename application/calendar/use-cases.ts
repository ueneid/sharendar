/**
 * カレンダーイベント管理のユースケース
 * コマンドとクエリを組み合わせた高レベルな操作
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Result } from 'neverthrow';
import type { CalendarEvent } from '@/domain/calendar/types';
import type { ICalendarEventRepository } from '@/domain/calendar/repository';
import { TYPES } from '@/application/shared/types';

// コマンドとクエリの再エクスポート
export {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CreateCalendarEventCommand,
  type UpdateCalendarEventCommand,
  type CommandError
} from './commands';

export {
  getAllCalendarEvents,
  getCalendarEventById,
  getCalendarEventsByDate,
  getCalendarEventsByDateRange,
  getCalendarEventsByMemberId,
  getCalendarEventsByMonth,
  calendarEventExists,
  getTodaysCalendarEvents,
  getThisWeeksCalendarEvents,
  type QueryError
} from './queries';

// 統合エラー型
export type CalendarUseCaseError = 
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

/**
 * カレンダーイベント管理のファサード
 * InversifyJSで依存性注入を行う
 */
@injectable()
export class CalendarEventUseCase {
  constructor(
    @inject(TYPES.ICalendarEventRepository)
    private readonly repository: ICalendarEventRepository
  ) {}

  /**
   * 新しいカレンダーイベントを作成
   */
  async createEvent(
    title: string,
    date: string,
    options?: {
      time?: string;
      memberIds?: string[];
      type?: 'event' | 'task';
      memo?: string;
    }
  ): Promise<Result<CalendarEvent, CalendarUseCaseError>> {
    const { createCalendarEvent } = await import('./commands');
    
    return createCalendarEvent(
      {
        title,
        date,
        time: options?.time,
        memberIds: options?.memberIds,
        type: options?.type,
        memo: options?.memo
      },
      this.repository
    );
  }

  /**
   * カレンダーイベントを更新
   */
  async updateEvent(
    id: string,
    updates: {
      title?: string;
      date?: string;
      time?: string | null;
      memberIds?: string[];
      type?: 'event' | 'task';
      memo?: string;
    }
  ): Promise<Result<CalendarEvent, CalendarUseCaseError>> {
    const { updateCalendarEvent } = await import('./commands');
    
    return updateCalendarEvent(
      {
        id,
        ...updates
      },
      this.repository
    );
  }

  /**
   * カレンダーイベントを削除
   */
  async deleteEvent(id: string): Promise<Result<void, CalendarUseCaseError>> {
    const { deleteCalendarEvent } = await import('./commands');
    
    return deleteCalendarEvent(id, this.repository);
  }

  /**
   * すべてのカレンダーイベントを取得
   */
  async getAllEvents(): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getAllCalendarEvents } = await import('./queries');
    
    return getAllCalendarEvents(this.repository);
  }

  /**
   * IDでカレンダーイベントを取得
   */
  async getEventById(id: string): Promise<Result<CalendarEvent, CalendarUseCaseError>> {
    const { getCalendarEventById } = await import('./queries');
    
    return getCalendarEventById(id, this.repository);
  }

  /**
   * 日付でカレンダーイベントを取得
   */
  async getEventsByDate(date: string): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getCalendarEventsByDate } = await import('./queries');
    
    return getCalendarEventsByDate(date, this.repository);
  }

  /**
   * 日付範囲でカレンダーイベントを取得
   */
  async getEventsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getCalendarEventsByDateRange } = await import('./queries');
    
    return getCalendarEventsByDateRange(startDate, endDate, this.repository);
  }

  /**
   * メンバーIDでカレンダーイベントを取得
   */
  async getEventsByMemberId(memberId: string): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getCalendarEventsByMemberId } = await import('./queries');
    
    return getCalendarEventsByMemberId(memberId, this.repository);
  }

  /**
   * 月のカレンダーイベントを取得
   */
  async getEventsByMonth(yearMonth: string): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getCalendarEventsByMonth } = await import('./queries');
    
    return getCalendarEventsByMonth(yearMonth, this.repository);
  }

  /**
   * 今日のカレンダーイベントを取得
   */
  async getTodaysEvents(): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getTodaysCalendarEvents } = await import('./queries');
    
    return getTodaysCalendarEvents(this.repository);
  }

  /**
   * 今週のカレンダーイベントを取得
   */
  async getThisWeeksEvents(): Promise<Result<readonly CalendarEvent[], CalendarUseCaseError>> {
    const { getThisWeeksCalendarEvents } = await import('./queries');
    
    return getThisWeeksCalendarEvents(this.repository);
  }

  /**
   * カレンダーイベントが存在するかチェック
   */
  async eventExists(id: string): Promise<Result<boolean, CalendarUseCaseError>> {
    const { calendarEventExists } = await import('./queries');
    
    return calendarEventExists(id, this.repository);
  }
}