# API設計パターン

このドキュメントでは、SharendarにおけるRepository、UseCase、エラーハンドリングなどのAPI設計パターンについて説明します。

## Repository パターン

### インターフェース設計

```typescript
// domain/activity/repository.ts
import { Result } from 'neverthrow';
import { Activity, ActivityId } from './types';
import { ActivityFilters } from './filters';

export interface ActivityRepository {
  save(activity: Activity): Promise<Result<Activity, RepositoryError>>;
  findById(id: ActivityId): Promise<Result<Activity | null, RepositoryError>>;
  findAll(): Promise<Result<Activity[], RepositoryError>>;
  findByFilters(filters: ActivityFilters): Promise<Result<Activity[], RepositoryError>>;
  deleteById(id: ActivityId): Promise<Result<void, RepositoryError>>;
  count(): Promise<Result<number, RepositoryError>>;
}

export class RepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export type RepositoryErrorCode = 
  | 'SAVE_FAILED'
  | 'FIND_FAILED'
  | 'DELETE_FAILED'
  | 'CONNECTION_ERROR'
  | 'CONSTRAINT_VIOLATION';
```

### Dexie実装

```typescript
// infrastructure/db/activity-repository.ts
import { injectable } from 'inversify';
import { Result, ok, err } from 'neverthrow';
import { ActivityRepository, RepositoryError } from '../../domain/activity/repository';
import { Activity, ActivityId } from '../../domain/activity/types';
import { ActivityFilters } from '../../domain/activity/filters';
import { db } from './schema';

@injectable()
export class DexieActivityRepository implements ActivityRepository {
  async save(activity: Activity): Promise<Result<Activity, RepositoryError>> {
    try {
      await db.activities.put(activity);
      return ok(activity);
    } catch (error) {
      return err(new RepositoryError(
        'SAVE_FAILED',
        `Activity保存に失敗しました: ${error.message}`,
        error
      ));
    }
  }

  async findById(id: ActivityId): Promise<Result<Activity | null, RepositoryError>> {
    try {
      const activity = await db.activities.get(id);
      return ok(activity || null);
    } catch (error) {
      return err(new RepositoryError(
        'FIND_FAILED',
        `Activity検索に失敗しました: ${error.message}`,
        error
      ));
    }
  }

  async findAll(): Promise<Result<Activity[], RepositoryError>> {
    try {
      const activities = await db.activities
        .orderBy('createdAt')
        .reverse()
        .toArray();
      return ok(activities);
    } catch (error) {
      return err(new RepositoryError(
        'FIND_FAILED',
        `Activity一覧取得に失敗しました: ${error.message}`,
        error
      ));
    }
  }

  async findByFilters(filters: ActivityFilters): Promise<Result<Activity[], RepositoryError>> {
    try {
      let collection = db.activities.toCollection();

      // インデックスを活用した効率的なフィルタリング
      if (filters.categories && filters.categories.length === 1) {
        collection = db.activities.where('category').equals(filters.categories[0]);
      }

      if (filters.statuses && filters.statuses.length === 1) {
        if (filters.categories && filters.categories.length === 1) {
          // 複合インデックス使用
          collection = db.activities
            .where('[category+status]')
            .equals([filters.categories[0], filters.statuses[0]]);
        } else {
          collection = db.activities.where('status').equals(filters.statuses[0]);
        }
      }

      // 日付範囲フィルター
      if (filters.startDate) {
        collection = collection.filter(activity => 
          activity.startDate && activity.startDate >= filters.startDate!
        );
      }

      if (filters.endDate) {
        collection = collection.filter(activity => 
          activity.endDate && activity.endDate <= filters.endDate!
        );
      }

      // メンバーフィルター
      if (filters.memberIds && filters.memberIds.length > 0) {
        collection = collection.filter(activity =>
          filters.memberIds!.some(memberId => 
            activity.memberIds.includes(memberId)
          )
        );
      }

      const activities = await collection.toArray();
      return ok(activities);
    } catch (error) {
      return err(new RepositoryError(
        'FIND_FAILED',
        `フィルター検索に失敗しました: ${error.message}`,
        error
      ));
    }
  }

  async deleteById(id: ActivityId): Promise<Result<void, RepositoryError>> {
    try {
      await db.activities.delete(id);
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError(
        'DELETE_FAILED',
        `Activity削除に失敗しました: ${error.message}`,
        error
      ));
    }
  }

  async count(): Promise<Result<number, RepositoryError>> {
    try {
      const count = await db.activities.count();
      return ok(count);
    } catch (error) {
      return err(new RepositoryError(
        'FIND_FAILED',
        `Activity件数取得に失敗しました: ${error.message}`,
        error
      ));
    }
  }
}
```

