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

## Architecture

### 設計思想
関数型ドメインモデリングの考え方を取り入れ、以下の原則に従います：
- イミュータブルなデータ構造
- 純粋関数を中心とした設計
- 型による仕様の表現
- エラーを値として扱う
- ビジネスロジックとI/Oの分離

### 技術スタック

#### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand + Immer（イミュータブル更新）
- **データフェッチ**: TanStack Query
- **バリデーション**: Zod（スキーマファースト）
- **エラーハンドリング**: neverthrow（Result型）
- **日付処理**: date-fns（純粋関数）
- **PWA**: next-pwa

#### バックエンド
- **BaaS**: Supabase
  - PostgreSQL（強い型付け）
  - Row Level Security
  - Edge Functions（TypeScript）
- **OCR**: Google Cloud Vision API

### ドメインモデル（関数型アプローチ）

```typescript
// Brand Types for type safety
type UserId = string & { readonly brand: unique symbol }
type FamilyGroupId = string & { readonly brand: unique symbol }
type MemberId = string & { readonly brand: unique symbol }
type EventId = string & { readonly brand: unique symbol }
type TaskId = string & { readonly brand: unique symbol }

// Value Objects
type Email = string & { readonly brand: unique symbol }
type MemberName = string & { readonly brand: unique symbol }
type Grade = 
  | '幼稚園年少' | '幼稚園年中' | '幼稚園年長'
  | '小1' | '小2' | '小3' | '小4' | '小5' | '小6'
  | '中1' | '中2' | '中3'
  | 'その他'

// Domain Events (discriminated unions)
type FamilyEvent = 
  | { type: 'FamilyGroupCreated'; groupId: FamilyGroupId; createdBy: UserId }
  | { type: 'MemberAdded'; memberId: MemberId; groupId: FamilyGroupId }
  | { type: 'MemberUpdated'; memberId: MemberId; changes: Partial<FamilyMember> }
  | { type: 'UserInvited'; email: Email; groupId: FamilyGroupId }

// Entities (immutable records)
type FamilyMember = {
  readonly id: MemberId
  readonly name: MemberName
  readonly grade?: Grade
  readonly avatarUrl?: string
  readonly notes?: string
}

type CalendarEvent = {
  readonly id: EventId
  readonly title: string
  readonly description?: string
  readonly startDateTime: Date
  readonly endDateTime?: Date
  readonly assignedMemberIds: readonly MemberId[]
  readonly recurrence?: RecurrenceRule
}

type Task = {
  readonly id: TaskId
  readonly title: string
  readonly description?: string
  readonly dueDate?: Date
  readonly priority: Priority
  readonly assignedMemberIds: readonly MemberId[]
  readonly status: TaskStatus
  readonly checklist?: readonly ChecklistItem[]
}

type Priority = 'high' | 'medium' | 'low'
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

type ChecklistItem = {
  readonly id: string
  readonly title: string
  readonly isChecked: boolean
  readonly checkedAt?: Date
  readonly checkedBy?: UserId
}

// Smart Constructors with validation
const createEmail = (value: string): Result<Email, ValidationError> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
    ? ok(value as Email)
    : err({ type: 'InvalidEmail', message: 'Invalid email format' })
}

const createMemberName = (value: string): Result<MemberName, ValidationError> => {
  const trimmed = value.trim()
  if (trimmed.length === 0) return err({ type: 'EmptyName', message: 'Name cannot be empty' })
  if (trimmed.length > 50) return err({ type: 'NameTooLong', message: 'Name too long' })
  return ok(trimmed as MemberName)
}

// Domain Operations (pure functions)
const addMemberToFamily = (
  group: FamilyGroup,
  member: FamilyMember
): FamilyGroup => ({
  ...group,
  members: [...group.members, member]
})

const assignTaskToMembers = (
  task: Task,
  memberIds: readonly MemberId[]
): Task => ({
  ...task,
  assignedMemberIds: memberIds
})

const completeChecklistItem = (
  item: ChecklistItem,
  userId: UserId,
  at: Date
): ChecklistItem => ({
  ...item,
  isChecked: true,
  checkedAt: at,
  checkedBy: userId
})
```

### ディレクトリ構造

```
/app                    # Next.js App Router
  /(auth)
  /(dashboard)
/domain                 # ドメインロジック（純粋）
  /family
    /types.ts          # 型定義
    /operations.ts     # ドメイン操作
    /validations.ts    # バリデーション
  /calendar
  /tasks
  /shared
    /result.ts         # Result型
    /branded-types.ts  # Brand型
/infrastructure        # 外部サービスとの接続
  /supabase
  /ocr
/application          # ユースケース
  /family
  /calendar
  /tasks
/components           # UIコンポーネント
/lib                  # ユーティリティ
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