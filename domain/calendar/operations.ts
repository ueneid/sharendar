import { CalendarEvent, EventType } from './types';
import { EventId, EventTitle, DateString, TimeString, MemberId } from '@/domain/shared/branded-types';
import { nanoid } from 'nanoid';

/**
 * カレンダーイベントに関する純粋関数
 */

// 新しいカレンダーイベントを作成
export const createCalendarEvent = (
  title: EventTitle,
  date: DateString,
  type: EventType,
  time?: TimeString,
  memberIds: ReadonlyArray<MemberId> = [],
  memo?: string
): CalendarEvent => ({
  id: nanoid() as EventId,
  title,
  date,
  type,
  time,
  memberIds,
  memo,
});

// イベントのタイトルを更新
export const updateEventTitle = (
  event: CalendarEvent,
  title: EventTitle
): CalendarEvent => ({
  ...event,
  title,
});

// イベントの日付を更新
export const updateEventDate = (
  event: CalendarEvent,
  date: DateString
): CalendarEvent => ({
  ...event,
  date,
});

// イベントの時刻を更新
export const updateEventTime = (
  event: CalendarEvent,
  time: TimeString | undefined
): CalendarEvent => ({
  ...event,
  time,
});

// イベントの担当者を更新
export const assignMembersToEvent = (
  event: CalendarEvent,
  memberIds: ReadonlyArray<MemberId>
): CalendarEvent => ({
  ...event,
  memberIds,
});

// イベントのメモを更新
export const updateEventMemo = (
  event: CalendarEvent,
  memo: string | undefined
): CalendarEvent => ({
  ...event,
  memo,
});

// 特定の日付のイベントをフィルタリング
export const filterEventsByDate = (
  events: ReadonlyArray<CalendarEvent>,
  date: DateString
): ReadonlyArray<CalendarEvent> => {
  return events.filter(event => event.date === date);
};

// 特定のメンバーが担当するイベントをフィルタリング
export const filterEventsByMember = (
  events: ReadonlyArray<CalendarEvent>,
  memberId: MemberId
): ReadonlyArray<CalendarEvent> => {
  return events.filter(event => event.memberIds.includes(memberId));
};

// 日付範囲でイベントをフィルタリング
export const filterEventsByDateRange = (
  events: ReadonlyArray<CalendarEvent>,
  startDate: DateString,
  endDate: DateString
): ReadonlyArray<CalendarEvent> => {
  return events.filter(event => 
    event.date >= startDate && event.date <= endDate
  );
};