## UseCase パターン（CQRS）

### Command/Query分離

```typescript
// application/activity/commands.ts
export interface CreateActivityCommand {
  title: string;
  category: ActivityCategory;
  priority: ActivityPriority;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  memberIds?: string[];
  location?: string;
  tags?: string[];
}

export interface UpdateActivityCommand {
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  category?: ActivityCategory;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  location?: string;
  tags?: string[];
}

export interface DeleteActivityCommand {
  id: ActivityId;
}
```

```typescript
// application/activity/queries.ts
export interface GetActivityByIdQuery {
  id: ActivityId;
}

export interface GetActivitiesQuery {
  filters?: ActivityFilters;
  sortBy?: 'createdAt' | 'updatedAt' | 'startDate' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GetActivityCountQuery {
  filters?: ActivityFilters;
}
```

### UseCase実装

```typescript
// application/activity/use-cases.ts
import { injectable, inject } from 'inversify';
import { Result, ok, err } from 'neverthrow';
import { ActivityRepository } from '../../domain/activity/repository';
import { Activity, ActivityId } from '../../domain/activity/types';
import { createActivity, updateActivity, completeActivity } from '../../domain/activity/operations';
import { CreateActivityCommand, UpdateActivityCommand } from './commands';
import { GetActivityByIdQuery, GetActivitiesQuery } from './queries';

@injectable()
export class ActivityUseCase {
  constructor(
    @inject('ActivityRepository') private readonly repository: ActivityRepository
  ) {}

  // Commands (書き込み操作)
  async createActivity(command: CreateActivityCommand): Promise<Result<Activity, UseCaseError>> {
    // ドメインオブジェクト作成
    const activityResult = createActivity(
      command.title,
      command.category,
      command.priority,
      {
        description: command.description,
        startDate: command.startDate,
        startTime: command.startTime,
        endDate: command.endDate,
        endTime: command.endTime,
        dueDate: command.dueDate,
        isAllDay: command.isAllDay,
        memberIds: command.memberIds,
        location: command.location,
        tags: command.tags,
      }
    );

    if (activityResult.isErr()) {
      return err(new UseCaseError(
        'DOMAIN_ERROR',
        activityResult.error.message,
        activityResult.error
      ));
    }

    // 永続化
    const saveResult = await this.repository.save(activityResult.value);
    if (saveResult.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        saveResult.error.message,
        saveResult.error
      ));
    }

    return ok(saveResult.value);
  }

  async updateActivity(id: ActivityId, command: UpdateActivityCommand): Promise<Result<Activity, UseCaseError>> {
    // 既存のActivity取得
    const findResult = await this.repository.findById(id);
    if (findResult.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        findResult.error.message,
        findResult.error
      ));
    }

    if (!findResult.value) {
      return err(new UseCaseError(
        'NOT_FOUND',
        `Activity (ID: ${id}) が見つかりません`,
      ));
    }

    // ドメインロジックで更新
    const updateResult = updateActivity(findResult.value, command);
    if (updateResult.isErr()) {
      return err(new UseCaseError(
        'DOMAIN_ERROR',
        updateResult.error.message,
        updateResult.error
      ));
    }

    // 永続化
    const saveResult = await this.repository.save(updateResult.value);
    if (saveResult.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        saveResult.error.message,
        saveResult.error
      ));
    }

    return ok(saveResult.value);
  }

  async completeActivity(id: ActivityId): Promise<Result<Activity, UseCaseError>> {
    const findResult = await this.repository.findById(id);
    if (findResult.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        findResult.error.message,
        findResult.error
      ));
    }

    if (!findResult.value) {
      return err(new UseCaseError(
        'NOT_FOUND',
        `Activity (ID: ${id}) が見つかりません`,
      ));
    }

    const completeResult = completeActivity(findResult.value);
    if (completeResult.isErr()) {
      return err(new UseCaseError(
        'DOMAIN_ERROR',
        completeResult.error.message,
        completeResult.error
      ));
    }

    const saveResult = await this.repository.save(completeResult.value);
    if (saveResult.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        saveResult.error.message,
        saveResult.error
      ));
    }

    return ok(saveResult.value);
  }

  async deleteActivity(id: ActivityId): Promise<Result<void, UseCaseError>> {
    const deleteResult = await this.repository.deleteById(id);
    if (deleteResult.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        deleteResult.error.message,
        deleteResult.error
      ));
    }

    return ok(undefined);
  }

  // Queries (読み込み操作)
  async getActivityById(query: GetActivityByIdQuery): Promise<Result<Activity | null, UseCaseError>> {
    const result = await this.repository.findById(query.id);
    if (result.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        result.error.message,
        result.error
      ));
    }

    return ok(result.value);
  }

  async getActivities(query: GetActivitiesQuery = {}): Promise<Result<Activity[], UseCaseError>> {
    let result: Result<Activity[], RepositoryError>;

    if (query.filters) {
      result = await this.repository.findByFilters(query.filters);
    } else {
      result = await this.repository.findAll();
    }

    if (result.isErr()) {
      return err(new UseCaseError(
        'REPOSITORY_ERROR',
        result.error.message,
        result.error
      ));
    }

    let activities = result.value;

    // ソート処理
    if (query.sortBy) {
      activities = this.sortActivities(activities, query.sortBy, query.sortOrder || 'desc');
    }

    // ページネーション処理
    if (query.limit !== undefined) {
      const offset = query.offset || 0;
      activities = activities.slice(offset, offset + query.limit);
    }

    return ok(activities);
  }

  async getActivityCount(query: GetActivityCountQuery = {}): Promise<Result<number, UseCaseError>> {
    if (query.filters) {
      const result = await this.repository.findByFilters(query.filters);
      if (result.isErr()) {
        return err(new UseCaseError(
          'REPOSITORY_ERROR',
          result.error.message,
          result.error
        ));
      }
      return ok(result.value.length);
    } else {
      const result = await this.repository.count();
      if (result.isErr()) {
        return err(new UseCaseError(
          'REPOSITORY_ERROR',
          result.error.message,
          result.error
        ));
      }
      return ok(result.value);
    }
  }

  private sortActivities(
    activities: Activity[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Activity[] {
    return activities.sort((a, b) => {
      let aValue: string | undefined;
      let bValue: string | undefined;

      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'updatedAt':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'startDate':
          aValue = a.startDate;
          bValue = b.startDate;
          break;
        case 'dueDate':
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        default:
          return 0;
      }

      if (!aValue && !bValue) return 0;
      if (!aValue) return sortOrder === 'asc' ? -1 : 1;
      if (!bValue) return sortOrder === 'asc' ? 1 : -1;

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

export class UseCaseError extends Error {
  constructor(
    public readonly code: UseCaseErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'UseCaseError';
  }
}

export type UseCaseErrorCode = 
  | 'DOMAIN_ERROR'
  | 'REPOSITORY_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_OPERATION';
```

