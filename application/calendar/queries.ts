import { Result, ok, err } from 'neverthrow';
import type { CalendarEvent } from '@/domain/calendar/types';
import { asEventId, asDateString, asMemberId } from '@/domain/shared/branded-types';
import type { ICalendarEventRepository } from '@/domain/calendar/repository';
import { isEventOnDate, isEventInDateRange } from '@/domain/calendar/operations';

/**
 * カレンダーイベント管理のクエリ操作
 * 状態を変更しない読み取り専用操作（Read）
 */

// クエリのエラー型
export type QueryError = 
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string }
  | { type: 'ValidationError'; message: string };

/**
 * すべてのカレンダーイベントを取得する
 */
export const getAllCalendarEvents = async (
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  const result = await repository.findAll();
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * IDでカレンダーイベントを取得する
 */
export const getCalendarEventById = async (
  id: string,
  repository: ICalendarEventRepository
): Promise<Result<CalendarEvent, QueryError>> => {
  const result = await repository.findById(asEventId(id));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  const event = result.value;
  if (!event) {
    return err({
      type: 'NotFound',
      message: '指定されたイベントが見つかりません'
    });
  }

  return ok(event);
};

/**
 * 日付でカレンダーイベントを取得する
 */
export const getCalendarEventsByDate = async (
  date: string,
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  // 日付のバリデーション
  try {
    const dateString = asDateString(date);
    const result = await repository.findByDate(dateString);
    
    if (result.isErr()) {
      return err({
        type: 'DatabaseError',
        message: result.error.message
      });
    }

    return ok(result.value);
  } catch (error) {
    return err({
      type: 'ValidationError',
      message: '無効な日付形式です'
    });
  }
};

/**
 * 日付範囲でカレンダーイベントを取得する
 */
export const getCalendarEventsByDateRange = async (
  startDate: string,
  endDate: string,
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  // 日付のバリデーション
  try {
    const start = asDateString(startDate);
    const end = asDateString(endDate);
    
    const result = await repository.findByDateRange(start, end);
    
    if (result.isErr()) {
      return err({
        type: 'DatabaseError',
        message: result.error.message
      });
    }

    return ok(result.value);
  } catch (error) {
    return err({
      type: 'ValidationError',
      message: '無効な日付形式です'
    });
  }
};

/**
 * メンバーIDでカレンダーイベントを取得する
 */
export const getCalendarEventsByMemberId = async (
  memberId: string,
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  const result = await repository.findByMemberId(asMemberId(memberId));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value);
};

/**
 * 月のカレンダーイベントを取得する（YYYY-MM形式）
 */
export const getCalendarEventsByMonth = async (
  yearMonth: string, // YYYY-MM形式
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  // YYYY-MM形式のバリデーション
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(yearMonth)) {
    return err({
      type: 'ValidationError',
      message: '無効な年月形式です（YYYY-MM形式で指定してください）'
    });
  }

  const [year, month] = yearMonth.split('-');
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

  return getCalendarEventsByDateRange(startDate, endDate, repository);
};

/**
 * カレンダーイベントが存在するかチェックする
 */
export const calendarEventExists = async (
  id: string,
  repository: ICalendarEventRepository
): Promise<Result<boolean, QueryError>> => {
  const result = await repository.findById(asEventId(id));
  
  if (result.isErr()) {
    return err({
      type: 'DatabaseError',
      message: result.error.message
    });
  }

  return ok(result.value !== null);
};

/**
 * 今日のカレンダーイベントを取得する
 */
export const getTodaysCalendarEvents = async (
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
  
  return getCalendarEventsByDate(todayString, repository);
};

/**
 * 今週のカレンダーイベントを取得する
 */
export const getThisWeeksCalendarEvents = async (
  repository: ICalendarEventRepository
): Promise<Result<readonly CalendarEvent[], QueryError>> => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // 日曜日
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // 土曜日

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  return getCalendarEventsByDateRange(startDate, endDate, repository);
};