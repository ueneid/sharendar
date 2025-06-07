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

### 🔵 Phase 3: UI層 (Next Priority)

#### 4. Zustand ストアの実装
**目的**: UI層での状態管理基盤構築

**詳細タスク**:
- [ ] `/lib/store/index.ts` の実装
  - ストア構造の設計
  - 各ドメインストアの分離
- [ ] `/lib/store/family-store.ts` 
  - 家族メンバー状態管理
  - Application層との接続
- [ ] `/lib/store/calendar-store.ts`
  - カレンダーイベント状態管理
- [ ] `/lib/store/task-store.ts`
  - タスク状態管理
- [ ] React統合とProvider設定

**成果物**:
- 型安全なグローバル状態管理
- Application層との統合

---

#### 5. 設定画面 (/settings) の実装
**目的**: 家族メンバー管理のUI実装

**詳細タスク**:
- [ ] `/app/settings/page.tsx` の実装
  - レスポンシブレイアウト
  - メンバーリスト表示
- [ ] 家族メンバー追加フォーム
  - バリデーション表示
  - エラーメッセージ
- [ ] 編集・削除機能
- [ ] カラーピッカー・アバター選択
- [ ] 操作フィードバック (成功/エラー表示)

**成果物**:
- 完全な家族メンバー管理UI
- バリデーション付きフォーム

---

### 🟢 Phase 4: 機能拡張 (Medium Priority)

#### 6. カレンダーコンポーネントのリファクタリング
**目的**: 既存コンポーネントの新アーキテクチャ対応

**詳細タスク**:
- [ ] `/components/Calendar.tsx` の更新
  - 新しいドメインモデル対応
  - 型安全性の向上
- [ ] ストアとの統合
- [ ] パフォーマンス最適化

**成果物**:
- 新アーキテクチャ準拠のカレンダー
- 型安全なイベント表示

---

#### 6. カレンダーイベント作成・編集機能
**目的**: イベント管理のフル機能実装

**詳細タスク**:
- [ ] イベント作成モーダル/フォーム
  - 日付・時刻入力
  - メンバー割り当て
  - バリデーション
- [ ] イベント編集機能
- [ ] イベント削除機能
- [ ] 一覧・詳細表示の改善

**成果物**:
- 完全なイベント管理機能
- ユーザーフレンドリーなUI

---

#### 7. タスク管理機能の実装
**目的**: タスクのCRUD操作とステータス管理

**詳細タスク**:
- [ ] `/app/tasks/page.tsx` の更新
  - 新ドメインモデル対応
  - フィルタリング機能
- [ ] タスク作成・編集フォーム
- [ ] ステータス変更機能
- [ ] 優先度管理
- [ ] メンバー割り当て機能

**成果物**:
- 完全なタスク管理システム
- 直感的な操作UI

---

#### 8. チェックリスト機能の実装
**目的**: タスク内チェックリストの動的管理

**詳細タスク**:
- [ ] チェックリストアイテムのCRUD
- [ ] ドラッグ&ドロップ並び替え
- [ ] 進捗率表示
- [ ] 一括操作機能

**成果物**:
- インタラクティブなチェックリスト
- 視覚的な進捗管理

---

#### 9. ダッシュボード (/) の実装
**目的**: 重要情報の集約表示

**詳細タスク**:
- [ ] `/app/page.tsx` の更新
  - 今日の予定表示
  - 緊急タスク表示
  - 完了率サマリー
- [ ] ウィジェット化
- [ ] クイックアクション機能

**成果物**:
- 情報豊富なダッシュボード
- 効率的なナビゲーション

---

### 🟢 Phase 3: 付加機能 (Low Priority)

#### 10. データの永続化とエクスポート/インポート機能
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

#### 11. PWA設定の最適化
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

#### 12. OCR機能の実装 (最後)
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

#### Phase 3: UI層 (次の優先事項)
1. **Task 4**: Zustand ストアの実装
   - UI層状態管理とApplication層統合
2. **Task 5**: 設定画面 (/settings) の実装
   - 家族メンバー管理UI実装
3. **Task 6**: カレンダーコンポーネントのリファクタリング
   - 新アーキテクチャ対応・ストア統合
4. **Task 7-9**: 各機能のUI実装
   - イベント作成・編集機能
   - タスク管理機能
   - ダッシュボード実装

### 📊 全体進捗
- **Infrastructure層**: 100% ✅
- **Application層**: 100% ✅  
- **UI層**: 0% 🔵 (次の対象)
- **付加機能**: 0% 🟢 (最終段階)