## エラーハンドリングパターン

### 階層的エラー設計

```typescript
// domain/shared/errors.ts
export abstract class BaseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ドメインエラー
export class ActivityError extends BaseError {
  constructor(code: ActivityErrorCode, message: string, cause?: unknown) {
    super(code, message, cause);
  }
}

export type ActivityErrorCode = 
  | 'VALIDATION_ERROR'
  | 'INVALID_OPERATION'
  | 'BUSINESS_RULE_VIOLATION';

// バリデーションエラー
export class ValidationError extends BaseError {
  constructor(message: string, public readonly field?: string) {
    super('VALIDATION_ERROR', message);
  }
}

// インフラストラクチャエラー
export class RepositoryError extends BaseError {
  constructor(code: RepositoryErrorCode, message: string, cause?: unknown) {
    super(code, message, cause);
  }
}

export type RepositoryErrorCode = 
  | 'SAVE_FAILED'
  | 'FIND_FAILED'
  | 'DELETE_FAILED'
  | 'CONNECTION_ERROR'
  | 'CONSTRAINT_VIOLATION';

// アプリケーションエラー
export class UseCaseError extends BaseError {
  constructor(code: UseCaseErrorCode, message: string, cause?: unknown) {
    super(code, message, cause);
  }
}

export type UseCaseErrorCode = 
  | 'DOMAIN_ERROR'
  | 'REPOSITORY_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_OPERATION';
```

### Result型活用パターン

```typescript
// lib/utils/result-helpers.ts
import { Result, ok, err } from 'neverthrow';

// Result型の合成
export const combineResults = <T1, T2, E>(
  result1: Result<T1, E>,
  result2: Result<T2, E>
): Result<[T1, T2], E> => {
  if (result1.isErr()) return err(result1.error);
  if (result2.isErr()) return err(result2.error);
  return ok([result1.value, result2.value]);
};

// 複数のResult型の処理
export const collectResults = <T, E>(
  results: Result<T, E>[]
): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (result.isErr()) {
      return err(result.error);
    }
    values.push(result.value);
  }
  return ok(values);
};

// エラーメッセージの日本語化
export const localizeError = (error: BaseError): string => {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return `入力値エラー: ${error.message}`;
    case 'NOT_FOUND':
      return `データが見つかりません: ${error.message}`;
    case 'SAVE_FAILED':
      return `保存に失敗しました: ${error.message}`;
    case 'FIND_FAILED':
      return `検索に失敗しました: ${error.message}`;
    case 'DELETE_FAILED':
      return `削除に失敗しました: ${error.message}`;
    default:
      return error.message;
  }
};
```

