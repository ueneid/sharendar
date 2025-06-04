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

### Task 2: 家族メンバー管理のユースケース実装

#### ファイル構成
```
/application/family/
  ├── use-cases.ts       # ユースケース実装
  ├── queries.ts         # クエリ操作
  └── commands.ts        # コマンド操作
```

#### ユースケース設計
- `createFamilyMember`: メンバー作成
- `updateFamilyMember`: メンバー更新
- `deleteFamilyMember`: メンバー削除
- `getAllFamilyMembers`: 全メンバー取得

#### 技術要件
- Domain層の純粋関数を活用
- Infrastructure層のRepositoryを使用
- Result型によるエラーハンドリング
- 依存性注入によるテスタビリティ確保

---

### Task 3: カレンダー・タスクのユースケース実装

#### ファイル構成
```
/application/calendar/
  ├── use-cases.ts       # カレンダーユースケース
  ├── queries.ts         # クエリ操作
  └── commands.ts        # コマンド操作

/application/tasks/
  ├── use-cases.ts       # タスクユースケース
  ├── queries.ts         # クエリ操作
  └── commands.ts        # コマンド操作
```

#### ユースケース設計
**Calendar**:
- `createCalendarEvent`: イベント作成
- `updateCalendarEvent`: イベント更新
- `deleteCalendarEvent`: イベント削除
- `getEventsByDateRange`: 期間指定検索

**Tasks**:
- `createTask`: タスク作成
- `updateTask`: タスク更新
- `completeTask`: タスク完了
- `addChecklistItem`: チェックリストアイテム追加

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