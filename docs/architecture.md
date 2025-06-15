# アーキテクチャ詳細

このドキュメントでは、SharendarのClean Architecture + 関数型ドメインモデリング設計について詳しく説明します。

## 設計思想

### 核となる原則

1. **純粋関数**: 副作用を分離し、ビジネスロジックを純粋に保つ
2. **イミュータブル**: すべてのデータ構造を不変に
3. **型安全**: Brand型で実行時エラーを防ぐ
4. **エラーハンドリング**: Result型（neverthrow）でエラーを値として扱う
5. **依存性注入**: InversifyJSによるDIコンテナ
6. **オフラインファースト**: IndexedDB (Dexie.js)によるローカルストレージ
7. **TDD駆動開発**: テストファースト開発により高品質を保証

### 技術スタック

```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript (strict mode)",
  "styling": "Tailwind CSS",
  "database": "IndexedDB (Dexie.js)",
  "state": "Zustand with subscribeWithSelector",
  "di": "InversifyJS + reflect-metadata",
  "testing": "Vitest + React Testing Library + fake-indexeddb",
  "errors": "neverthrow (Result型)",
  "icons": "Lucide React",
  "dates": "date-fns"
}
```

## レイヤード・アーキテクチャ

### 全体構造

```
┌─────────────────────────────────────────────────────────┐
│                    UI層 (app/, components/)              │
│  - Next.js App Router pages                             │
│  - React Components (ActivityCard, ActivityForm)         │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│                 Store層 (lib/store/)                     │
│  - Zustand stores (ActivityStore, FamilyMemberStore)    │
│  - DIコンテナ初期化                                      │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│             Application層 (application/)                 │
│  - Use Cases (ActivityUseCase, FamilyMemberUseCase)     │
│  - Commands/Queries (CQRS pattern)                      │
│  - Domain serviceの調整                                  │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│                Domain層 (domain/)                        │
│  - 純粋なビジネスロジック                                │
│  - 型定義 (Activity, FamilyMember)                      │
│  - Domain operations (純粋関数)                         │
│  - Validations                                          │
│  - Repository interfaces                                │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│            Infrastructure層 (infrastructure/)            │
│  - Repository実装 (DexieActivityRepository)             │
│  - DIコンテナ設定 (bindings.ts)                         │
│  - 外部サービス連携                                      │
└─────────────────────────────────────────────────────────┘
```

### データフロー

```
UI Component (onClick) 
    ↓
Zustand Store (createActivity)
    ↓
DI Container (get ActivityUseCase)
    ↓
Application UseCase (validate & coordinate)
    ↓
Domain Operations (pure functions)
    ↓
Infrastructure Repository (IndexedDB save)
    ↓
Store State Update
    ↓
UI Re-render
```

## ディレクトリ構造

### 詳細構造

