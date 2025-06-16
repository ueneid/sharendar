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

## 関連ドキュメント

詳細な技術情報は以下の専門ドキュメントを参照してください：
- [アーキテクチャ詳細](/docs/architecture.md) - Clean Architecture + 関数型設計の詳細
- [ドメインモデル](/docs/domain-models.md) - 統一Activityドメインの詳細仕様
- [テスト戦略](/docs/testing.md) - TDD実践ガイド
- [API設計パターン](/docs/api-patterns.md) - Repository, UseCase, Error handling patterns

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

### Path Aliases

プロジェクトでは `@/` エイリアスを使用してルートディレクトリからの絶対パスでインポート:

```typescript
import { Activity } from '@/domain/activity/types';
import { useActivityStore } from '@/lib/store/activity-store';
```

## アーキテクチャ概要

Clean Architecture + 関数型ドメインモデリング + TDDアプローチを採用。
詳細な設計思想と技術スタックは [アーキテクチャ詳細](/docs/architecture.md) を参照。

### 統一Activityドメインモデル

CalendarEventとTaskを統一した`Activity`エンティティを採用。
詳細な型定義と仕様は [ドメインモデル](/docs/domain-models.md) を参照。

### レイヤード・アーキテクチャ概要

```
UI層 → Store層 → Application層 → Domain層 → Infrastructure層
```

詳細な構造とデータフローは [アーキテクチャ詳細](/docs/architecture.md) を参照。


## 最新機能

### グローバルナビゲーション（2025年6月実装） ✅
- 全ページで統一されたボトムナビゲーション
- モバイルファーストのグローバルレイアウト（app/layout.tsx）
- アクセシビリティ向上（aria-label、アクティブ状態）
- 5タブ構成：ホーム、カレンダー、タスク、OCR、設定

### フィルタリング機能（2025年6月実装） ✅
- カテゴリ、ステータス、優先度、メンバー、日付範囲による絞り込み
- ActivityStore統合、リアルタイムフィルタリング
- カレンダー/タスクページ両方で利用可能

## 重要な設計パターン

### 型安全性とエラーハンドリング
- **Brand Types**: 実行時型エラーを防ぐ
- **Result型**: `neverthrow`によるエラーの値化
- **TDD**: テストファースト開発

詳細なパターンと実装方法は以下を参照：
- [API設計パターン](/docs/api-patterns.md) - Repository, UseCase, Error handling
- [テスト戦略](/docs/testing.md) - TDD実践ガイド
- [ドメインモデル](/docs/domain-models.md) - Brand型とバリデーション

## 実装状況

### ✅ 完了済み
- 統一Activityドメインモデル実装
- ActivityCard/ActivityForm UIコンポーネント
- カレンダー/タスクページでの統合表示
- DIコンテナによる依存性注入（FamilyMemberRepository含む）
- Zustandストアの実装
- 包括的フィルタリング機能（カテゴリ、ステータス、優先度、メンバー、日付範囲）
- グローバルナビゲーション（MobileNavigationコンポーネント、レイアウト統一）

### 📋 未実装
- OCR機能（Google Vision API統合）
- 通知・リマインダー機能
- データ同期（Supabase統合）
- 繰り返し予定機能
- PWA最適化（Service Worker）

**注記**: PWA基盤（next-pwa）は導入済み、manifest.jsonも設定済み

## Critical Notes

1. **CalendarEventとTaskは削除済み**: すべて`Activity`エンティティを使用
2. **DIコンテナは必須**: 直接newでインスタンス化せず、必ずDIコンテナ経由で取得
3. **Result型でエラーハンドリング**: throw/catch ではなく Result<T, E> を使用
4. **テストファースト**: 実装前に必ずテストを書く
5. **日本語UI**: エラーメッセージ、ラベル等はすべて日本語
6. **テスト環境**: fake-indexeddbでIndexedDBをモック、test-setup.tsで設定済み
7. **グローバルナビゲーション**: app/layout.tsxで実装済み、MobileLayoutコンポーネントは重複ナビゲーションを含まない

## よくある問題と解決法

### テストでのBrand型エラー
```typescript
// ❌ 間違い: 直接文字列を使用
const activity = { id: 'test-1', title: 'テスト' };

// ✅ 正しい: as関数を使用
const activity = { 
  id: asActivityId('test-1'), 
  title: asActivityTitle('テスト') 
};
```

### DIコンテナの初期化忘れ
```typescript
// ❌ 間違い: 直接インスタンス化
const activityUseCase = new ActivityUseCase();

// ✅ 正しい: DIコンテナ経由
const container = getInitializedContainer();
const activityUseCase = container.get<ActivityUseCase>('ActivityUseCase');
```

### ダブルナビゲーション問題
```typescript
// ❌ 間違い: MobileLayoutでナビゲーション追加
export default function MobileLayout({ children }) {
  return (
    <div>
      {children}
      <MobileNavigation /> {/* 重複! */}
    </div>
  );
}

// ✅ 正しい: app/layout.tsxでのみナビゲーション表示
// MobileLayoutは純粋なヘッダー + コンテンツ領域のみ
```