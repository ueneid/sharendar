# タスク詳細書

各実装タスクの詳細な技術仕様と実装ガイドです。

## Phase 1: Infrastructure層

### ✅ Task 1: IndexedDB (Dexie.js) のセットアップとスキーマ定義 **完了**

#### ファイル構成
```
/infrastructure/db/
  ├── schema.ts        # ✅ DBスキーマ定義
  ├── repository.ts    # ✅ Repository実装
  
/__tests__/infrastructure/db/
  ├── schema.test.ts      # ✅ スキーマテスト
  └── repository.test.ts  # ✅ Repositoryテスト

/vitest.config.ts        # ✅ テスト環境設定
/test-setup.ts          # ✅ fake-indexeddb設定
```

#### 技術要件
- ✅ Dexie.js v4.0.0+
- ✅ TypeScript strict mode対応
- ✅ neverthrow Result型でのエラーハンドリング
- ✅ Brand型との統合
- ✅ Vitest + fake-indexeddb テスト環境

#### 実装詳細
```typescript
// ✅ 実装済み: schema.ts の基本構造
export class SharendarDB extends Dexie {
  familyMembers!: Table<FamilyMemberDTO>;
  calendarEvents!: Table<CalendarEventDTO>;
  tasks!: Table<TaskDTO>;
  
  constructor() {
    super('SharendarDB');
    this.version(1).stores({
      familyMembers: 'id, name, color',
      calendarEvents: 'id, date, *memberIds',
      tasks: 'id, status, dueDate, *memberIds'
    });
  }
}
```

#### 完了した成果物
- ✅ 型安全なDB操作インターフェース
- ✅ Domain ↔ DTO 変換機能
- ✅ エラーハンドリング付きRepository (FamilyMemberRepository, CalendarEventRepository, TaskRepository)
- ✅ 包括的テストスイート (20テスト全通過)
- ✅ 開発環境でのサンプルデータ自動追加

---

## Phase 2: Application層

### ✅ Task 2: 家族メンバー管理のユースケース実装 **完了**

#### ファイル構成
```
/domain/family/
  ├── types.ts           # ✅ Brand型・Value Objects
  ├── repository.ts      # ✅ Repository Interface
  ├── operations.ts      # ✅ ドメイン操作
  └── validations.ts     # ✅ バリデーション

/application/family/
  ├── commands.ts        # ✅ コマンド定義
  ├── queries.ts         # ✅ クエリ定義
  ├── use-cases.ts       # ✅ FamilyMemberUseCase (@injectable)
  └── index.ts           # ✅ DIコンテナ統合

/application/shared/
  ├── types.ts           # ✅ DIシンボル定義
  └── container.ts       # ✅ DIコンテナ作成

/infrastructure/di/
  ├── bindings.ts        # ✅ バインディング設定
  └── container.ts       # ✅ コンテナ初期化

/__tests__/application/family/
  └── use-cases.test.ts  # ✅ 43テスト実装済み
```

#### 実装済みユースケース
- ✅ `createMember`: メンバー作成（バリデーション付き）
- ✅ `updateMember`: メンバー更新（部分更新対応）
- ✅ `deleteMember`: メンバー削除（存在チェック付き）
- ✅ `getAllMembers`: 全メンバー取得
- ✅ `getMemberById`: ID指定取得
- ✅ `getMemberCount`: メンバー数取得
- ✅ `memberExists`: 存在確認

#### 実装済み技術要件
- ✅ 完全な依存性逆転原則(DIP)実装
- ✅ InversifyJSでの依存性注入(DI)
- ✅ Domain層の純粋関数活用
- ✅ Result型によるエラーハンドリング
- ✅ CQRSパターン実装
- ✅ 高いテスタビリティ確保

#### 測定済みアーキテクチャ品質
- ✅ Application層がInfrastructure層に直接依存しない
- ✅ DIシンボルはApplication層で管理（Domain層の純粋性保持）
- ✅ テスト環境でのモック注入対応
- ✅ 本番環境でのDIコンテナ使用

---

### ✅ Task 3: カレンダー・タスクのユースケース実装 **完了**

