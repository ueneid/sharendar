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

### Task 4: Zustand ストアの実装

#### ファイル構成
```
/lib/store/
  ├── index.ts           # メインストア
  ├── family-store.ts    # 家族メンバーストア
  ├── calendar-store.ts  # カレンダーストア
  ├── task-store.ts      # タスクストア
  └── types.ts           # ストア型定義
```

#### 状態設計
```typescript
interface AppState {
  // 家族メンバー
  familyMembers: FamilyMember[];
  
  // カレンダー
  calendarEvents: CalendarEvent[];
  selectedDate: DateString | null;
  
  // タスク
  tasks: Task[];
  taskFilter: TaskStatus | 'all';
  
  // UI状態
  loading: boolean;
  error: string | null;
}
```

#### Application層との統合
- ユースケースを呼び出すActions
- 楽観的UI更新
- エラー状態管理

---

### Task 5: 設定画面 (/settings) の実装

#### 画面構成
```
/app/settings/
  ├── page.tsx                    # メイン設定画面
  ├── components/
  │   ├── MemberList.tsx         # メンバー一覧
  │   ├── MemberForm.tsx         # メンバー追加・編集フォーム
  │   ├── ColorPicker.tsx        # カラー選択
  │   └── AvatarPicker.tsx       # アバター選択
  └── hooks/
      └── use-family-settings.ts # 設定画面用フック
```

#### UI要件
- レスポンシブデザイン
- バリデーションエラー表示
- 楽観的UI更新
- 操作フィードバック

---

## Phase 4: 機能拡張

### Task 6: カレンダーコンポーネントのリファクタリング

#### 更新内容
- 新しいドメインモデルとの統合
- Zustandストアとの接続
- パフォーマンス最適化（React.memo使用）
- アクセシビリティ改善

#### 主要変更点
```typescript
// Before: props drilling
<Calendar events={mockEvents} />

// After: store integration
const Calendar = () => {
  const { events, selectedDate, setSelectedDate } = useCalendarStore();
  // ...
}
```

---

### Task 7: カレンダーイベント作成・編集機能

#### コンポーネント設計
```
/components/calendar/
  ├── EventModal.tsx         # イベント作成・編集モーダル
  ├── EventForm.tsx          # イベントフォーム
  ├── MemberSelector.tsx     # メンバー選択
  └── DateTimePicker.tsx     # 日時選択
```

#### 機能要件
- モーダルベースのUI
- フォームバリデーション
- メンバー複数選択
- 日時入力の使いやすさ

---

### Task 8: タスク管理機能の実装

#### 機能拡張
- 新ドメインモデル対応
- フィルタリング強化
- ソート機能
- 一括操作

#### UI改善
- ドラッグ&ドロップ
- スワイプ操作（モバイル）
- プルトゥリフレッシュ
- 無限スクロール（将来）

---

### Task 9: チェックリスト機能の実装

#### インタラクション設計
- アイテム追加（Enter キー対応）
- インライン編集
- ドラッグ&ドロップ並び替え
- 進捗率の視覚化

#### 技術実装
- React Beautiful DnD使用
- 楽観的UI更新
- アニメーション対応

---

### Task 10: ダッシュボード (/) の実装

#### ウィジェット設計
```
Dashboard/
  ├── TodayEvents.tsx      # 今日の予定
  ├── UrgentTasks.tsx      # 緊急タスク
  ├── ProgressSummary.tsx  # 進捗サマリー
  ├── QuickActions.tsx     # クイックアクション
  └── RecentActivity.tsx   # 最近の活動
```

#### データ集約
- 複数ストアからの情報統合
- リアルタイム更新
- パフォーマンス考慮

---

## Phase 5: 付加機能

### Task 11: データエクスポート/インポート

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

### Task 12: PWA最適化

#### 最適化項目
- Service Worker更新
- キャッシュ戦略
- Background Sync
- Push通知準備

---

### Task 13: OCR機能

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