```
/src/
├── app/                        # Next.js App Router
│   ├── calendar/
│   │   ├── page.tsx           # カレンダーページ
│   │   └── components/        # カレンダー専用コンポーネント
│   │       ├── CalendarFilter.tsx
│   │       └── MonthView.tsx
│   ├── tasks/
│   │   ├── page.tsx           # タスクページ
│   │   └── components/        # タスク専用コンポーネント
│   │       └── TaskFilter.tsx
│   └── layout.tsx             # 共通レイアウト
│
├── components/                 # 共通UIコンポーネント
│   ├── activity/              # Activity関連コンポーネント
│   │   ├── ActivityCard.tsx   # Activity表示カード
│   │   └── ActivityForm.tsx   # Activity作成/編集フォーム
│   └── shared/                # 汎用コンポーネント
│
├── domain/                    # ドメイン層
│   ├── activity/              # 統一Activityドメイン
│   │   ├── types.ts          # Activity型定義、カテゴリ、ステータス等
│   │   ├── operations.ts     # createActivity, updateActivity等の純粋関数
│   │   ├── validations.ts    # バリデーションロジック
│   │   └── repository.ts     # ActivityRepositoryインターフェース
│   ├── family-member/         # 家族メンバードメイン
│   └── shared/                # 共通ドメイン要素
│       └── branded-types.ts   # Brand型定義
│
├── application/               # アプリケーション層
│   ├── activity/              # Activity業務ロジック
│   │   ├── use-cases.ts      # ActivityUseCase (CQRS)
│   │   ├── commands.ts       # CreateActivityCommand等
│   │   └── queries.ts        # GetActivityByIdQuery等
│   └── family-member/         # 家族メンバー業務ロジック
│
├── infrastructure/            # インフラストラクチャ層
│   ├── db/                    # データベース関連
│   │   ├── activity-repository.ts  # Dexie実装
│   │   └── schema.ts         # DBスキーマ定義
│   └── di/                    # 依存性注入
│       └── bindings.ts       # DIコンテナ設定
│
└── lib/                       # ライブラリ・ユーティリティ
    ├── store/                 # 状態管理
    │   ├── activity-store.ts  # Zustand Activityストア
    │   ├── family-member-store.ts
    │   └── container.ts       # DIコンテナ初期化
    └── utils/                 # ユーティリティ関数
```

## DIコンテナ設計

### 設定パターン

```typescript
// infrastructure/di/bindings.ts
import { Container } from 'inversify';
import { ActivityRepository } from '../../domain/activity/repository';
import { DexieActivityRepository } from '../db/activity-repository';
import { ActivityUseCase } from '../../application/activity/use-cases';

export const setupContainer = (): Container => {
  const container = new Container();
  
  // Repository層 - Singleton
  container.bind<ActivityRepository>('ActivityRepository')
    .to(DexieActivityRepository)
    .inSingletonScope();
  
  // UseCase層 - Transient
  container.bind<ActivityUseCase>('ActivityUseCase')
    .to(ActivityUseCase)
    .inTransientScope();
  
  return container;
};
```

### 使用パターン

```typescript
// lib/store/container.ts
let _container: Container | null = null;

export const getInitializedContainer = (): Container => {
  if (!_container) {
    _container = setupContainer();
  }
  return _container;
};

// Store内での使用
const container = getInitializedContainer();
const activityUseCase = container.get<ActivityUseCase>('ActivityUseCase');
```

## 状態管理設計

### Zustandパターン

```typescript
// lib/store/activity-store.ts
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
  
  // Filtering
  setFilter: <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => void;
  clearFilter: (key: keyof ActivityFilters) => void;
  resetFilters: () => void;
  getFilteredActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>()(
  subscribeWithSelector((set, get) => ({
    // State初期値
    activities: [],
    isLoading: false,
    error: null,
    filters: defaultFilters,
    
    // Actions実装
    loadAllActivities: async () => {
      set({ isLoading: true, error: null });
      
      const container = getInitializedContainer();
      const useCase = container.get<ActivityUseCase>('ActivityUseCase');
      
      const result = await useCase.getAllActivities();
      
      if (result.isOk()) {
        set({ activities: result.value, isLoading: false });
      } else {
        set({ error: result.error.message, isLoading: false });
      }
    },
    
    // その他のアクション...
  }))
);
```

## エラーハンドリング設計

### Result型パターン

