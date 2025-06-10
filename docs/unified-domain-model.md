# 統一ドメインモデル提案

## 概要
CalendarEventとTaskを統合し、単一のドメインエンティティ「Activity」を提案します。

## 統一モデル: Activity

```typescript
type Activity = Readonly<{
  id: ActivityId;
  title: ActivityTitle;
  description?: string;
  
  // 時間・日付
  startDate?: DateString;
  startTime?: TimeString;
  endDate?: DateString;
  endTime?: TimeString;
  dueDate?: DateString;
  isAllDay: boolean;
  
  // 分類・状態
  category: ActivityCategory; // 'event' | 'task' | 'appointment' | 'deadline' | 'meeting'
  status: ActivityStatus; // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: Priority; // 'high' | 'medium' | 'low'
  
  // 人・場所
  memberIds: ReadonlyArray<MemberId>;
  location?: string;
  
  // タスク機能
  checklist: ReadonlyArray<ChecklistItem>;
  completedAt?: DateString;
  
  // メタデータ
  createdAt: DateString;
  updatedAt: DateString;
  tags: ReadonlyArray<string>;
  attachments: ReadonlyArray<Attachment>;
  
  // 繰り返し
  recurrence?: RecurrencePattern;
}>;
```

## ビューによる表示制御

### カレンダービュー
- 日付/時間でフィルタ・ソート
- タイムライン表示
- `startDate`、`dueDate`を重視

### タスクビュー  
- status='pending'でフィルタ
- priority順でソート
- checklistを強調表示

### アジェンダビュー
- 時系列順
- 今日・明日・今週の分類

### メンバービュー
- memberIdでフィルタ
- 個人の責任を明確化

## メリット

### ユーザー体験
1. **一元管理**: すべてを一箇所で管理
2. **自然な分類**: ユーザーの直感に合う
3. **柔軟性**: 同じデータを複数の視点で表示

### 技術的メリット
1. **シンプル**: 単一のドメインモデル
2. **一貫性**: データの重複なし
3. **拡張性**: 新しいビューを簡単に追加

### 将来性
1. **AIとの相性**: 統一データでパターン認識
2. **自動分類**: カテゴリの自動提案
3. **スマート通知**: 文脈に応じた通知

## 実装フェーズ

### Phase 1: ドメイン設計
- 統一Activity型の定義
- 移行戦略の策定

### Phase 2: インフラ更新
- Repository統合
- データマイグレーション

### Phase 3: アプリケーション層
- UseCase統合
- Store統合

### Phase 4: UI更新
- 統一されたフォーム
- 柔軟な表示切り替え

## 結論
この統合により、Sharendarは真に家族にとって直感的で使いやすいアプリになります。