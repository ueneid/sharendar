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

3. **カレンダー共有**
   - 家族のイベント・予定を日付・時間指定で登録
   - 担当者（家族メンバー）設定可
   - カレンダー表示（家族全体・個人別の切り替え）

4. **タスク管理・チェックリスト**
   - 家族単位・個人単位でタスク（ToDo/持ち物/やること）作成
   - 担当者割当、期限、優先度
   - チェックリスト形式で進捗可視化（親が代理でチェック可）

5. **プリントOCR機能（α版）**
   - 写真をアップロード
   - OCRで日付・イベント名・持ち物抽出（API or AI agentで開発）
   - 抽出内容をカレンダーやタスクに自動登録（手修正できるUI）

6. **通知・リマインダー**（後から追加もOK）
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

### Installation

```bash
# 依存関係のインストール
npm install

# 開発環境のセットアップ
npm run dev
```

## Architecture (MVP版)

### 設計思想
関数型ドメインモデリングを採用したMVP設計：
- **純粋関数**：副作用を分離し、ビジネスロジックを純粋に保つ
- **イミュータブル**：すべてのデータ構造を不変に
- **型安全**：Brand型で実行時エラーを防ぐ
- **エラーハンドリング**：Result型でエラーを値として扱う
- **オフラインファースト**：ローカルストレージで完結
- **段階的拡張**：将来の機能追加を考慮した設計

### 技術スタック（MVP）

#### フロントエンド（単体アプリ）
- **Framework**: Next.js 14 (Static Export)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データストレージ**: IndexedDB (Dexie.js)
- **状態管理**: Zustand
- **PWA**: next-pwa
- **OCR**: Google Cloud Vision API

#### 将来の拡張（Post-MVP）
- **認証**: Supabase Auth
- **データ同期**: Supabase Realtime
- **通知**: Web Push API

### ドメインモデル（関数型アプローチ - MVP版）

```typescript
// Brand Types for type safety
type MemberId = string & { readonly brand: unique symbol };
type EventId = string & { readonly brand: unique symbol };
type TaskId = string & { readonly brand: unique symbol };
type DateString = string & { readonly brand: unique symbol }; // YYYY-MM-DD
type TimeString = string & { readonly brand: unique symbol }; // HH:MM

// Value Objects
type MemberName = string & { readonly brand: unique symbol };
type EventTitle = string & { readonly brand: unique symbol };
type TaskTitle = string & { readonly brand: unique symbol };
type Color = string & { readonly brand: unique symbol };

// Domain Entities (immutable)
type FamilyMember = Readonly<{
  id: MemberId;
  name: MemberName;
  avatar?: string;
  color: Color;
}>;

type CalendarEvent = Readonly<{
  id: EventId;
  title: EventTitle;
  date: DateString;
  time?: TimeString;
  memberIds: ReadonlyArray<MemberId>;
  type: 'event' | 'task';
  memo?: string;
}>;

type Task = Readonly<{
  id: TaskId;
  title: TaskTitle;
  dueDate?: DateString;
  priority: Priority;
  status: TaskStatus;
  memberIds: ReadonlyArray<MemberId>;
  checklist: ReadonlyArray<ChecklistItem>;
  createdAt: DateString;
  completedAt?: DateString;
}>;

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'completed';

type ChecklistItem = Readonly<{
  id: string;
  title: string;
  checked: boolean;
}>;

// Smart Constructors with validation
import { Result, ok, err } from 'neverthrow';

const createMemberName = (value: string): Result<MemberName, string> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return err('名前を入力してください');
  if (trimmed.length > 20) return err('名前は20文字以内で入力してください');
  return ok(trimmed as MemberName);
};

const createDateString = (value: string): Result<DateString, string> => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return err('日付の形式が正しくありません');
  return ok(value as DateString);
};

const createColor = (value: string): Result<Color, string> => {
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!colorRegex.test(value)) return err('カラーコードの形式が正しくありません');
  return ok(value as Color);
};

// Domain Operations (pure functions)
const createFamilyMember = (
  name: MemberName,
  color: Color,
  avatar?: string
): FamilyMember => ({
  id: generateId() as MemberId,
  name,
  color,
  avatar,
});

const assignMembersToTask = (
  task: Task,
  memberIds: ReadonlyArray<MemberId>
): Task => ({
  ...task,
  memberIds,
});

const completeTask = (
  task: Task,
  completedAt: DateString
): Task => ({
  ...task,
  status: 'completed' as const,
  completedAt,
});

const toggleChecklistItem = (
  task: Task,
  itemId: string
): Task => ({
  ...task,
  checklist: task.checklist.map(item =>
    item.id === itemId
      ? { ...item, checked: !item.checked }
      : item
  ),
});

// ドメイン操作の例
const taskProgress = calculateChecklistProgress(task.checklist);
const overdueTasks = filterOverdueTasks(allTasks, today);
const memberEvents = filterEventsByMember(allEvents, memberId);
```

