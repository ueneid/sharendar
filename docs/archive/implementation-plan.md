# 実装計画書

## 概要
Sharendar MVPの実装を効率的に進めるための詳細なタスク計画です。
関数型ドメインモデリングとオフラインファーストアーキテクチャに基づき、段階的に実装します。

## 実装戦略

### アプローチ
- **ボトムアップ**: Infrastructure → Domain → Application → UI
- **段階的リリース**: 基本機能から順次追加
- **早期フィードバック**: 各機能ごとに動作確認

### 技術原則
- 関数型プログラミング（純粋関数、イミュータブル）
- 型安全性（Brand型、Result型）
- 副作用の分離（Repository Pattern）
- テスタビリティの確保

## 実装タスク

### ✅ Phase 1: Infrastructure層 **完了**

#### ✅ 1. IndexedDB (Dexie.js) のセットアップとスキーマ定義 **完了**
**目的**: ローカルデータストレージの基盤構築

**詳細タスク**:
- [x] `/infrastructure/db/schema.ts` の実装
  - Dexieクラスの定義
  - テーブルスキーマの設定
  - バージョン管理
- [x] `/infrastructure/db/repository.ts` の実装
  - Repository実装クラス
  - CRUD操作のラッパー
- [x] 初期化処理とエラーハンドリング
- [x] テスト実装とVitestセットアップ

**成果物**:
- ✅ 型安全なDB操作インターフェース
- ✅ エラーハンドリング付きのRepository実装
- ✅ 包括的なテストスイート (20テスト全通過)
- ✅ fake-indexeddb使用のテスト環境

---

### ✅ Phase 2: Application層 **完了**

#### ✅ 2. 家族メンバー管理のユースケース実装 **完了**
**目的**: クリーンアーキテクチャ的なApplication層実装

**詳細タスク**:
- [x] `/domain/family/repository.ts` - Repository Interface定義
- [x] `/application/family/` ユースケース実装
  - [x] `commands.ts` - コマンド定義
  - [x] `queries.ts` - クエリ定義
  - [x] `use-cases.ts` - FamilyMemberUseCase実装
  - [x] `index.ts` - DIコンテナ統合
- [x] `/application/shared/` DI設定
  - [x] `types.ts` - DIシンボル定義
  - [x] `container.ts` - DIコンテナ作成
- [x] `/infrastructure/di/` DI実装
  - [x] `bindings.ts` - バインディング設定
  - [x] `container.ts` - コンテナ初期化
- [x] InversifyJS導入と設定
- [x] TypeScriptデコレータ設定

**成果物**:
- ✅ 完全な依存性逆転原則(DIP)的実装
- ✅ 依存性注入(DI)によるクリーンなアーキテクチャ
- ✅ 43個の統合テスト実装済み、全てパス
- ✅ CQRSパターン実装
- ✅ 高いテスタビリティと保守性

---

#### ✅ 3. カレンダー・タスクのユースケース実装 **完了**
**目的**: 各ドメインのユースケース層完成

**詳細タスク**:
- [x] `/domain/calendar/` ドメイン層実装
  - [x] `types.ts` - イベント関連型定義
  - [x] `repository.ts` - Calendar Repository Interface
  - [x] `operations.ts` - カレンダー操作（拡張）
  - [x] `validations.ts` - カレンダーバリデーション
- [x] `/domain/tasks/` ドメイン層実装
  - [x] `types.ts` - タスク関連型定義
  - [x] `repository.ts` - Task Repository Interface
  - [x] `operations.ts` - タスク操作（拡張）
  - [x] `validations.ts` - タスクバリデーション（拡張）
- [x] `/application/calendar/` ユースケース実装
  - [x] `commands.ts` - Calendar CRUD操作
  - [x] `queries.ts` - Calendar検索・フィルタリング
  - [x] `use-cases.ts` - CalendarEventUseCase
  - [x] `index.ts` - エクスポート集約
- [x] `/application/tasks/` ユースケース実装
  - [x] `commands.ts` - Task CRUD + チェックリスト操作
  - [x] `queries.ts` - Task検索・統計・フィルタリング
  - [x] `use-cases.ts` - TaskUseCase
  - [x] `index.ts` - エクスポート集約
- [x] `/infrastructure/db/repository.ts` - Calendar/Task Repository実装
- [x] `/infrastructure/di/bindings.ts` - Calendar/Tasks DIバインディング
- [x] `/application/shared/types.ts` - Calendar/Tasks DIシンボル追加
- [x] TypeScript型エラー修正完了
- [x] 全テスト通過確認（43/43テスト）