#### ファイル構成
```
/domain/calendar/
  ├── types.ts           # ✅ イベント関連型定義
  ├── repository.ts      # ✅ Calendar Repository Interface
  ├── operations.ts      # ✅ カレンダー操作（拡張完了）
  └── validations.ts     # ✅ カレンダーバリデーション

/domain/tasks/
  ├── types.ts           # ✅ タスク関連型定義
  ├── repository.ts      # ✅ Task Repository Interface
  ├── operations.ts      # ✅ タスク操作（拡張完了）
  └── validations.ts     # ✅ タスクバリデーション（拡張完了）

/application/calendar/
  ├── commands.ts        # ✅ コマンド定義（CRUD操作完備）
  ├── queries.ts         # ✅ クエリ定義（検索・フィルタリング）
  ├── use-cases.ts       # ✅ CalendarEventUseCase (@injectable)
  └── index.ts           # ✅ DIコンテナ統合

/application/tasks/
  ├── commands.ts        # ✅ コマンド定義（CRUD + チェックリスト操作）
  ├── queries.ts         # ✅ クエリ定義（検索・統計・フィルタリング）
  ├── use-cases.ts       # ✅ TaskUseCase (@injectable)
  └── index.ts           # ✅ DIコンテナ統合

/infrastructure/db/
  └── repository.ts      # ✅ Calendar/Task Repository実装完了

/infrastructure/di/
  └── bindings.ts        # ✅ Calendar/Tasks DIバインディング追加
```

#### 実装済みユースケース
**Calendar UseCase**:
- ✅ `createEvent`: イベント作成（メンバー割当て・時間設定）
- ✅ `updateEvent`: イベント更新（部分更新・時間クリア対応）
- ✅ `deleteEvent`: イベント削除（存在チェック付き）
- ✅ `getEventsByDate`: 日付指定検索
- ✅ `getEventsByDateRange`: 期間指定検索
- ✅ `getEventsByMemberId`: メンバー別イベント取得
- ✅ `getEventsByMonth`: 月別イベント取得
- ✅ `getTodaysEvents`: 今日のイベント取得
- ✅ `getThisWeeksEvents`: 今週のイベント取得

**Task UseCase**:
- ✅ `createTask`: タスク作成（チェックリスト・優先度・期限設定）
- ✅ `updateTask`: タスク更新（部分更新・期限クリア対応）
- ✅ `completeTask`: タスク完了処理（完了日時記録）
- ✅ `reopenTask`: タスク再開処理
- ✅ `deleteTask`: タスク削除（存在チェック付き）
- ✅ `addChecklistItem`: チェックリストアイテム追加
- ✅ `updateChecklistItem`: チェックリストアイテム更新
- ✅ `toggleChecklistItem`: チェック状態切り替え
- ✅ `removeChecklistItem`: チェックリストアイテム削除
- ✅ `getTasksByStatus`: ステータス別タスク取得
- ✅ `getTasksByMemberId`: メンバー別タスク取得
- ✅ `getTasksByPriority`: 優先度別タスク取得
- ✅ `getOverdueTasks`: 期限切れタスク取得
- ✅ `getTodaysTasks`: 今日期限のタスク取得
- ✅ `getThisWeeksTasks`: 今週期限のタスク取得
- ✅ `getTaskStatistics`: タスク統計情報取得

#### 実装済み技術要件
- ✅ 家族メンバー管理と同様のクリーンアーキテクチャ実装
- ✅ InversifyJSでの依存性注入（3ドメイン統一）
- ✅ Result型によるエラーハンドリング
- ✅ CQRSパターンとRepository Pattern
- ✅ Infrastructure層での完全なCRUD実装
- ✅ 日付・期間・メンバー・ステータス別検索機能
- ✅ TypeScript型安全性確保（エラーゼロ）
- ✅ 全テスト通過確認（43/43テスト）

#### 完了した成果物
- ✅ 3つのドメイン（Family、Calendar、Tasks）でのクリーンアーキテクチャ統一
- ✅ 包括的なCQRS実装（Commands/Queries分離）
- ✅ 高度な検索・フィルタリング機能
- ✅ チェックリスト機能完全実装
- ✅ 統計・集計機能実装
- ✅ Repository Pattern完全実装

---

## Phase 3: UI層

### ✅ Task 4: Zustand ストアの実装 **完了**

#### ファイル構成
```
/lib/store/
  ├── index.ts           # ✅ メインストア統合・セレクター集約
  ├── family-store.ts    # ✅ 家族メンバーストア
  ├── calendar-store.ts  # ✅ カレンダーストア
  ├── tasks-store.ts     # ✅ タスクストア
  ├── types.ts           # ✅ ストア型定義
  ├── helpers.ts         # ✅ 非同期・楽観的更新ヘルパー
  └── container.ts       # ✅ DIコンテナ統合
```

#### 実装済み状態設計
```typescript
// ✅ 実装完了
interface FamilyMemberState {
  members: readonly FamilyMember[];
  selectedMemberId: MemberId | null;
  form: MemberForm;
  loading: boolean;
  error: string | null;
}

interface CalendarState {
  events: readonly CalendarEvent[];
  selectedDate: DateString | null;
  view: CalendarView;
  filter: EventFilter;
  form: EventForm;
  loading: boolean;
  error: string | null;
}

interface TaskState {
  tasks: readonly Task[];
  filter: TaskFilter;
  form: TaskForm;
  loading: boolean;
  error: string | null;
}
```

