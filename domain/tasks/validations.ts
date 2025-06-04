import { Result, ok, err } from 'neverthrow';
import { TaskTitle } from '@/domain/shared/branded-types';

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