import { Result, ok, err } from 'neverthrow';
import { TaskTitle, DateString } from '@/domain/shared/branded-types';
import { Priority } from './types';

/**
 * タスクに関するバリデーション
 */

// タスクタイトルのバリデーション
export const createTaskTitle = (value: string): Result<TaskTitle, string> => {
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return err('タスクのタイトルを入力してください');
  }
  
  if (trimmed.length > 100) {
    return err('タスクのタイトルは100文字以内で入力してください');
  }
  
  return ok(trimmed as TaskTitle);
};

// チェックリストアイテムのバリデーション
export const validateChecklistItemTitle = (value: string): Result<string, string> => {
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    return err('項目名を入力してください');
  }
  
  if (trimmed.length > 50) {
    return err('項目名は50文字以内で入力してください');
  }
  
  return ok(trimmed);
};

// 日付文字列のバリデーション
export const createDateString = (value: string): Result<DateString, string> => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return err('日付の形式が正しくありません（YYYY-MM-DD形式で入力してください）');
  }
  
  // 実際の日付として有効かチェック
  const date = new Date(value);
  if (isNaN(date.getTime()) || date.toISOString().split('T')[0] !== value) {
    return err('有効な日付を入力してください');
  }
  
  return ok(value as DateString);
};

// 優先度のバリデーション
export const validatePriority = (value: Priority): Result<Priority, string> => {
  const validPriorities: Priority[] = ['high', 'medium', 'low'];
  
  if (!validPriorities.includes(value)) {
    return err('優先度は high, medium, low のいずれかを指定してください');
  }
  
  return ok(value);
};