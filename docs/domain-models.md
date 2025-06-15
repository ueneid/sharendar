# ドメインモデル詳細

このドキュメントでは、Sharendarの統一Activityドメインモデルの詳細仕様について説明します。

## 統一Activityドメインモデル

### 設計背景

CalendarEventとTaskという従来の2つのエンティティを統一し、単一の`Activity`エンティティで予定・タスク・期限などすべてのアクティビティを表現します。

### 核となる型定義

```typescript
// domain/activity/types.ts
type Activity = Readonly<{
  id: ActivityId;
  title: ActivityTitle;
  description?: string;
  
  // 柔軟な時間モデル
  startDate?: DateString;      // 開始日
  startTime?: TimeString;      // 開始時刻
  endDate?: DateString;        // 終了日
  endTime?: TimeString;        // 終了時刻
  dueDate?: DateString;        // 期限日
  isAllDay: boolean;           // 終日フラグ
  
  // 分類・状態
  category: ActivityCategory;  // カテゴリ
  status: ActivityStatus;      // ステータス
  priority: ActivityPriority;  // 優先度
  
  // タスク機能
  checklist: ReadonlyArray<ChecklistItem>;  // チェックリスト
  completedAt?: DateString;                 // 完了日時
  
  // メタデータ
  memberIds: ReadonlyArray<MemberId>;       // 担当メンバー
  location?: string;                        // 場所
  tags: ReadonlyArray<string>;              // タグ
  createdAt: DateString;                    // 作成日時
  updatedAt: DateString;                    // 更新日時
  recurrence?: RecurrencePattern;           // 繰り返しパターン
}>;
```

## 分類体系

### ActivityCategory（カテゴリ）

```typescript
type ActivityCategory = 
  | 'event'       // 予定・イベント
  | 'task'        // タスク・ToDo
  | 'appointment' // アポイントメント
  | 'deadline'    // 期限・締切
  | 'meeting'     // 会議・ミーティング
  | 'milestone'   // マイルストーン
  | 'reminder';   // リマインダー
```

**使い分けガイドライン**:
- `event`: 時間が固定された予定（誕生日、旅行など）
- `task`: 完了が目的のタスク（買い物、掃除など）
- `appointment`: 他者との約束（医者、美容院など）
- `deadline`: 期限がある締切（支払い、提出など）
- `meeting`: 会議やミーティング
- `milestone`: プロジェクトの節目
- `reminder`: 思い出すためのリマインダー

### ActivityStatus（ステータス）

```typescript
type ActivityStatus = 
  | 'pending'     // 未着手・予定
  | 'in_progress' // 進行中
  | 'completed'   // 完了
  | 'cancelled'   // キャンセル
  | 'postponed';  // 延期
```

**ステータス遷移**:
```
pending → in_progress → completed
   ↓           ↓
cancelled   postponed → pending
```

### ActivityPriority（優先度）

```typescript
type ActivityPriority = 
  | 'high'    // 高優先度
  | 'medium'  // 中優先度
  | 'low';    // 低優先度
```

## 時間モデル

### 柔軟な時間表現

Activityは多様な時間概念を統一的に扱えるよう設計されています：

```typescript
// 終日イベント（誕生日など）
{
  startDate: '2025-06-15',
  isAllDay: true
}

// 時刻指定イベント（会議など）
{
  startDate: '2025-06-15',
  startTime: '14:00',
  endDate: '2025-06-15',
  endTime: '15:30',
  isAllDay: false
}

// 期限のみ（タスクなど）
{
  dueDate: '2025-06-20',
  isAllDay: false
}

// 期間指定（旅行など）
{
  startDate: '2025-07-01',
  endDate: '2025-07-05',
  isAllDay: true
}
```

### 時間関連の型定義

```typescript
type DateString = string & { readonly brand: unique symbol };  // YYYY-MM-DD
type TimeString = string & { readonly brand: unique symbol };  // HH:mm

// ファクトリ関数
export const asDateString = (value: string): DateString => value as DateString;
export const asTimeString = (value: string): TimeString => value as TimeString;

// バリデーション付きファクトリ
export const createDateString = (value: string): Result<DateString, ValidationError> => {
  if (!isValidDateString(value)) {
    return err(new ValidationError('無効な日付形式です（YYYY-MM-DD形式で入力してください）'));
  }
  return ok(asDateString(value));
};

export const createTimeString = (value: string): Result<TimeString, ValidationError> => {
  if (!isValidTimeString(value)) {
    return err(new ValidationError('無効な時刻形式です（HH:mm形式で入力してください）'));
  }
  return ok(asTimeString(value));
};
```

## サブエンティティ

### ChecklistItem（チェックリストアイテム）

```typescript
type ChecklistItem = Readonly<{
  id: ChecklistItemId;
  text: string;
  isCompleted: boolean;
  createdAt: DateString;
  completedAt?: DateString;
}>;

type ChecklistItemId = string & { readonly brand: unique symbol };
```

### RecurrencePattern（繰り返しパターン）