#### ✅ 完了した成果物
- **Application層との統合**: モック実装で動作確認可能
- **楽観的UI更新**: リアルタイムレスポンス
- **エラー状態管理**: 統一されたエラーハンドリング
- **型安全性**: 完全なTypeScript型チェック通過
- **セレクター**: パフォーマンス最適化済み

---

### ✅ Task 5: 設定画面 (/settings) の実装 **完了**

#### ファイル構成
```
/app/settings/
  ├── page.tsx                    # ✅ メイン設定画面
  └── components/
      ├── MemberList.tsx         # ✅ メンバー一覧・編集・削除
      └── MemberForm.tsx         # ✅ メンバー追加・編集フォーム
```

#### ✅ 実装済み機能
- **レスポンシブデザイン**: デスクトップ・モバイル対応
- **バリデーションエラー表示**: リアルタイムバリデーション
- **楽観的UI更新**: 即座に反映される操作感
- **操作フィードバック**: 成功・エラー状態の明確な表示
- **カラーピッカー**: プリセットカラーでの選択
- **確認ダイアログ**: 削除操作の安全性確保

---

### ✅ Task 6: カレンダーコンポーネントのリファクタリング **完了**

#### 実装済み内容
- **新アーキテクチャ対応**: Domain/Application層との完全統合
- **Zustandストア統合**: `/app/calendar/page.tsx`完全リライト
- **パフォーマンス最適化**: React.memo、useMemo活用
- **アクセシビリティ改善**: キーボードナビゲーション・ARIA属性

#### ✅ 完了したコンポーネント
```
/app/calendar/components/
  ├── MonthView.tsx         # ✅ レスポンシブ月表示カレンダー
  ├── EventForm.tsx         # ✅ モーダル式イベント作成・編集
  ├── EventCard.tsx         # ✅ イベント詳細カード・アクション
  └── CalendarFilter.tsx    # ✅ 詳細フィルタリング
```

---

### ✅ Task 7: カレンダーイベント作成・編集機能 **完了**

#### ✅ 実装済み機能
- **モーダルベースのUI**: 直感的なイベント作成・編集
- **フォームバリデーション**: 日付・タイトルの入力チェック
- **メンバー複数選択**: チェックボックス式の割り当て
- **日時入力**: HTML5 date/time入力の使いやすさ
- **楽観的更新**: 即座に反映される操作感
- **エラーハンドリング**: ユーザーフレンドリーなエラー表示

#### ✅ 技術実装
- **モーダル管理**: Zustandによる状態管理
- **型安全性**: 完全なTypeScript対応
- **レスポンシブ**: モバイル・デスクトップ対応

---

### ✅ Task 8: タスク管理機能の実装 **完了**

#### ✅ 実装済み機能拡張
- **新ドメインモデル対応**: Task型完全対応
- **詳細フィルタリング**: ステータス・優先度・担当者・期限
- **ソート機能**: 優先度・期限・作成日順
- **期限切れアラート**: 視覚的な警告表示
- **進捗表示**: チェックリスト進捗率のパーセンテージ

#### ✅ UI実装
```
/app/tasks/components/
  ├── TaskCard.tsx         # ✅ 優先度・進捗・期限切れ表示
  ├── TaskForm.tsx         # ✅ チェックリスト動的管理フォーム
  └── TaskFilter.tsx       # ✅ 詳細フィルタリング
```

---

### ✅ Task 9: チェックリスト機能の実装 **完了**

#### ✅ 実装済みインタラクション
- **アイテム追加**: Enter キー・ボタンでの追加
- **インライン編集**: 直接編集可能
- **動的管理**: 追加・削除・更新の楽観的更新
- **進捗率の視覚化**: パーセンテージ・プログレスバー

#### ✅ 技術実装
- **楽観的UI更新**: 即座に反映される操作
- **アニメーション**: スムーズなUI遷移
- **型安全性**: ChecklistItem型の完全対応

---

### ✅ Task 10: ダッシュボード (/) の実装 **完了**

#### ✅ 実装済みウィジェット
```
Dashboard Components:
  ├── 今日の予定表示        # ✅ EventCard compact表示
  ├── 今日のタスク表示      # ✅ TaskCard compact表示
  ├── 統計サマリー         # ✅ メンバー数・未完了・完了タスク
  ├── 期限切れアラート      # ✅ 期限切れタスクの警告表示
  ├── 明日の予定           # ✅ 明日のイベント・タスク
  └── クイックアクション    # ✅ 各機能への直接アクセス
```