**成果物**:
- ✅ 完全なApplication層（3ドメイン統一）
- ✅ 包括的なCQRS実装（Commands/Queries分離）
- ✅ ドメインロジックの活用（純粋関数による操作）
- ✅ クリーンアーキテクチャ的な実装
- ✅ 高度な検索・フィルタリング機能
- ✅ チェックリスト機能完全実装
- ✅ 統計・集計機能実装

---

### ✅ Phase 3: UI層 **完了**

#### ✅ 4. Zustand ストアの実装 **完了**
**目的**: UI層での状態管理基盤構築

**詳細タスク**:
- [x] `/lib/store/index.ts` の実装
  - ストア構造の設計と各ドメインストア統合
  - セレクター・ヘルパー関数の集約
- [x] `/lib/store/family-store.ts` 
  - 家族メンバー状態管理
  - Application層との接続（モック実装）
- [x] `/lib/store/calendar-store.ts`
  - カレンダーイベント状態管理
  - 月表示・フィルタリング機能
- [x] `/lib/store/tasks-store.ts`
  - タスク状態管理
  - 詳細フィルタリング・期限切れ検知
- [x] React統合とProvider設定 (`DIProvider`)
- [x] 非同期操作・エラーハンドリング・楽観的更新

**成果物**:
- ✅ 型安全なグローバル状態管理
- ✅ 3ドメイン統合Zustandストア
- ✅ Application層との接続インターフェース

---

#### ✅ 5. 設定画面 (/settings) の実装 **完了**
**目的**: 家族メンバー管理のUI実装

**詳細タスク**:
- [x] `/app/settings/page.tsx` の実装
  - レスポンシブレイアウト
  - メンバーリスト表示
- [x] `/app/settings/components/MemberForm.tsx`
  - バリデーション付きフォーム
  - カラーピッカー・アバター選択
- [x] `/app/settings/components/MemberList.tsx`
  - 編集・削除機能
  - 確認ダイアログ
- [x] 操作フィードバック (成功/エラー表示)
- [x] レスポンシブデザイン・アクセシビリティ対応

**成果物**:
- ✅ 完全な家族メンバー管理UI
- ✅ バリデーション付きフォーム
- ✅ 直感的な操作インターフェース

---

#### ✅ 6. カレンダーコンポーネントのリファクタリング **完了**
**目的**: 既存コンポーネントの新アーキテクチャ対応

**詳細タスク**:
- [x] `/app/calendar/page.tsx` の完全リライト
  - 新しいドメインモデル対応
  - Zustandストア統合
- [x] `/app/calendar/components/` 新規実装
  - `MonthView.tsx` - レスポンシブ月表示カレンダー
  - `EventForm.tsx` - モーダル式イベント作成・編集
  - `EventCard.tsx` - イベント詳細カード
  - `CalendarFilter.tsx` - 詳細フィルタリング
- [x] パフォーマンス最適化・型安全性向上

**成果物**:
- ✅ 新アーキテクチャ準拠のカレンダー
- ✅ リアクティブなイベント表示
- ✅ レスポンシブデザイン

---

#### ✅ 7. カレンダーイベント作成・編集機能 **完了**
**目的**: イベント管理のフル機能実装

**詳細タスク**:
- [x] イベント作成モーダル/フォーム
  - 日付・時刻入力
  - メンバー割り当て
  - バリデーション
- [x] イベント編集機能
- [x] イベント削除機能
- [x] 一覧・詳細表示の改善
- [x] フィルタリング・検索機能

**成果物**:
- ✅ 完全なイベント管理機能
- ✅ ユーザーフレンドリーなUI
- ✅ 楽観的更新によるレスポンシブ操作

---

#### ✅ 8. タスク管理機能の実装 **完了**
**目的**: タスクのCRUD操作とステータス管理

**詳細タスク**:
- [x] `/app/tasks/page.tsx` の完全リライト
  - 新ドメインモデル対応
  - 詳細フィルタリング機能
- [x] `/app/tasks/components/TaskForm.tsx`
  - タスク作成・編集フォーム
  - チェックリスト動的管理
- [x] `/app/tasks/components/TaskCard.tsx`
  - ステータス変更機能・優先度表示
  - 進捗バー・期限切れアラート
- [x] `/app/tasks/components/TaskFilter.tsx`
  - メンバー・優先度・期限フィルタリング
- [x] メンバー割り当て機能