```typescript
type RecurrencePattern = Readonly<{
  type: RecurrenceType;
  interval: number;        // 間隔（1=毎回、2=1つおき）
  endDate?: DateString;    // 繰り返し終了日
  count?: number;          // 繰り返し回数
  weekdays?: WeekDay[];    // 曜日指定（週単位の場合）
}>;

type RecurrenceType = 
  | 'daily'    // 日単位
  | 'weekly'   // 週単位
  | 'monthly'  // 月単位
  | 'yearly';  // 年単位

type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
```

## Brand型による型安全性

### 主要なBrand型

```typescript
// domain/shared/branded-types.ts

// Activity関連
export type ActivityId = string & { readonly brand: unique symbol };
export type ActivityTitle = string & { readonly brand: unique symbol };
export type ChecklistItemId = string & { readonly brand: unique symbol };

// FamilyMember関連
export type MemberId = string & { readonly brand: unique symbol };
export type MemberName = string & { readonly brand: unique symbol };

// 時間関連
export type DateString = string & { readonly brand: unique symbol };
export type TimeString = string & { readonly brand: unique symbol };

// ファクトリ関数
export const asActivityId = (value: string): ActivityId => value as ActivityId;
export const asActivityTitle = (value: string): ActivityTitle => value as ActivityTitle;
export const asMemberId = (value: string): MemberId => value as MemberId;
export const asMemberName = (value: string): MemberName => value as MemberName;
export const asDateString = (value: string): DateString => value as DateString;
export const asTimeString = (value: string): TimeString => value as TimeString;
```

### Brand型の利点

1. **コンパイル時の型安全性**: 異なる種類のIDの混同を防ぐ
2. **実行時エラーの防止**: 型チェックにより不正な値の代入を防ぐ
3. **自己文書化**: 型名から用途が明確

```typescript
// ❌ コンパイルエラーとなる
const activityId: ActivityId = asMemberId('member-1'); // Type error!

// ✅ 正しい使用法
const activityId: ActivityId = asActivityId('activity-1');
const memberId: MemberId = asMemberId('member-1');
```

## バリデーション

### ドメインバリデーションルール

```typescript
// domain/activity/validations.ts

export const validateActivityTitle = (title: string): Result<ActivityTitle, ActivityError> => {
  if (!title.trim()) {
    return err(new ActivityError('VALIDATION_ERROR', 'タイトルは必須です'));
  }
  if (title.length > 100) {
    return err(new ActivityError('VALIDATION_ERROR', 'タイトルは100文字以内で入力してください'));
  }
  return ok(asActivityTitle(title.trim()));
};

export const validateActivityDates = (
  startDate?: string,
  endDate?: string,
  dueDate?: string
): Result<void, ActivityError> => {
  // 開始日と終了日の整合性チェック
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return err(new ActivityError('VALIDATION_ERROR', '終了日は開始日より後に設定してください'));
    }
  }
  
  // 期限日の妥当性チェック
  if (dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now && !isSameDay(due, now)) {
      return err(new ActivityError('VALIDATION_ERROR', '期限日は本日以降に設定してください'));
    }
  }
  
  return ok(undefined);
};

export const validateChecklistItem = (text: string): Result<string, ActivityError> => {
  if (!text.trim()) {
    return err(new ActivityError('VALIDATION_ERROR', 'チェックリストアイテムは空にできません'));
  }
  if (text.length > 200) {
    return err(new ActivityError('VALIDATION_ERROR', 'チェックリストアイテムは200文字以内で入力してください'));
  }
  return ok(text.trim());
};
```

## ドメイン操作（純粋関数）

### Activity作成

```typescript
// domain/activity/operations.ts

export const createActivity = (
  title: string,
  category: ActivityCategory,
  priority: ActivityPriority,
  options: Partial<{
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    dueDate: string;
    isAllDay: boolean;
    memberIds: string[];
    location: string;
    tags: string[];
  }> = {}
): Result<Activity, ActivityError> => {
  // タイトルバリデーション
  const titleResult = validateActivityTitle(title);
  if (titleResult.isErr()) {
    return err(titleResult.error);
  }
  
  // 日付バリデーション
  const datesResult = validateActivityDates(
    options.startDate,
    options.endDate,
    options.dueDate
  );
  if (datesResult.isErr()) {
    return err(datesResult.error);
  }
  
  // Activity作成
  const now = new Date().toISOString();
  const activity: Activity = {
    id: asActivityId(generateId()),
    title: titleResult.value,
    description: options.description,
    startDate: options.startDate ? asDateString(options.startDate) : undefined,
    startTime: options.startTime ? asTimeString(options.startTime) : undefined,
    endDate: options.endDate ? asDateString(options.endDate) : undefined,
    endTime: options.endTime ? asTimeString(options.endTime) : undefined,
    dueDate: options.dueDate ? asDateString(options.dueDate) : undefined,
    isAllDay: options.isAllDay ?? false,
    category,
    status: 'pending' as ActivityStatus,
    priority,
    checklist: [],
    memberIds: (options.memberIds || []).map(asMemberId),
    location: options.location,
    tags: options.tags || [],
    createdAt: asDateString(now),
    updatedAt: asDateString(now),
  };
  
  return ok(activity);
};
```

