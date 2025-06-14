# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sharendar はスマートフォンでの利用を前提とした web app です。

家族やグループで予定・タスク・持ち物をスムーズに共有できるWebアプリです。
とくに、小さなお子さんがいる家庭の日常生活で役立つ「予定管理」と「タスク共有」を強力にサポートします。

### デザインコンセプト
- **基本カラー**: 青（#0ea5e9）をメインカラーとし、信頼性と安心感を演出
- **カラーパレット**: 青系統で統一し、落ち着いた雰囲気の家族向けアプリ
- **UI/UX**: モバイルファースト、直感的で使いやすいインターフェース

### 主な登場人物（役割）
- **管理ユーザー（親など大人）**：ログイン・操作できる人。複数人可（夫婦で共同管理もOK）
- **家族メンバー（子ども含む）**：アカウントは不要。プロフィール登録だけ

### MVP（最低限プロトタイプ）のコア機能

1. **家族グループ管理**
   - 家族グループ作成
   - 大人（親）ユーザーを招待・追加

2. **家族メンバー（子ども）管理**
   - 名前、学年、写真、メモなど登録
   - 各予定・タスクの担当を子ども単位でも割り振り

3. **統一Activity管理**（CalendarEventとTaskを統合）
   - あらゆる活動（イベント、タスク、締切）を統一Activityとして管理
   - カテゴリー（event/task/deadline）で分類
   - カレンダービューとタスクビューで同じデータを異なる視点で表示
   - 優先度、ステータス、チェックリスト、担当者など包括的な属性

4. **プリントOCR機能（α版）**
   - 写真をアップロード
   - OCRで日付・イベント名・持ち物抽出（API or AI agentで開発）
   - 抽出内容をActivityとして自動登録（手修正できるUI）

5. **通知・リマインダー**（後から追加もOK）
   - 予定・タスクの前日/当日に親へ通知（メールやLINE通知など）

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

### Build and Export

```bash
# 静的エクスポート（PWA用）
npm run export
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

- **Framework**: Next.js 14 (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS
- **データストレージ**: IndexedDB (Dexie.js)
- **状態管理**: Zustand (with middleware)
- **DI Container**: InversifyJS
- **テスト**: Vitest + React Testing Library
- **エラーハンドリング**: neverthrow
- **アイコン**: Lucide React
- **日付処理**: date-fns

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

1. **UI Component** → イベント発生
2. **Store** → アクション呼び出し（例: createActivity）
3. **UseCase** → ビジネスロジック実行、バリデーション
4. **Domain** → 純粋関数でエンティティ作成/更新
5. **Repository** → IndexedDBに永続化
6. **Store** → 状態更新
7. **UI Component** → 再レンダリング

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

### 開発時の注意事項

1. **統一Activityドメイン**: CalendarEventとTaskは廃止済み。すべて`Activity`を使用
2. **日本語エラーメッセージ**: ユーザー向けメッセージは日本語で
3. **モバイルファースト**: レスポンシブデザインは必須
4. **PWA対応**: オフライン動作を考慮した実装