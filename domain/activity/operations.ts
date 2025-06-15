import { Result, ok, err } from 'neverthrow';
import type { 
  Activity, 
  ActivityCategory,
  ActivityStatus,
  ActivityPriority,
  ChecklistItem,
  CreateActivityCommand,
  UpdateActivityCommand,
  ActivityError 
} from './types';
import { 
  asActivityId,
  asActivityTitle,
  asDateString,
  asTimeString,
  asMemberId
} from '@/domain/shared/branded-types';
import { 
  validateCreateActivityCommand,
  validateUpdateActivityCommand 
} from './validations';

/**
 * Activityドメインの操作ロジック（純粋関数）
 */

// === Activity Creation ===

// テスト用のシンプルなcreateActivity関数
export const createActivity = (
  title: string,
  category: ActivityCategory,
  priority: ActivityPriority,
  options?: {
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    isAllDay?: boolean;
    memberIds?: string[];
    description?: string;
  }
): Activity => {
  const now = new Date().toISOString().split('T')[0];
  const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: asActivityId(id),
    title: asActivityTitle(title),
    description: options?.description,
    
    // 時間・日付
    startDate: options?.startDate ? asDateString(options.startDate) : undefined,
    startTime: undefined,
    endDate: options?.endDate ? asDateString(options.endDate) : undefined,
    endTime: undefined,
    dueDate: options?.dueDate ? asDateString(options.dueDate) : undefined,
    isAllDay: options?.isAllDay ?? true,
    
    // 分類・状態
    category,
    status: 'pending' as ActivityStatus,
    priority,
    
    // 人・場所
    memberIds: options?.memberIds?.map(asMemberId) ?? [],
    location: undefined,
    
    // タスク機能
    checklist: [],
    
    // メタデータ
    createdAt: asDateString(now),
    updatedAt: asDateString(now),
    tags: [],
  };
};

// コマンドベースのcreateActivity関数
export const createActivityFromCommand = (
  command: CreateActivityCommand
): Result<Activity, ActivityError> => {
  // バリデーション
  const validationResult = validateCreateActivityCommand(command);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }
  
  const now = new Date().toISOString().split('T')[0];
  const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const activity: Activity = {
    id: asActivityId(id),
    title: asActivityTitle(command.title.trim()),
    description: command.description?.trim(),
    
    // 時間・日付
    startDate: command.startDate ? asDateString(command.startDate) : undefined,
    startTime: command.startTime ? asTimeString(command.startTime) : undefined,
    endDate: command.endDate ? asDateString(command.endDate) : undefined,
    endTime: command.endTime ? asTimeString(command.endTime) : undefined,
    dueDate: command.dueDate ? asDateString(command.dueDate) : undefined,
    isAllDay: command.isAllDay ?? false,
    
    // 分類・状態
    category: command.category,
    status: 'pending' as ActivityStatus,
    priority: command.priority ?? 'medium',
    
    // 人・場所
    memberIds: command.memberIds?.map(asMemberId) ?? [],
    location: command.location?.trim(),
    
    // タスク機能
    checklist: command.checklist?.map((item, index) => ({
      id: `checklist_${Date.now()}_${index}`,
      title: item.title.trim(),
      checked: false,
      assignedMemberIds: item.assignedMemberIds?.map(asMemberId),
    })) ?? [],
    
    // メタデータ
    createdAt: asDateString(now),
    updatedAt: asDateString(now),
    tags: command.tags ?? [],
  };
  
  return ok(activity);
};

// === Activity Updates ===

