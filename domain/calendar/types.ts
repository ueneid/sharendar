import { EventId, EventTitle, DateString, TimeString, MemberId } from '@/domain/shared/branded-types';

/**
 * カレンダーイベントのドメインモデル
 */
export type CalendarEvent = Readonly<{
  id: EventId;
  title: EventTitle;
  date: DateString;
  time?: TimeString;
  memberIds: ReadonlyArray<MemberId>;
  type: EventType;
  memo?: string;
}>;

export type EventType = 'event' | 'task';