**成果物**:
- ✅ 完全なタスク管理システム
- ✅ 直感的な操作UI
- ✅ 高度なフィルタリング機能

---

#### ✅ 9. チェックリスト機能の実装 **完了**
**目的**: タスク内チェックリストの動的管理

**詳細タスク**:
- [x] チェックリストアイテムのCRUD
- [x] 動的な項目追加・削除
- [x] 進捗率表示・パーセンテージ計算
- [x] タスクカード内での進捗可視化
- [x] チェック状態の楽観的更新

**成果物**:
- ✅ インタラクティブなチェックリスト
- ✅ 視覚的な進捗管理
- ✅ リアルタイム進捗更新

---

#### ✅ 10. ダッシュボード (/) の実装 **完了**
**目的**: 重要情報の集約表示

**詳細タスク**:
- [x] `/app/page.tsx` の完全リライト
  - 今日・明日の予定表示
  - 期限切れタスクアラート
  - 統計サマリー
- [x] ウィジェット化・レスポンシブレイアウト
- [x] クイックアクション機能
- [x] 機能ナビゲーション統合

**成果物**:
- ✅ 情報豊富なダッシュボード
- ✅ 効率的なナビゲーション
- ✅ 期限切れアラート・統計表示

---

### 🟢 Phase 4: 付加機能 (Low Priority)

#### 11. データの永続化とエクスポート/インポート機能
**目的**: データのバックアップ・復元機能

**詳細タスク**:
- [ ] JSON形式でのエクスポート
- [ ] インポート機能とバリデーション
- [ ] データ整合性チェック
- [ ] 設定画面への統合

**成果物**:
- データポータビリティの確保
- 簡単なバックアップ機能

---

#### 12. PWA設定の最適化
**目的**: オフライン対応とパフォーマンス向上

**詳細タスク**:
- [ ] Service Worker設定最適化
- [ ] キャッシュ戦略の改善
- [ ] オフライン表示の改善
- [ ] インストール促進

**成果物**:
- 高品質なPWA体験
- 確実なオフライン動作

---

#### 13. OCR機能の実装 (最後)
**目的**: プリント読み取り機能の実装

**詳細タスク**:
- [ ] Google Cloud Vision API連携
- [ ] 画像アップロード処理
- [ ] テキスト抽出とパース
- [ ] 結果からイベント・タスク生成
- [ ] 手動修正UI

**成果物**:
- 自動プリント読み取り機能
- 手動修正可能なUI

---

## 完了基準

各タスクの完了基準:
- [ ] 実装完了
- [ ] 型チェック通過
- [ ] Lint通過
- [ ] 基本的な動作確認
- [ ] エラーハンドリング確認
- [ ] レスポンシブ対応確認

## 進捗状況

### ✅ 完了済み

#### Phase 1: Infrastructure層
- **Task 1**: IndexedDB (Dexie.js) のセットアップとスキーマ定義
  - Infrastructure層の基盤構築完了
  - 全20テスト通過
  - 型安全なRepository実装

#### Phase 2: Application層
- **Task 2**: 家族メンバー管理のユースケース実装
  - クリーンアーキテクチャ実装完了
  - DIコンテナ・CQRS実装
  - 43テスト実装・全通過
  
- **Task 3**: カレンダー・タスクのユースケース実装
  - Calendar/TasksのApplication層完全実装
  - Repository Pattern・DI統合完了
  - 高度な検索・フィルタリング機能実装
  - チェックリスト・統計機能実装

### 🔄 次のステップ

#### Phase 4: 統合・拡張 (次の優先事項)
1. **Application層実装統合**: モック実装から実際のApplication層への接続
2. **UI層テスト追加**: コンポーネントテスト・E2Eテスト実装
3. **PWA最適化**: Service Worker・キャッシュ戦略の最適化
4. **データ永続化**: エクスポート・インポート機能
5. **OCR機能**: プリント読み取り機能の実装

### 📊 全体進捗
- **Infrastructure層**: 100% ✅
- **Application層**: 100% ✅  
- **UI層**: 100% ✅ **MVP完成**
- **統合・拡張**: 0% 🟢 (次の段階)
- **付加機能**: 0% 🟢 (最終段階)

### 🎉 MVP達成状況
**✅ 完全実装済み機能**:
- 家族メンバー管理 (設定画面)
- カレンダー共有 (月表示・イベント管理)
- タスク管理 (チェックリスト・フィルタリング)
- ダッシュボード (統計・期限切れアラート)
- Clean Architecture実装
- オフラインファースト設計