export const updateActivity = (
  current: Activity,
  command: UpdateActivityCommand
): Result<Activity, ActivityError> => {
  // バリデーション
  const validationResult = validateUpdateActivityCommand(command);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }
  
  const now = new Date().toISOString().split('T')[0];
  
  const updated: Activity = {
    ...current,
    title: command.title !== undefined 
      ? asActivityTitle(command.title.trim()) 
      : current.title,
    description: command.description !== undefined 
      ? command.description?.trim() 
      : current.description,
    
    // 時間・日付
    startDate: command.startDate !== undefined 
      ? (command.startDate ? asDateString(command.startDate) : undefined)
      : current.startDate,
    startTime: command.startTime !== undefined 
      ? (command.startTime ? asTimeString(command.startTime) : undefined)
      : current.startTime,
    endDate: command.endDate !== undefined 
      ? (command.endDate ? asDateString(command.endDate) : undefined)
      : current.endDate,
    endTime: command.endTime !== undefined 
      ? (command.endTime ? asTimeString(command.endTime) : undefined)
      : current.endTime,
    dueDate: command.dueDate !== undefined 
      ? (command.dueDate ? asDateString(command.dueDate) : undefined)
      : current.dueDate,
    isAllDay: command.isAllDay !== undefined 
      ? command.isAllDay 
      : current.isAllDay,
    
    // 分類・状態
    category: command.category ?? current.category,
    status: command.status ?? current.status,
    priority: command.priority ?? current.priority,
    
    // 人・場所
    memberIds: command.memberIds !== undefined 
      ? command.memberIds.map(asMemberId) 
      : current.memberIds,
    location: command.location !== undefined 
      ? command.location?.trim() 
      : current.location,
    
    // タスク機能
    checklist: command.checklist ?? current.checklist,
    completedAt: command.completedAt !== undefined 
      ? (command.completedAt ? asDateString(command.completedAt) : undefined)
      : current.completedAt,
    
    // メタデータ
    updatedAt: asDateString(now),
    tags: command.tags ?? current.tags,
  };
  
  return ok(updated);
};

// テスト用の関数
export const updateActivityStatus = (
  activity: Activity,
  status: ActivityStatus,
  completedAt?: string
): Activity => {
  // テストで指定された日付を使用、指定されなければ現在日付
  const updatedAt = completedAt || new Date().toISOString().split('T')[0];
  
  return {
    ...activity,
    status,
    completedAt: status === 'completed' && completedAt ? asDateString(completedAt) : activity.completedAt,
    updatedAt: asDateString(updatedAt),
  };
};

export const addChecklistItem = (
  activity: Activity,
  title: string
): Activity => {
  const now = new Date().toISOString().split('T')[0];
  const newItem: ChecklistItem = {
    id: `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    checked: false,
  };
  
  return {
    ...activity,
    checklist: [...activity.checklist, newItem],
    updatedAt: asDateString(now),
  };
};

export const toggleChecklistItem = (
  activity: Activity,
  itemId: string
): Activity => {
  const now = new Date().toISOString().split('T')[0];
  const updatedChecklist = activity.checklist.map(item =>
    item.id === itemId
      ? { ...item, checked: !item.checked }
      : item
  );
  
  return {
    ...activity,
    checklist: updatedChecklist,
    updatedAt: asDateString(now),
  };
};

export const calculateProgress = (checklist: ChecklistItem[]): {
  completed: number;
  total: number;
  percentage: number;
} => {
  const total = checklist.length;
  const completed = checklist.filter(item => item.checked).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

// === Status Operations ===

export const completeActivity = (activity: Activity): Result<Activity, ActivityError> => {
  if (activity.status === 'completed') {
    return err({
      type: 'ConflictError',
      message: 'このアクティビティは既に完了しています'
    });
  }
  
  const now = new Date().toISOString().split('T')[0];
  
  const completed: Activity = {
    ...activity,
    status: 'completed',
    completedAt: asDateString(now),
    updatedAt: asDateString(now),
  };
  
  return ok(completed);
};

export const reopenActivity = (activity: Activity): Result<Activity, ActivityError> => {
  if (activity.status !== 'completed') {
    return err({
      type: 'ConflictError',
      message: 'このアクティビティは完了状態ではありません'
    });
  }
  
  const now = new Date().toISOString().split('T')[0];
  
  const reopened: Activity = {
    ...activity,
    status: 'pending',
    completedAt: undefined,
    updatedAt: asDateString(now),
  };
  
  return ok(reopened);
};

export const cancelActivity = (activity: Activity): Result<Activity, ActivityError> => {
  if (activity.status === 'cancelled') {
    return err({
      type: 'ConflictError',
      message: 'このアクティビティは既にキャンセルされています'
    });
  }
  
  const now = new Date().toISOString().split('T')[0];
  
  const cancelled: Activity = {
    ...activity,
    status: 'cancelled',
    updatedAt: asDateString(now),
  };
  
  return ok(cancelled);
};

// === Checklist Operations (Result返却版) ===

export const addChecklistItemWithResult = (
  activity: Activity,
  title: string,
  assignedMemberIds?: string[]
): Result<Activity, ActivityError> => {
  if (title.trim().length === 0) {
    return err({
      type: 'ValidationError',
      message: 'チェックリスト項目のタイトルを入力してください',
      field: 'checklist'
    });
  }
  
  const now = new Date().toISOString().split('T')[0];
  const newItem: ChecklistItem = {
    id: `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    checked: false,
    assignedMemberIds: assignedMemberIds?.map(asMemberId),
  };
  
  const updated: Activity = {
    ...activity,
    checklist: [...activity.checklist, newItem],
    updatedAt: asDateString(now),
  };
  
  return ok(updated);
};