### Activity更新

```typescript
export const updateActivity = (
  activity: Activity,
  updates: Partial<{
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    dueDate: string;
    isAllDay: boolean;
    category: ActivityCategory;
    status: ActivityStatus;
    priority: ActivityPriority;
    location: string;
    tags: string[];
  }>
): Result<Activity, ActivityError> => {
  // タイトル更新時のバリデーション
  if (updates.title !== undefined) {
    const titleResult = validateActivityTitle(updates.title);
    if (titleResult.isErr()) {
      return err(titleResult.error);
    }
  }
  
  // 日付更新時のバリデーション
  const newStartDate = updates.startDate ?? activity.startDate;
  const newEndDate = updates.endDate ?? activity.endDate;
  const newDueDate = updates.dueDate ?? activity.dueDate;
  
  const datesResult = validateActivityDates(newStartDate, newEndDate, newDueDate);
  if (datesResult.isErr()) {
    return err(datesResult.error);
  }
  
  // 更新されたActivity作成
  const updatedActivity: Activity = {
    ...activity,
    title: updates.title ? asActivityTitle(updates.title) : activity.title,
    description: updates.description ?? activity.description,
    startDate: updates.startDate ? asDateString(updates.startDate) : activity.startDate,
    startTime: updates.startTime ? asTimeString(updates.startTime) : activity.startTime,
    endDate: updates.endDate ? asDateString(updates.endDate) : activity.endDate,
    endTime: updates.endTime ? asTimeString(updates.endTime) : activity.endTime,
    dueDate: updates.dueDate ? asDateString(updates.dueDate) : activity.dueDate,
    isAllDay: updates.isAllDay ?? activity.isAllDay,
    category: updates.category ?? activity.category,
    status: updates.status ?? activity.status,
    priority: updates.priority ?? activity.priority,
    location: updates.location ?? activity.location,
    tags: updates.tags ?? activity.tags,
    updatedAt: asDateString(new Date().toISOString()),
  };
  
  return ok(updatedActivity);
};
```

### Activity完了

```typescript
export const completeActivity = (activity: Activity): Result<Activity, ActivityError> => {
  if (activity.status === 'completed') {
    return err(new ActivityError('INVALID_OPERATION', 'すでに完了済みのActivityです'));
  }
  
  const now = new Date().toISOString();
  const completedActivity: Activity = {
    ...activity,
    status: 'completed' as ActivityStatus,
    completedAt: asDateString(now),
    updatedAt: asDateString(now),
  };
  
  return ok(completedActivity);
};
```

## エラーモデル

### ActivityError

```typescript
export class ActivityError extends Error {
  constructor(
    public readonly code: ActivityErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ActivityError';
  }
}

export type ActivityErrorCode = 
  | 'VALIDATION_ERROR'     // バリデーションエラー
  | 'NOT_FOUND'           // 存在しないActivity
  | 'INVALID_OPERATION'   // 無効な操作
  | 'PERMISSION_DENIED';  // 権限不足
```

## フィルタリング

### ActivityFilters

```typescript
export type ActivityFilters = Readonly<{
  categories?: ReadonlyArray<ActivityCategory>;
  statuses?: ReadonlyArray<ActivityStatus>;
  priorities?: ReadonlyArray<ActivityPriority>;
  memberIds?: ReadonlyArray<MemberId>;
  startDate?: DateString;      // この日以降
  endDate?: DateString;        // この日以前
  showCompleted?: boolean;     // 完了済み表示
  searchText?: string;         // テキスト検索
  tags?: ReadonlyArray<string>; // タグフィルター
}>;

// フィルタリング関数
export const filterActivities = (
  activities: ReadonlyArray<Activity>,
  filters: ActivityFilters
): Activity[] => {
  return activities.filter(activity => {
    // カテゴリフィルター
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(activity.category)) {
        return false;
      }
    }
    
    // ステータスフィルター
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(activity.status)) {
        return false;
      }
    }
    
    // 優先度フィルター
    if (filters.priorities && filters.priorities.length > 0) {
      if (!filters.priorities.includes(activity.priority)) {
        return false;
      }
    }
    
    // メンバーフィルター
    if (filters.memberIds && filters.memberIds.length > 0) {
      const hasMatchingMember = filters.memberIds.some(memberId =>
        activity.memberIds.includes(memberId)
      );
      if (!hasMatchingMember) {
        return false;
      }
    }
    
    // 完了済み表示
    if (filters.showCompleted === false && activity.status === 'completed') {
      return false;
    }
    
    // テキスト検索
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const titleMatch = activity.title.toLowerCase().includes(searchLower);
      const descriptionMatch = activity.description?.toLowerCase().includes(searchLower) ?? false;
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }
    
    // タグフィルター
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag =>
        activity.tags.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
};
```

## 関連ドキュメント

- [アーキテクチャ詳細](/docs/architecture.md) - 全体設計と技術スタック
- [API設計パターン](/docs/api-patterns.md) - Repository, UseCase, Error handling patterns
- [テスト戦略](/docs/testing.md) - TDD実践ガイド