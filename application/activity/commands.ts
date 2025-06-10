import { Result } from 'neverthrow';
import type { 
  Activity, 
  CreateActivityCommand, 
  UpdateActivityCommand,
  ActivityError 
} from '@/domain/activity/types';
import type { ActivityId } from '@/domain/shared/branded-types';

/**
 * ActivityのCommand DTOs
 * UIからアプリケーション層への入力
 */

// === Create Activity Command ===

export type CreateActivityDTO = Readonly<{
  title: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  category: string;
  priority?: string;
  memberIds?: ReadonlyArray<string>;
  location?: string;
  checklist?: ReadonlyArray<{
    title: string;
    assignedMemberIds?: ReadonlyArray<string>;
  }>;
  tags?: ReadonlyArray<string>;
}>;

export type CreateActivityResult = Result<Activity, ActivityError>;

// === Update Activity Command ===

export type UpdateActivityDTO = Readonly<{
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  category?: string;
  status?: string;
  priority?: string;
  memberIds?: ReadonlyArray<string>;
  location?: string;
  checklist?: ReadonlyArray<{
    id: string;
    title: string;
    checked: boolean;
    assignedMemberIds?: ReadonlyArray<string>;
  }>;
  completedAt?: string;
  tags?: ReadonlyArray<string>;
}>;

export type UpdateActivityResult = Result<Activity, ActivityError>;

// === Delete Activity Command ===

export type DeleteActivityDTO = Readonly<{
  id: string;
}>;

export type DeleteActivityResult = Result<void, ActivityError>;

// === Activity Status Operations ===

export type CompleteActivityDTO = Readonly<{
  id: string;
}>;

export type CompleteActivityResult = Result<Activity, ActivityError>;

export type ReopenActivityDTO = Readonly<{
  id: string;
}>;

export type ReopenActivityResult = Result<Activity, ActivityError>;

export type CancelActivityDTO = Readonly<{
  id: string;
}>;

export type CancelActivityResult = Result<Activity, ActivityError>;

// === Checklist Operations ===

export type AddChecklistItemDTO = Readonly<{
  activityId: string;
  title: string;
  assignedMemberIds?: ReadonlyArray<string>;
}>;

export type AddChecklistItemResult = Result<Activity, ActivityError>;

export type ToggleChecklistItemDTO = Readonly<{
  activityId: string;
  itemId: string;
}>;

export type ToggleChecklistItemResult = Result<Activity, ActivityError>;

export type RemoveChecklistItemDTO = Readonly<{
  activityId: string;
  itemId: string;
}>;

export type RemoveChecklistItemResult = Result<Activity, ActivityError>;