export const toggleChecklistItemWithResult = (
  activity: Activity,
  itemId: string
): Result<Activity, ActivityError> => {
  const itemIndex = activity.checklist.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    return err({
      type: 'NotFoundError',
      message: 'チェックリスト項目が見つかりません',
      id: asActivityId(itemId)
    });
  }
  
  const now = new Date().toISOString().split('T')[0];
  const updatedChecklist = activity.checklist.map(item =>
    item.id === itemId
      ? { ...item, checked: !item.checked }
      : item
  );
  
  const updated: Activity = {
    ...activity,
    checklist: updatedChecklist,
    updatedAt: asDateString(now),
  };
  
  return ok(updated);
};

export const removeChecklistItem = (
  activity: Activity,
  itemId: string
): Result<Activity, ActivityError> => {
  const itemExists = activity.checklist.some(item => item.id === itemId);
  if (!itemExists) {
    return err({
      type: 'NotFoundError',
      message: 'チェックリスト項目が見つかりません',
      id: asActivityId(itemId)
    });
  }
  
  const now = new Date().toISOString().split('T')[0];
  const updatedChecklist = activity.checklist.filter(item => item.id !== itemId);
  
  const updated: Activity = {
    ...activity,
    checklist: updatedChecklist,
    updatedAt: asDateString(now),
  };
  
  return ok(updated);
};

// === Query Helpers ===

export const getActivityProgress = (activity: Activity): {
  completed: number;
  total: number;
  percentage: number;
} => {
  const total = activity.checklist.length;
  const completed = activity.checklist.filter(item => item.checked).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

export const isOverdue = (activity: Activity): boolean => {
  if (!activity.dueDate || activity.status === 'completed') {
    return false;
  }
  
  const today = new Date().toISOString().split('T')[0];
  return activity.dueDate < today;
};

export const getDurationMinutes = (activity: Activity): number | null => {
  if (!activity.startTime || !activity.endTime) {
    return null;
  }
  
  const [startHour, startMinute] = activity.startTime.split(':').map(Number);
  const [endHour, endMinute] = activity.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
};

export const hasTimeConflict = (activity1: Activity, activity2: Activity): boolean => {
  // 同じ日付でない場合は競合なし
  if (activity1.startDate !== activity2.startDate) {
    return false;
  }
  
  // 時間が設定されていない場合は競合チェックしない
  if (!activity1.startTime || !activity1.endTime || 
      !activity2.startTime || !activity2.endTime) {
    return false;
  }
  
  // 時間の重複チェック
  const a1Start = activity1.startTime;
  const a1End = activity1.endTime;
  const a2Start = activity2.startTime;
  const a2End = activity2.endTime;
  
  return !(a1End <= a2Start || a2End <= a1Start);
};