### ディレクトリ構造（MVP版）

```
/app                    # Next.js App Router（UI層）
  /calendar            # カレンダー画面
  /tasks               # タスク画面
  /ocr                 # OCR画面
  /settings            # 設定（家族メンバー管理）
  page.tsx             # ダッシュボード
/domain                # ドメイン層（純粋なビジネスロジック）
  /family              # 家族メンバー
    /types.ts          # 型定義
    /operations.ts     # ドメイン操作（純粋関数）
    /validations.ts    # バリデーション
  /calendar            # カレンダー
    /types.ts
    /operations.ts
    /validations.ts
  /tasks               # タスク
    /types.ts
    /operations.ts
    /validations.ts
  /shared              # 共通
    /branded-types.ts  # Brand型定義
/infrastructure        # インフラ層（副作用）
  /db                  # IndexedDB (Dexie.js)
    /repository.ts     # Repository実装
    /schema.ts         # DBスキーマ
  /ocr                 # OCR処理
    /google-vision.ts  # Google Vision API
/application          # アプリケーション層（ユースケース）
  /family              # 家族メンバー管理
  /calendar            # カレンダー管理
  /tasks               # タスク管理
/components           # UIコンポーネント
  /calendar
  /tasks
  /common
/lib                  # 共通ライブラリ
  /store              # Zustand ストア
  /utils              # ユーティリティ
/public
  /icons              # PWAアイコン
/docs                 # ドキュメント
```

## Important Notes

### 技術選定の比較：KMP vs Next.js PWA

#### Kotlin Multiplatform (Native App)

**メリット**
- **優れたオフライン機能**：SQLiteによる完全なローカルDB
- **高度なカメラ/画像処理**：OCR前処理が容易
- **ネイティブ通知**：より確実な通知配信
- **関数型サポート**：Arrow-ktで本格的な関数型プログラミング
- **型安全性**：Kotlinの強力な型システム

**デメリット**
- **開発期間**：iOS/Androidの両対応で時間がかかる
- **アプリストア審査**：リリースに時間がかかる
- **更新の手間**：ユーザーのアプリ更新が必要
- **初期開発コスト**：高い

#### Next.js + TypeScript (PWA)

**メリット**
- **即座にリリース可能**：審査不要
- **開発速度**：単一コードベースで高速開発
- **更新が簡単**：サーバー側で即反映
- **初期開発コスト**：低い
- **Supabaseとの相性**：優れた統合

**デメリット**
- **iOS制限**：PWAの機能制限（通知など）
- **オフライン機能**：制限あり
- **カメラアクセス**：ブラウザ依存

### 推奨：Next.js PWAでMVP開発

**理由**
1. **スピード重視**：家族向けアプリは早期にフィードバックを得ることが重要
2. **頻繁な更新**：学校行事などの機能追加が多い領域
3. **コスト効率**：単一コードベースで保守が容易
4. **段階的移行可能**：将来的にKMPへの移行も可能

**段階的アプローチ**
1. Phase 1: Next.js PWAでMVPリリース
2. Phase 2: ユーザーフィードバックを収集
3. Phase 3: 必要に応じてKMPでネイティブ版開発

**PWAの制限への対処法**
- **通知**：メール/LINE通知で補完
- **オフライン**：Service Workerで基本機能は確保
- **OCR**：サーバーサイドで処理

### 関数型プログラミングの実装

TypeScriptでも十分な関数型プログラミングが可能：
- fp-ts/Effect-TSライブラリ
- neverthrowでResult型
- Zodでスキーマバリデーション
- イミュータブルデータ構造

KMPを選択する場合は、Arrow-ktを使用してより本格的な関数型プログラミングが可能ですが、MVPフェーズではTypeScriptで十分です。