#### ✅ 完了したデータ集約
- **3ストア統合**: Family・Calendar・Tasks情報の統合表示
- **リアルタイム更新**: 各ストアの変更を即座に反映
- **パフォーマンス考慮**: セレクターでの最適化
- **レスポンシブデザイン**: モバイル・デスクトップ対応

---

## Phase 4: 統合・拡張 (次のステップ)

### Task 11: Application層実装統合

#### 統合項目
- モック実装から実際のApplication層UseCase呼び出しへ移行
- IndexedDBとの接続確立
- エラーハンドリングの実装
- パフォーマンス最適化

#### 技術実装
```typescript
// Before: モック実装
createTask: async (title, options = {}) => {
  // モックでの直接状態更新
  const newTask = { /* モックタスク */ };
  set(state => ({ tasks: [newTask, ...state.tasks] }));
}

// After: Application層統合
createTask: async (title, options = {}) => {
  const useCase = await getTaskUseCase();
  const result = await useCase.createTask({
    title,
    ...options
  });
  
  if (result.isOk()) {
    set(state => ({ tasks: [result.value, ...state.tasks] }));
  } else {
    throw new Error(result.error.message);
  }
}
```

---

### Task 12: UI層テストの追加

#### テスト構成
```
/__tests__/ui/
  ├── components/
  │   ├── calendar/          # カレンダーコンポーネントテスト
  │   ├── tasks/            # タスクコンポーネントテスト
  │   └── settings/         # 設定画面テスト
  ├── stores/               # Zustandストアテスト
  └── pages/                # ページテスト
```

#### テスト要件
- コンポーネントユニットテスト
- ストア統合テスト
- E2Eテスト（Playwright）
- アクセシビリティテスト

---

## Phase 5: 付加機能

### Task 13: データエクスポート/インポート

#### ファイル形式
```json
{
  "version": "1.0.0",
  "exportedAt": "2024-03-15T10:30:00Z",
  "data": {
    "familyMembers": [...],
    "calendarEvents": [...],
    "tasks": [...]
  }
}
```

#### 実装要件
- スキーマバリデーション
- データ整合性チェック
- 段階的インポート
- エラー復旧

---

### Task 14: PWA最適化

#### 最適化項目
- Service Worker更新
- キャッシュ戦略
- Background Sync
- Push通知準備

---

### Task 15: OCR機能

#### アーキテクチャ
```
/infrastructure/ocr/
  ├── google-vision.ts     # API連携
  ├── text-parser.ts       # テキスト解析
  └── suggestion-engine.ts # 提案生成
```

#### 処理フロー
1. 画像アップロード
2. Google Vision API呼び出し
3. テキスト抽出
4. 日付・キーワード解析
5. イベント・タスク提案
6. ユーザー確認・修正
7. データ保存

---

## 共通ガイドライン

### エラーハンドリング
- すべての外部操作はResult型を返す
- ユーザーフレンドリーなエラーメッセージ
- 適切なフォールバック処理

### パフォーマンス
- React.memo, useMemo, useCallback活用
- 仮想化対応（長いリスト）
- 画像最適化

### アクセシビリティ
- キーボードナビゲーション
- スクリーンリーダー対応
- 適切なARIA属性

### テスト
- ドメインロジックのユニットテスト
- コンポーネントテスト
- インテグレーションテスト

---

## 🎉 MVP完成状況

### ✅ 完全実装済み（MVP Ready）

#### Infrastructure層
- **IndexedDB**: Dexie.js完全実装・20テスト通過
- **Repository Pattern**: 3ドメイン対応・型安全な操作
- **エラーハンドリング**: Result型による統一的処理

#### Application層  
- **Clean Architecture**: DI・CQRS・Repository Pattern統一実装
- **3ドメイン**: Family・Calendar・Tasks完全実装
- **43テスト**: Application層の包括的テスト
- **UseCase**: 高度な検索・フィルタリング・統計機能

#### UI層
- **Zustand**: 3ドメイン統合状態管理
- **コンポーネント**: 18個の専用UIコンポーネント
- **レスポンシブ**: モバイル・デスクトップ完全対応
- **楽観的更新**: リアルタイムUI

#### 機能
- **家族メンバー管理**: 設定画面・CRUD操作
- **カレンダー共有**: 月表示・イベント管理・フィルタリング
- **タスク管理**: チェックリスト・優先度・期限管理・期限切れアラート
- **ダッシュボード**: 統計・今日の予定・期限切れ通知

### 🔄 次のステップ

1. **Application層統合**: モック→実装接続
2. **UI層テスト**: コンポーネント・E2Eテスト
3. **PWA最適化**: Service Worker・キャッシュ戦略
4. **付加機能**: データ永続化・OCR機能