## DIコンテナパターン

### 依存性の定義

```typescript
// infrastructure/di/types.ts
export const TYPES = {
  // Repositories
  ActivityRepository: Symbol.for('ActivityRepository'),
  FamilyMemberRepository: Symbol.for('FamilyMemberRepository'),
  
  // UseCases
  ActivityUseCase: Symbol.for('ActivityUseCase'),
  FamilyMemberUseCase: Symbol.for('FamilyMemberUseCase'),
  
  // Services
  NotificationService: Symbol.for('NotificationService'),
  OCRService: Symbol.for('OCRService'),
} as const;
```

### コンテナ設定

```typescript
// infrastructure/di/bindings.ts
import { Container } from 'inversify';
import { TYPES } from './types';

// Domain
import { ActivityRepository } from '../../domain/activity/repository';
import { FamilyMemberRepository } from '../../domain/family-member/repository';

// Infrastructure
import { DexieActivityRepository } from '../db/activity-repository';
import { DexieFamilyMemberRepository } from '../db/family-member-repository';

// Application
import { ActivityUseCase } from '../../application/activity/use-cases';
import { FamilyMemberUseCase } from '../../application/family-member/use-cases';

export const setupContainer = (): Container => {
  const container = new Container();

  // Repository層 - Singleton
  container.bind<ActivityRepository>(TYPES.ActivityRepository)
    .to(DexieActivityRepository)
    .inSingletonScope();

  container.bind<FamilyMemberRepository>(TYPES.FamilyMemberRepository)
    .to(DexieFamilyMemberRepository)
    .inSingletonScope();

  // UseCase層 - Transient
  container.bind<ActivityUseCase>(TYPES.ActivityUseCase)
    .to(ActivityUseCase)
    .inTransientScope();

  container.bind<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase)
    .to(FamilyMemberUseCase)
    .inTransientScope();

  return container;
};
```

### コンテナ利用パターン

```typescript
// lib/store/container.ts
import { Container } from 'inversify';
import { setupContainer } from '../../infrastructure/di/bindings';

let _container: Container | null = null;

export const getInitializedContainer = (): Container => {
  if (!_container) {
    _container = setupContainer();
  }
  return _container;
};

export const resetContainer = (): void => {
  _container = null;
};

// テスト用コンテナ
export const createTestContainer = (): Container => {
  return setupContainer();
};
```

## Zustandストア統合パターン

### 型安全なストア設計

