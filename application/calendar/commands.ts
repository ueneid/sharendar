import { Result, ok, err } from 'neverthrow';
import type { CalendarEvent } from '@/domain/calendar/types';
import type { EventTitle, DateString, TimeString, MemberId } from '@/domain/shared/branded-types';
import { asEventId, asMemberId } from '@/domain/shared/branded-types';
import { 
  createCalendarEvent as createEventPure,
  updateEventTitle,
  updateEventDate,
  updateEventTime,
  updateEventMemberIds,
  updateEventType,
  updateEventMemo,
  clearEventTime
} from '@/domain/calendar/operations';
import { 
  createEventTitle,
  createDateString,
  createTimeString,
  validateMemo
} from '@/domain/calendar/validations';
import type { 
  ICalendarEventRepository,
  CalendarEventRepositoryError
} from '@/domain/calendar/repository';

/**
 * カレンダーイベント管理のコマンド操作
 * 状態を変更する操作（Create, Update, Delete）
 */

// コマンドのエラー型
export type CommandError = 
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; message: string }
  | { type: 'DatabaseError'; message: string };

// カレンダーイベント作成コマンド
export interface CreateCalendarEventCommand {
  title: string;
  date: string;
  time?: string;
  memberIds?: string[];
  type?: 'event' | 'task';
  memo?: string;
}

// カレンダーイベント更新コマンド
export interface UpdateCalendarEventCommand {
  id: string;
  title?: string;
  date?: string;
  time?: string | null; // nullは時間をクリアする
  memberIds?: string[];
  type?: 'event' | 'task';
  memo?: string;
}

/**
 * カレンダーイベントを作成する
 */
export const createCalendarEvent = async (
  command: CreateCalendarEventCommand,
  repository: ICalendarEventRepository
): Promise<Result<CalendarEvent, CommandError>> => {
  // バリデーション
  const titleResult = createEventTitle(command.title);
  if (titleResult.isErr()) {
    return err({ type: 'ValidationError', message: titleResult.error });
  }

  const dateResult = createDateString(command.date);
  if (dateResult.isErr()) {
    return err({ type: 'ValidationError', message: dateResult.error });
  }

  let time: TimeString | undefined;
  if (command.time) {
    const timeResult = createTimeString(command.time);
    if (timeResult.isErr()) {
      return err({ type: 'ValidationError', message: timeResult.error });
    }
    time = timeResult.value;
  }

  // メモのバリデーション
  if (command.memo) {
    const memoResult = validateMemo(command.memo);
    if (memoResult.isErr()) {
      return err({ type: 'ValidationError', message: memoResult.error });
    }
  }

  // MemberIdの変換
  const memberIds = (command.memberIds || []).map(id => asMemberId(id));

  // ドメインオブジェクト作成
  const event = createEventPure({
    title: titleResult.value,
    date: dateResult.value,
    time,
    memberIds,
    type: command.type || 'event',
    memo: command.memo
  });

  // 永続化
  const saveResult = await repository.save(event);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(event);
};

/**
 * カレンダーイベントを更新する
 */
export const updateCalendarEvent = async (
  command: UpdateCalendarEventCommand,
  repository: ICalendarEventRepository
): Promise<Result<CalendarEvent, CommandError>> => {
  // 既存イベントを取得
  const eventResult = await repository.findById(asEventId(command.id));
  if (eventResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: eventResult.error.message
    });
  }

  const existingEvent = eventResult.value;
  if (!existingEvent) {
    return err({
      type: 'NotFound',
      message: '指定されたイベントが見つかりません'
    });
  }

  let updatedEvent = existingEvent;

  // タイトルの更新
  if (command.title !== undefined) {
    const titleResult = createEventTitle(command.title);
    if (titleResult.isErr()) {
      return err({ type: 'ValidationError', message: titleResult.error });
    }
    updatedEvent = updateEventTitle(updatedEvent, titleResult.value);
  }

  // 日付の更新
  if (command.date !== undefined) {
    const dateResult = createDateString(command.date);
    if (dateResult.isErr()) {
      return err({ type: 'ValidationError', message: dateResult.error });
    }
    updatedEvent = updateEventDate(updatedEvent, dateResult.value);
  }

  // 時間の更新
  if (command.time !== undefined) {
    if (command.time === null) {
      // 時間をクリア
      updatedEvent = clearEventTime(updatedEvent);
    } else {
      const timeResult = createTimeString(command.time);
      if (timeResult.isErr()) {
        return err({ type: 'ValidationError', message: timeResult.error });
      }
      updatedEvent = updateEventTime(updatedEvent, timeResult.value);
    }
  }

  // メンバーIDの更新
  if (command.memberIds !== undefined) {
    const memberIds = command.memberIds.map(id => asMemberId(id));
    updatedEvent = updateEventMemberIds(updatedEvent, memberIds);
  }

  // タイプの更新
  if (command.type !== undefined) {
    updatedEvent = updateEventType(updatedEvent, command.type);
  }

  // メモの更新
  if (command.memo !== undefined) {
    const memoResult = validateMemo(command.memo);
    if (memoResult.isErr()) {
      return err({ type: 'ValidationError', message: memoResult.error });
    }
    updatedEvent = updateEventMemo(updatedEvent, command.memo || undefined);
  }

  // 永続化
  const saveResult = await repository.save(updatedEvent);
  if (saveResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: saveResult.error.message
    });
  }

  return ok(updatedEvent);
};

/**
 * カレンダーイベントを削除する
 */
export const deleteCalendarEvent = async (
  id: string,
  repository: ICalendarEventRepository
): Promise<Result<void, CommandError>> => {
  // 存在確認
  const eventResult = await repository.findById(asEventId(id));
  if (eventResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: eventResult.error.message
    });
  }

  if (!eventResult.value) {
    return err({
      type: 'NotFound',
      message: '指定されたイベントが見つかりません'
    });
  }

  // 削除実行
  const deleteResult = await repository.delete(asEventId(id));
  if (deleteResult.isErr()) {
    return err({
      type: 'DatabaseError',
      message: deleteResult.error.message
    });
  }

  return ok(undefined);
};