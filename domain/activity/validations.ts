import { Result, ok, err } from 'neverthrow';
import type { 
  Activity, 
  ActivityCategory, 
  ActivityStatus, 
  ActivityPriority,
  CreateActivityCommand,
  UpdateActivityCommand,
  ActivityError 
} from './types';
import { 
  ActivityTitle,
  DateString,
  TimeString,
  asActivityTitle, 
  asDateString, 
  asTimeString
} from '@/domain/shared/branded-types';

/**
 * Activityドメインのバリデーション・スマートコンストラクタ
 */

// === Value Object Smart Constructors ===

export const createActivityTitle = (value: string): Result<ActivityTitle, ActivityError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err({ type: 'ValidationError', message: 'タイトルを入力してください', field: 'title' });
  }
  if (trimmed.length > 100) {
    return err({ type: 'ValidationError', message: 'タイトルは100文字以内で入力してください', field: 'title' });
  }
  return ok(asActivityTitle(trimmed));
};

export const createDateString = (value: string): Result<DateString, ActivityError> => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return err({ type: 'ValidationError', message: '日付の形式が正しくありません (YYYY-MM-DD)', field: 'date' });
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return err({ type: 'ValidationError', message: '有効な日付を入力してください', field: 'date' });
  }
  
  return ok(asDateString(value));
};

// テスト用の関数
export const validateActivityTitle = (value: string): Result<string, ActivityError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err({ type: 'ValidationError', message: 'タイトルを入力してください', field: 'title' });
  }
  if (trimmed.length > 100) {
    return err({ type: 'ValidationError', message: 'タイトルは100文字以内で入力してください', field: 'title' });
  }
  return ok(trimmed);
};

export const validateActivityDates = (startDate?: string, endDate?: string): Result<void, ActivityError> => {
  if (!startDate || !endDate) {
    return ok(undefined);
  }
  
  if (startDate > endDate) {
    return err({ 
      type: 'ValidationError', 
      message: '終了日は開始日より後にしてください', 
      field: 'dateRange' 
    });
  }
  
  return ok(undefined);
};

export const validateActivityMembers = (memberIds: string[]): Result<void, ActivityError> => {
  // 重複チェック
  const uniqueIds = new Set(memberIds);
  if (uniqueIds.size !== memberIds.length) {
    return err({ 
      type: 'ValidationError', 
      message: '重複したメンバーが指定されています', 
      field: 'memberIds' 
    });
  }
  
  return ok(undefined);
};

export const createTimeString = (value: string): Result<TimeString, ActivityError> => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(value)) {
    return err({ type: 'ValidationError', message: '時刻の形式が正しくありません (HH:MM)', field: 'time' });
  }
  return ok(asTimeString(value));
};

// === Activity Business Logic Validation ===

export const validateActivityDateRange = (
  startDate?: string,
  endDate?: string,
  dueDate?: string
): Result<void, ActivityError> => {
  if (startDate && endDate) {
    if (startDate > endDate) {
      return err({ 
        type: 'ValidationError', 
        message: '終了日は開始日より後の日付を設定してください',
        field: 'endDate' 
      });
    }
  }
  
  if (startDate && dueDate && startDate > dueDate) {
    return err({ 
      type: 'ValidationError', 
      message: '期限日は開始日より後の日付を設定してください',
      field: 'dueDate' 
    });
  }
  
  return ok(undefined);
};

export const validateActivityCategory = (category: string): Result<ActivityCategory, ActivityError> => {
  const validCategories: ActivityCategory[] = [
    'event', 'task', 'appointment', 'deadline', 'meeting', 'milestone', 'reminder'
  ];
  
  if (!validCategories.includes(category as ActivityCategory)) {
    return err({ 
      type: 'ValidationError', 
      message: '無効なカテゴリです',
      field: 'category' 
    });
  }
  
  return ok(category as ActivityCategory);
};

export const validateActivityStatus = (status: string): Result<ActivityStatus, ActivityError> => {
  const validStatuses: ActivityStatus[] = [
    'pending', 'in_progress', 'completed', 'cancelled', 'postponed'
  ];
  
  if (!validStatuses.includes(status as ActivityStatus)) {
    return err({ 
      type: 'ValidationError', 
      message: '無効なステータスです',
      field: 'status' 
    });
  }
  
  return ok(status as ActivityStatus);
};

