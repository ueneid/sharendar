import { Result, ok, err } from 'neverthrow';
import { EventTitle, DateString, TimeString } from '@/domain/shared/branded-types';
import { isValid, parse } from 'date-fns';

/**
 * カレンダーイベントに関するバリデーション
 */

// イベントタイトルのバリデーション
export const createEventTitle = (value: string): Result<EventTitle, string> => {
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return err('タイトルを入力してください');
  }
  
  if (trimmed.length > 50) {
    return err('タイトルは50文字以内で入力してください');
  }
  
  return ok(trimmed as EventTitle);
};

// 日付文字列のバリデーション (YYYY-MM-DD)
export const createDateString = (value: string): Result<DateString, string> => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(value)) {
    return err('日付の形式が正しくありません（YYYY-MM-DD）');
  }
  
  // 実際の日付として有効かチェック
  const date = parse(value, 'yyyy-MM-dd', new Date());
  if (!isValid(date)) {
    return err('有効な日付を入力してください');
  }
  
  return ok(value as DateString);
};

// 時刻文字列のバリデーション (HH:MM)
export const createTimeString = (value: string): Result<TimeString, string> => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  
  if (!timeRegex.test(value)) {
    return err('時刻の形式が正しくありません（HH:MM）');
  }
  
  return ok(value as TimeString);
};

// メモのバリデーション
export const validateMemo = (value: string): Result<string, string> => {
  if (value.length > 200) {
    return err('メモは200文字以内で入力してください');
  }
  
  return ok(value);
};