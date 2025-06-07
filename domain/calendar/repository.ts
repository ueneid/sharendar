import { Result } from 'neverthrow';
import type { CalendarEvent } from './types';
import type { EventId, DateString, MemberId } from '@/domain/shared/branded-types';

/**
 * カレンダーイベントリポジトリのインターフェース
 * Domain層でインターフェースを定義し、Infrastructure層で実装する
 * 依存性逆転の原則 (DIP) に従った設計
 */

export type CalendarEventRepositoryError = {
  type: 'DatabaseError';
  message: string;
};

export interface ICalendarEventRepository {
  /**
   * カレンダーイベントを保存する
   */
  save(event: CalendarEvent): Promise<Result<void, CalendarEventRepositoryError>>;

  /**
   * IDでカレンダーイベントを取得する
   */
  findById(id: EventId): Promise<Result<CalendarEvent | null, CalendarEventRepositoryError>>;

  /**
   * すべてのカレンダーイベントを取得する
   */
  findAll(): Promise<Result<readonly CalendarEvent[], CalendarEventRepositoryError>>;

  /**
   * 日付でカレンダーイベントを検索する
   */
  findByDate(date: DateString): Promise<Result<readonly CalendarEvent[], CalendarEventRepositoryError>>;

  /**
   * 日付範囲でカレンダーイベントを検索する
   */
  findByDateRange(startDate: DateString, endDate: DateString): Promise<Result<readonly CalendarEvent[], CalendarEventRepositoryError>>;

  /**
   * メンバーIDでカレンダーイベントを検索する
   */
  findByMemberId(memberId: MemberId): Promise<Result<readonly CalendarEvent[], CalendarEventRepositoryError>>;

  /**
   * カレンダーイベントを削除する
   */
  delete(id: EventId): Promise<Result<void, CalendarEventRepositoryError>>;
}