export const validateActivityPriority = (priority: string): Result<ActivityPriority, ActivityError> => {
  const validPriorities: ActivityPriority[] = ['high', 'medium', 'low'];
  
  if (!validPriorities.includes(priority as ActivityPriority)) {
    return err({ 
      type: 'ValidationError', 
      message: '無効な優先度です',
      field: 'priority' 
    });
  }
  
  return ok(priority as ActivityPriority);
};

// === Command Validation ===

export const validateCreateActivityCommand = (
  command: CreateActivityCommand
): Result<void, ActivityError> => {
  // Title validation
  const titleResult = createActivityTitle(command.title);
  if (titleResult.isErr()) {
    return err(titleResult.error);
  }
  
  // Category validation
  const categoryResult = validateActivityCategory(command.category);
  if (categoryResult.isErr()) {
    return err(categoryResult.error);
  }
  
  // Date validation
  if (command.startDate) {
    const startDateResult = createDateString(command.startDate);
    if (startDateResult.isErr()) {
      return err(startDateResult.error);
    }
  }
  
  if (command.endDate) {
    const endDateResult = createDateString(command.endDate);
    if (endDateResult.isErr()) {
      return err(endDateResult.error);
    }
  }
  
  if (command.dueDate) {
    const dueDateResult = createDateString(command.dueDate);
    if (dueDateResult.isErr()) {
      return err(dueDateResult.error);
    }
  }
  
  // Time validation
  if (command.startTime) {
    const startTimeResult = createTimeString(command.startTime);
    if (startTimeResult.isErr()) {
      return err(startTimeResult.error);
    }
  }
  
  if (command.endTime) {
    const endTimeResult = createTimeString(command.endTime);
    if (endTimeResult.isErr()) {
      return err(endTimeResult.error);
    }
  }
  
  // Business logic validation
  const datesResult = validateActivityDates(
    command.startDate,
    command.endDate
  );
  if (datesResult.isErr()) {
    return err(datesResult.error);
  }
  
  // Priority validation (optional)
  if (command.priority) {
    const priorityResult = validateActivityPriority(command.priority);
    if (priorityResult.isErr()) {
      return err(priorityResult.error);
    }
  }
  
  return ok(undefined);
};

export const validateUpdateActivityCommand = (
  command: UpdateActivityCommand
): Result<void, ActivityError> => {
  // Title validation (if provided)
  if (command.title !== undefined) {
    const titleResult = createActivityTitle(command.title);
    if (titleResult.isErr()) {
      return err(titleResult.error);
    }
  }
  
  // Category validation (if provided)
  if (command.category !== undefined) {
    const categoryResult = validateActivityCategory(command.category);
    if (categoryResult.isErr()) {
      return err(categoryResult.error);
    }
  }
  
  // Status validation (if provided)
  if (command.status !== undefined) {
    const statusResult = validateActivityStatus(command.status);
    if (statusResult.isErr()) {
      return err(statusResult.error);
    }
  }
  
  // Priority validation (if provided)
  if (command.priority !== undefined) {
    const priorityResult = validateActivityPriority(command.priority);
    if (priorityResult.isErr()) {
      return err(priorityResult.error);
    }
  }
  
  // Date validation (if provided)
  if (command.startDate !== undefined) {
    const startDateResult = createDateString(command.startDate);
    if (startDateResult.isErr()) {
      return err(startDateResult.error);
    }
  }
  
  if (command.endDate !== undefined) {
    const endDateResult = createDateString(command.endDate);
    if (endDateResult.isErr()) {
      return err(endDateResult.error);
    }
  }
  
  if (command.dueDate !== undefined) {
    const dueDateResult = createDateString(command.dueDate);
    if (dueDateResult.isErr()) {
      return err(dueDateResult.error);
    }
  }
  
  // Time validation (if provided)
  if (command.startTime !== undefined) {
    const startTimeResult = createTimeString(command.startTime);
    if (startTimeResult.isErr()) {
      return err(startTimeResult.error);
    }
  }
  
  if (command.endTime !== undefined) {
    const endTimeResult = createTimeString(command.endTime);
    if (endTimeResult.isErr()) {
      return err(endTimeResult.error);
    }
  }
  
  return ok(undefined);
};