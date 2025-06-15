# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sharendar は家族やグループで予定・タスク・持ち物をスムーズに共有できるモバイルファーストのWebアプリです。

### 技術的特徴
- **統一Activityドメイン**: CalendarEventとTaskを統合した単一エンティティ
- **Clean Architecture + 関数型ドメインモデリング**: 純粋関数とイミュータブルデータ
- **TDD駆動開発**: テストファーストによる高品質コード
- **PWA対応**: オフラインファースト、IndexedDBによるローカルストレージ
- **型安全**: TypeScript strict mode + Brand型による実行時エラー防止

## Key Commands

### Development

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プロダクションサーバーの起動
npm start

# 型チェック
npm run type-check

# リント
npm run lint
```

### Testing

```bash
# 全テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# テストUIを起動（ブラウザでテスト結果を確認）
npm run test:ui

# 特定のテストファイルを実行
npm test -- [ファイルパス]
# 例: npm test -- __tests__/domain/activity/types.test.ts

# テストカバレッジを確認
npm test -- --coverage
```

### Database Management

```bash
# IndexedDBをブラウザで確認
# Chrome DevTools > Application > Storage > IndexedDB > sharendar-db

# データベースをリセット（開発環境）
# ブラウザのコンソールで実行:
await db.delete()
```

## Architecture

### 設計思想
Clean Architecture + 関数型ドメインモデリング + TDDアプローチ：
- **純粋関数**：副作用を分離し、ビジネスロジックを純粋に保つ
- **イミュータブル**：すべてのデータ構造を不変に
- **型安全**：Brand型で実行時エラーを防ぐ
- **エラーハンドリング**：Result型（neverthrow）でエラーを値として扱う
- **依存性注入**：InversifyJSによるDIコンテナ
- **オフラインファースト**：IndexedDB (Dexie.js)によるローカルストレージ
- **TDD駆動開発**：テストファースト開発により高品質を保証

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

### 統一Activityドメインモデル

最近の大きな変更：CalendarEventとTaskを統一した`Activity`エンティティに移行しました。

```typescript
// 統一Activityドメイン（/domain/activity/types.ts）
type Activity = Readonly<{
  id: ActivityId;
  title: ActivityTitle;
  description?: string;
  
  // 柔軟な時間モデル
  startDate?: DateString;
  startTime?: TimeString;
  endDate?: DateString;
  endTime?: TimeString;
  dueDate?: DateString;
  isAllDay: boolean;
  
  // 分類・状態
  category: ActivityCategory; // 'event' | 'task' | 'deadline'
  status: ActivityStatus;     // 'pending' | 'completed'
  priority: ActivityPriority; // 'high' | 'medium' | 'low'
  
  // タスク機能
  checklist: ReadonlyArray<ChecklistItem>;
  completedAt?: DateString;
  
  // その他
  memberIds: ReadonlyArray<MemberId>;
  createdAt: DateString;
  updatedAt: DateString;
}>;
```

### レイヤード・アーキテクチャ

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

### 重要なディレクトリ構造

```
/domain/activity/         # 統一Activityドメイン
  types.ts               # Activity型定義、カテゴリ、ステータス等
  operations.ts          # createActivity, updateActivity等の純粋関数
  validations.ts         # バリデーションロジック
  repository.ts          # ActivityRepositoryインターフェース

/application/activity/    # Activityアプリケーション層
  use-cases.ts          # ActivityUseCase (CQRS)
  commands.ts           # CreateActivityCommand等
  queries.ts            # GetActivityByIdQuery等

/infrastructure/
  /db/
    activity-repository.ts  # Dexie実装
    schema.ts              # DBスキーマ定義
  /di/
    bindings.ts            # DIコンテナ設定

/lib/store/
  activity-store.ts        # Zustand Activityストア
  container.ts             # DIコンテナ初期化

/components/activity/      # Activity UIコンポーネント
  ActivityCard.tsx         # Activity表示カード
  ActivityForm.tsx         # Activity作成/編集フォーム
```

### DIコンテナの使用

```typescript
// DIコンテナでの依存性解決
const container = getInitializedContainer();
const activityUseCase = container.get<ActivityUseCase>('ActivityUseCase');

// ストアでの使用例
const result = await activityUseCase.createActivity(command);
if (result.isErr()) {
  set({ error: result.error.message });
}
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

## Important Patterns and Conventions

### Brand Types (型安全性)

```typescript
// すべてのIDはBrand型で定義（domain/shared/branded-types.ts）
type ActivityId = string & { readonly brand: unique symbol };
type MemberId = string & { readonly brand: unique symbol };

// 使用時は必ずas関数を通す
const id = asActivityId('activity-123');
```

### Result型によるエラーハンドリング

```typescript
// neverthrowのResult型を使用
import { Result, ok, err } from 'neverthrow';

// すべてのバリデーションはResult型を返す
const validateTitle = (title: string): Result<ActivityTitle, ActivityError> => {
  if (!title.trim()) {
    return err(new ActivityError('VALIDATION_ERROR', 'タイトルは必須です'));
  }
  return ok(asActivityTitle(title));
};
```

### テスト駆動開発 (TDD)

1. **テストファースト**: 実装前にテストを書く
2. **テストファイル配置**: `__tests__/`ディレクトリに同じ構造で配置
3. **モック**: Vitestの`vi.mock()`を使用
4. **React Testing Library**: UIコンポーネントのテスト

```typescript
// テストの例（__tests__/domain/activity/types.test.ts）
describe('Activity Domain', () => {
  it('should create a valid activity', () => {
    const result = createActivity('タイトル', 'task', 'medium');
    expect(result).toBeDefined();
    expect(result.title).toBe('タイトル');
  });
});
```

### Zustandストアパターン

```typescript
// ストアは必ずinterfaceを定義
interface ActivityStore {
  // State
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  
  // Actions (async含む)
  loadAllActivities: () => Promise<void>;
  createActivity: (command: CreateActivityCommand) => Promise<void>;
}

// subscribeWithSelectorミドルウェアを使用
export const useActivityStore = create<ActivityStore>()(
  subscribeWithSelector((set, get) => ({
    // implementation
  }))
);
```

### DIコンテナ注意点

1. **シンボルの定義**: `TYPES`オブジェクトまたは文字列リテラル
2. **スコープ**: Repository は`inSingletonScope()`、UseCase は`inTransientScope()`
3. **初期化**: `getInitializedContainer()`で自動初期化

### データベーススキーマ変更

Dexieでスキーマを変更する場合：

```typescript
// infrastructure/db/schema.ts
db.version(3).stores({
  activities: '++id, category, status, [category+status], createdAt, updatedAt'
});
```

バージョンを上げて、インデックスを追加/変更。

## Current Implementation Status

### ✅ 完了済み
- 統一Activityドメインモデル実装
- ActivityCard/ActivityForm UIコンポーネント
- カレンダー/タスクページでの統合表示
- DIコンテナによる依存性注入
- Zustandストアの実装

### 🚧 実装中
- フィルタリング機能（メンバー別、ステータス別）

### 📋 未実装
- OCR機能（Google Vision API統合）
- 通知・リマインダー機能
- データ同期（Supabase統合）
- 繰り返し予定機能

## Critical Notes

1. **CalendarEventとTaskは削除済み**: すべて`Activity`エンティティを使用
2. **DIコンテナは必須**: 直接newでインスタンス化せず、必ずDIコンテナ経由で取得
3. **Result型でエラーハンドリング**: throw/catch ではなく Result<T, E> を使用
4. **テストファースト**: 実装前に必ずテストを書く
5. **日本語UI**: エラーメッセージ、ラベル等はすべて日本語