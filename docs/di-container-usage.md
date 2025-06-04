# DIコンテナ使用ガイド

InversifyJSを使用したクリーンアーキテクチャの依存性注入実装。

## 📋 実装状況

### ✅ 完了済み
- **Task 2**: 家族メンバー管理のDI実装
- 43個の統合テスト実装済み、全てパス
- 完全なクリーンアーキテクチャ準拠

### 🟡 次期実装予定
- **Task 3**: Calendar & Task管理のDI統合

## アーキテクチャ改善

### ❌ **Before: 不適切な依存関係**
```typescript
// Application層がInfrastructure層を直接require
const { FamilyMemberRepository } = require('@/infrastructure/db/repository');
```

### ✅ **After: クリーンアーキテクチャ準拠**
```typescript
// Application層はInterfaceのみを知る
@injectable()
export class FamilyMemberUseCase {
  constructor(
    @inject(TYPES.IFamilyMemberRepository)
    private readonly repository: IFamilyMemberRepository
  ) {}
}
```

## ファイル構成

```
/application/shared/
  ├── types.ts          # DIシンボル定義
  └── container.ts      # DIコンテナ作成

/infrastructure/di/
  ├── bindings.ts       # バインディング設定
  └── container.ts      # コンテナ初期化

/application/family/
  ├── use-cases.ts      # @injectable UseCase
  └── index.ts          # クリーンなファクトリ
```

## 使用方法

### 1. **アプリケーション起動時の初期化**

```typescript
// app/layout.tsx または main.ts
import { initializeContainer } from '@/infrastructure/di/container';

// アプリ起動時に一度だけ実行
initializeContainer();
```

### 2. **本番環境での使用**

```typescript
import { getFamilyUseCase } from '@/application/family';

// DIコンテナから自動的にインスタンス取得
const useCase = getFamilyUseCase();
const result = await useCase.createMember('太郎');
```

### 3. **テスト環境での使用**

```typescript
import { createFamilyUseCase } from '@/application/family';

// テストではモックRepository注入
const mockRepository: IFamilyMemberRepository = { ... };
const useCase = createFamilyUseCase(mockRepository);
```

## 技術的メリット

### ✅ **完全な依存性逆転**
- Application層がInfrastructure層を知らない
- Interfaceのみに依存

### ✅ **設定の中央集権化**
- 全てのバインディングを`bindings.ts`で管理
- 実装の切り替えが容易

### ✅ **型安全性**
- TypeScriptとInversifyの組み合わせ
- コンパイル時に依存関係をチェック

### ✅ **テスタビリティ**
- モック注入が簡単
- 単体テストが書きやすい

## DIシンボル管理

```typescript
// application/shared/types.ts
export const TYPES = {
  IFamilyMemberRepository: Symbol.for('IFamilyMemberRepository'),
  FamilyMemberUseCase: Symbol.for('FamilyMemberUseCase'),
} as const;
```

## バインディング設定

```typescript
// infrastructure/di/bindings.ts
export const configureContainer = (container: Container): void => {
  // Repository実装をInterfaceにバインド
  container.bind<IFamilyMemberRepository>(TYPES.IFamilyMemberRepository)
           .to(InjectableFamilyMemberRepository)
           .inSingletonScope();

  // UseCase をバインド
  container.bind<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase)
           .to(FamilyMemberUseCase)
           .inTransientScope();
};
```

## クリーンアーキテクチャ原則の遵守

1. **依存性逆転の原則 (DIP)**: ✅ 完全に実現
2. **単一責任の原則 (SRP)**: ✅ 各クラスが明確な責任
3. **開放閉鎖の原則 (OCP)**: ✅ 新実装追加が容易
4. **インターフェース分離の原則 (ISP)**: ✅ 最小限のInterface
5. **依存性注入の原則**: ✅ InversifyJSで実現

この実装により、真のクリーンアーキテクチャが実現されています。