```typescript
// lib/store/activity-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Activity, ActivityId } from '../../domain/activity/types';
import { ActivityFilters } from '../../domain/activity/filters';
import { CreateActivityCommand, UpdateActivityCommand } from '../../application/activity/commands';
import { ActivityUseCase } from '../../application/activity/use-cases';
import { getInitializedContainer } from './container';
import { TYPES } from '../../infrastructure/di/types';

interface ActivityStore {
  // State
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  filters: ActivityFilters;
  
  // Actions
  loadAllActivities: () => Promise<void>;
  createActivity: (command: CreateActivityCommand) => Promise<void>;
  updateActivity: (id: ActivityId, command: UpdateActivityCommand) => Promise<void>;
  deleteActivity: (id: ActivityId) => Promise<void>;
  completeActivity: (id: ActivityId) => Promise<void>;
  
  // Filtering
  setFilter: <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => void;
  clearFilter: (key: keyof ActivityFilters) => void;
  resetFilters: () => void;
  getFilteredActivities: () => Activity[];
  
  // State management
  clearError: () => void;
  reset: () => void;
}

const defaultFilters: ActivityFilters = {
  showCompleted: true,
};

export const useActivityStore = create<ActivityStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activities: [],
    isLoading: false,
    error: null,
    filters: defaultFilters,

    // Actions
    loadAllActivities: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const container = getInitializedContainer();
        const useCase = container.get<ActivityUseCase>(TYPES.ActivityUseCase);
        
        const result = await useCase.getActivities();
        
        if (result.isOk()) {
          set({ activities: result.value, isLoading: false });
        } else {
          set({ 
            error: `Activity読み込みに失敗しました: ${result.error.message}`, 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: `予期しないエラーが発生しました: ${error.message}`, 
          isLoading: false 
        });
      }
    },

    createActivity: async (command: CreateActivityCommand) => {
      set({ isLoading: true, error: null });
      
      try {
        const container = getInitializedContainer();
        const useCase = container.get<ActivityUseCase>(TYPES.ActivityUseCase);
        
        const result = await useCase.createActivity(command);
        
        if (result.isOk()) {
          const currentActivities = get().activities;
          set({ 
            activities: [result.value, ...currentActivities], 
            isLoading: false 
          });
        } else {
          set({ 
            error: `Activity作成に失敗しました: ${result.error.message}`, 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: `予期しないエラーが発生しました: ${error.message}`, 
          isLoading: false 
        });
      }
    },

    updateActivity: async (id: ActivityId, command: UpdateActivityCommand) => {
      set({ isLoading: true, error: null });
      
      try {
        const container = getInitializedContainer();
        const useCase = container.get<ActivityUseCase>(TYPES.ActivityUseCase);
        
        const result = await useCase.updateActivity(id, command);
        
        if (result.isOk()) {
          const currentActivities = get().activities;
          const updatedActivities = currentActivities.map(activity =>
            activity.id === id ? result.value : activity
          );
          set({ activities: updatedActivities, isLoading: false });
        } else {
          set({ 
            error: `Activity更新に失敗しました: ${result.error.message}`, 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: `予期しないエラーが発生しました: ${error.message}`, 
          isLoading: false 
        });
      }
    },

    deleteActivity: async (id: ActivityId) => {
      set({ isLoading: true, error: null });
      
      try {
        const container = getInitializedContainer();
        const useCase = container.get<ActivityUseCase>(TYPES.ActivityUseCase);
        
        const result = await useCase.deleteActivity(id);
        
        if (result.isOk()) {
          const currentActivities = get().activities;
          const filteredActivities = currentActivities.filter(activity => activity.id !== id);
          set({ activities: filteredActivities, isLoading: false });
        } else {
          set({ 
            error: `Activity削除に失敗しました: ${result.error.message}`, 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: `予期しないエラーが発生しました: ${error.message}`, 
          isLoading: false 
        });
      }
    },

    completeActivity: async (id: ActivityId) => {
      set({ isLoading: true, error: null });
      
      try {
        const container = getInitializedContainer();
        const useCase = container.get<ActivityUseCase>(TYPES.ActivityUseCase);
        
        const result = await useCase.completeActivity(id);
        
        if (result.isOk()) {
          const currentActivities = get().activities;
          const updatedActivities = currentActivities.map(activity =>
            activity.id === id ? result.value : activity
          );
          set({ activities: updatedActivities, isLoading: false });
        } else {
          set({ 
            error: `Activity完了に失敗しました: ${result.error.message}`, 
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: `予期しないエラーが発生しました: ${error.message}`, 
          isLoading: false 
        });
      }
    },

    // Filtering
    setFilter: (key, value) => {
      set(state => ({
        filters: { ...state.filters, [key]: value }
      }));
    },

    clearFilter: (key) => {
      set(state => {
        const newFilters = { ...state.filters };
        delete newFilters[key];
        return { filters: newFilters };
      });
    },

    resetFilters: () => {
      set({ filters: defaultFilters });
    },

    getFilteredActivities: () => {
      const { activities, filters } = get();
      return filterActivities(activities, filters);
    },

    // State management
    clearError: () => {
      set({ error: null });
    },

    reset: () => {
      set({
        activities: [],
        isLoading: false,
        error: null,
        filters: defaultFilters,
      });
    },
  }))
);

// フィルタリング関数
const filterActivities = (activities: Activity[], filters: ActivityFilters): Activity[] => {
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
    
    // 完了済み表示フィルター
    if (filters.showCompleted === false && activity.status === 'completed') {
      return false;
    }
    
    // その他のフィルター処理...
    
    return true;
  });
};
```

## API レスポンスパターン

### RESTful API設計（将来の外部API連携用）

```typescript
// api/types/responses.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ActivityResponse {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  isAllDay: boolean;
  memberIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  title: string;
  category: string;
  priority: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  isAllDay?: boolean;
  memberIds?: string[];
  location?: string;
  tags?: string[];
}
```

## 関連ドキュメント

- [アーキテクチャ詳細](/docs/architecture.md) - 全体設計と技術スタック
- [ドメインモデル](/docs/domain-models.md) - 統一Activityドメインの詳細仕様
- [テスト戦略](/docs/testing.md) - TDD実践ガイド