```typescript
// neverthrowを使用したエラーハンドリング
import { Result, ok, err } from 'neverthrow';

// ドメイン操作
export const createActivity = (
  title: string,
  category: ActivityCategory,
  priority: ActivityPriority
): Result<Activity, ActivityError> => {
  // バリデーション
  const titleResult = validateTitle(title);
  if (titleResult.isErr()) {
    return err(titleResult.error);
  }
  
  // Activity作成
  const activity: Activity = {
    id: asActivityId(generateId()),
    title: titleResult.value,
    category,
    priority,
    status: 'pending' as ActivityStatus,
    isAllDay: false,
    checklist: [],
    memberIds: [],
    tags: [],
    createdAt: asDateString(new Date().toISOString()),
    updatedAt: asDateString(new Date().toISOString()),
  };
  
  return ok(activity);
};

// UseCase層での使用
export class ActivityUseCase {
  async createActivity(command: CreateActivityCommand): Promise<Result<Activity, ActivityError>> {
    // ドメイン操作実行
    const activityResult = createActivity(
      command.title,
      command.category,
      command.priority
    );
    
    if (activityResult.isErr()) {
      return err(activityResult.error);
    }
    
    // Repository保存
    const saveResult = await this.repository.save(activityResult.value);
    return saveResult;
  }
}
```

## 型安全性設計

### Brand型パターン

```typescript
// domain/shared/branded-types.ts
export type ActivityId = string & { readonly brand: unique symbol };
export type ActivityTitle = string & { readonly brand: unique symbol };
export type MemberId = string & { readonly brand: unique symbol };

// ファクトリ関数
export const asActivityId = (value: string): ActivityId => value as ActivityId;
export const asActivityTitle = (value: string): ActivityTitle => value as ActivityTitle;
export const asMemberId = (value: string): MemberId => value as MemberId;

// バリデーション付きファクトリ
export const createActivityTitle = (value: string): Result<ActivityTitle, ValidationError> => {
  if (!value.trim()) {
    return err(new ValidationError('タイトルは必須です'));
  }
  if (value.length > 100) {
    return err(new ValidationError('タイトルは100文字以内で入力してください'));
  }
  return ok(asActivityTitle(value));
};
```

## データベース設計

### Dexieスキーマ

```typescript
// infrastructure/db/schema.ts
import Dexie, { Table } from 'dexie';
import { Activity } from '../../domain/activity/types';

export class SharendarDB extends Dexie {
  activities!: Table<Activity>;
  familyMembers!: Table<FamilyMember>;

  constructor() {
    super('sharendar-db');
    
    this.version(1).stores({
      activities: '++id, category, status, [category+status], createdAt, updatedAt, *memberIds, *tags',
      familyMembers: '++id, name, email, createdAt'
    });
    
    this.version(2).stores({
      activities: '++id, category, status, priority, [category+status], [status+priority], createdAt, updatedAt, startDate, dueDate, *memberIds, *tags'
    }).upgrade(tx => {
      // マイグレーション処理
      return tx.activities.toCollection().modify(activity => {
        if (!activity.priority) {
          activity.priority = 'medium';
        }
      });
    });
  }
}

export const db = new SharendarDB();
```

### Repository実装パターン

```typescript
// infrastructure/db/activity-repository.ts
@injectable()
export class DexieActivityRepository implements ActivityRepository {
  async save(activity: Activity): Promise<Result<Activity, RepositoryError>> {
    try {
      await db.activities.put(activity);
      return ok(activity);
    } catch (error) {
      return err(new RepositoryError('SAVE_FAILED', error.message));
    }
  }
  
  async findById(id: ActivityId): Promise<Result<Activity | null, RepositoryError>> {
    try {
      const activity = await db.activities.get(id);
      return ok(activity || null);
    } catch (error) {
      return err(new RepositoryError('FIND_FAILED', error.message));
    }
  }
  
  async findAll(): Promise<Result<Activity[], RepositoryError>> {
    try {
      const activities = await db.activities.orderBy('createdAt').reverse().toArray();
      return ok(activities);
    } catch (error) {
      return err(new RepositoryError('FIND_ALL_FAILED', error.message));
    }
  }
}
```

## 関連ドキュメント

- [ドメインモデル詳細](/docs/domain-models.md) - 統一Activityドメインの詳細仕様
- [API設計パターン](/docs/api-patterns.md) - Repository, UseCase, Error handling patterns
- [テスト戦略](/docs/testing.md) - TDD実践ガイド