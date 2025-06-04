# アーキテクチャ設計書

## 概要

Sharendarは関数型ドメインモデリングとクリーンアーキテクチャを採用したWebアプリケーションです。
依存性逆転原則(DIP)と依存性注入(DI)により、高い保守性とテスタビリティを実現しています。

## アーキテクチャ原則

### クリーンアーキテクチャの実装

```
┌─────────────────────────────────────────────────────────┐
│                    UI層 (Next.js)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Application層 (UseCase + DI)          │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │           Domain層 (純粋ロジック)         │   │   │
│  │  │                                         │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
            ↑ 依存関係は内側へのみ向かう
┌─────────────────────────────────────────────────────────┐
│              Infrastructure層 (外部システム)              │
└─────────────────────────────────────────────────────────┘
```

### 依存性の方向

```typescript
// ✅ 正しい依存関係
UI層 → Application層 → Domain層 ← Infrastructure層
//                        ↑
//                  Interface定義のみ
//               (実装はInfrastructure層)
```

## 層別設計詳細

### Domain層（最内層）

**責任**: 純粋なビジネスロジックとルール

```typescript
// domain/family/types.ts - Brand型とValue Objects
export type MemberId = string & { readonly brand: unique symbol };
export type MemberName = string & { readonly brand: unique symbol };

export type FamilyMember = Readonly<{
  id: MemberId;
  name: MemberName;
  avatar?: string;
  color: Color;
}>;

// domain/family/repository.ts - Interface定義（DI非依存）
export interface IFamilyMemberRepository {
  save(member: FamilyMember): Promise<Result<void, FamilyMemberRepositoryError>>;
  findById(id: MemberId): Promise<Result<FamilyMember | null, FamilyMemberRepositoryError>>;
  // ... 他のメソッド
}

// domain/family/operations.ts - 純粋関数
export const createFamilyMember = (
  name: MemberName,
  options?: CreateMemberOptions
): FamilyMember => {
  // 副作用のない純粋な操作
};
```

**特徴**:
- 他の層に依存しない
- DIフレームワークに依存しない
- 純粋関数のみで構成
- Interface定義により外部依存を抽象化

### Application層（ユースケース層）

**責任**: ビジネスユースケースの実装とDI設定

```typescript
// application/shared/types.ts - DIシンボル管理
export const TYPES = {
  IFamilyMemberRepository: Symbol.for('IFamilyMemberRepository'),
  FamilyMemberUseCase: Symbol.for('FamilyMemberUseCase'),
} as const;

// application/family/use-cases.ts - UseCase実装
@injectable()
export class FamilyMemberUseCase {
  constructor(
    @inject(TYPES.IFamilyMemberRepository)
    private readonly repository: IFamilyMemberRepository
  ) {}

  async createMember(name: string): Promise<Result<FamilyMember, FamilyUseCaseError>> {
    // 1. バリデーション
    // 2. ドメイン操作呼び出し
    // 3. Repository呼び出し
    // 4. Result型でエラーハンドリング
  }
}

// application/family/index.ts - ファクトリ関数
export const getFamilyUseCase = (): FamilyMemberUseCase => {
  ensureContainerInitialized();
  return container.get<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase);
};
```

**特徴**:
- Domain層のInterfaceのみに依存
- Infrastructure層に直接依存しない
- DIコンテナによる依存性解決
- CQRS（Command Query Responsibility Segregation）パターン

### Infrastructure層（最外層）

**責任**: 外部システムとの接続と具体的実装

```typescript
// infrastructure/db/repository.ts - Repository実装
@injectable()
export class InjectableFamilyMemberRepository implements IFamilyMemberRepository {
  async save(member: FamilyMember): Promise<Result<void, FamilyMemberRepositoryError>> {
    try {
      // IndexedDB具体的操作
      await db.familyMembers.put(this.toDTO(member));
      return ok(undefined);
    } catch (error) {
      return err({ type: 'DatabaseError', message: error.message });
    }
  }
}

// infrastructure/di/bindings.ts - DI設定
export const configureContainer = (container: Container): void => {
  container.bind<IFamilyMemberRepository>(TYPES.IFamilyMemberRepository)
           .to(InjectableFamilyMemberRepository)
           .inSingletonScope();
  
  container.bind<FamilyMemberUseCase>(TYPES.FamilyMemberUseCase)
           .to(FamilyMemberUseCase)
           .inTransientScope();
};
```

**特徴**:
- Domain層のInterfaceを実装
- 外部システム（IndexedDB、API等）との接続
- DIバインディング設定
- DTO変換処理

### UI層（Next.js App Router）

**責任**: ユーザーインターフェースとプレゼンテーション

```typescript
// app/settings/page.tsx
export default function SettingsPage() {
  const useCase = getFamilyUseCase(); // DIコンテナから取得
  
  const handleCreateMember = async (name: string) => {
    const result = await useCase.createMember(name);
    
    if (result.isErr()) {
      // エラーハンドリング
      setError(result.error.message);
    } else {
      // 成功処理
      setMembers(prev => [...prev, result.value]);
    }
  };

  return (
    // JSX実装
  );
}
```

## 依存性注入（DI）の実装

### DIシンボルの管理場所

**Application層で管理する理由**:

1. **適切な責任分離**
   - Domain層: 純粋なビジネスロジック
   - Application層: ユースケースとDI設定
   - Infrastructure層: 具体的実装

2. **Domain層の純粋性保持**
   - DIフレームワークに依存しない
   - 外部ライブラリからの独立性

```typescript
// ✅ 正しい配置
/application/shared/types.ts  # DIシンボル定義
/domain/family/repository.ts  # Interface定義のみ（DI非依存）
```

### DIライフサイクル

1. **アプリケーション起動時**
   ```typescript
   // app/layout.tsx
   import { initializeContainer } from '@/infrastructure/di/container';
   
   initializeContainer(); // 一度だけ実行
   ```

2. **本番環境での使用**
   ```typescript
   const useCase = getFamilyUseCase(); // DIコンテナから取得
   ```

3. **テスト環境での使用**
   ```typescript
   const mockRepository = createMockRepository();
   const useCase = createFamilyUseCase(mockRepository); // 直接注入
   ```

## エラーハンドリング戦略

### Result型による関数型エラーハンドリング

```typescript
import { Result, ok, err } from 'neverthrow';

// ✅ 例外を投げない、Resultを返す
async function createMember(name: string): Promise<Result<FamilyMember, FamilyUseCaseError>> {
  const nameResult = validateMemberName(name);
  if (nameResult.isErr()) {
    return err(nameResult.error);
  }
  
  const saveResult = await repository.save(member);
  if (saveResult.isErr()) {
    return err(saveResult.error);
  }
  
  return ok(member);
}

// 使用側
const result = await useCase.createMember('太郎');
if (result.isErr()) {
  console.error(result.error);
} else {
  console.log('成功:', result.value);
}
```

## テスト戦略

### レイヤー別テスト方針

1. **Domain層**: ユニットテスト（純粋関数）
2. **Application層**: 統合テスト（Repository含む）
3. **Infrastructure層**: 統合テスト（実際のDB）
4. **UI層**: コンポーネントテスト

### DIによるテスタビリティ

```typescript
// テストでのモック注入例
describe('FamilyMemberUseCase', () => {
  it('should create member successfully', async () => {
    const mockRepository = {
      save: vi.fn().mockResolvedValue(ok(undefined)),
      findById: vi.fn().mockResolvedValue(ok(null)),
      // ...
    };
    
    const useCase = createFamilyUseCase(mockRepository);
    const result = await useCase.createMember('太郎');
    
    expect(result.isOk()).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: '太郎' })
    );
  });
});
```

## 実装済み機能とアーキテクチャ検証

### ✅ Task 2: 家族メンバー管理（完了）

**アーキテクチャ品質検証結果**:

1. **依存性逆転原則(DIP)**: ✅ 完全実装
   - Application層がInfrastructure層に直接依存しない
   - Domain Interfaceのみに依存

2. **依存性注入(DI)**: ✅ InversifyJSで実装
   - 型安全なDI実現
   - テスト時のモック注入対応

3. **責任分離**: ✅ 適切な層分割
   - Domain: ビジネスロジック
   - Application: ユースケース
   - Infrastructure: 具体実装

4. **テスタビリティ**: ✅ 43テスト実装、全パス
   - 統合テスト完備
   - モック注入テスト

**アーキテクチャ成熟度**: Production Ready

### 🟡 次期実装: Calendar & Task管理

同じアーキテクチャパターンを適用:
- Domain Interface定義
- Application UseCase実装
- Infrastructure Repository実装
- 完全なDI統合

## パフォーマンス考慮事項

### DIコンテナの最適化

1. **Singleton vs Transient**
   - Repository: Singleton（状態を持たない）
   - UseCase: Transient（状態を持つ可能性）

2. **遅延初期化**
   - 必要時にのみDI解決
   - アプリケーション起動時間の最適化

### メモリ効率

1. **イミュータブルデータ構造**
   - 意図しない変更を防ぐ
   - 予測可能な動作

2. **Result型による早期リターン**
   - 例外処理のオーバーヘッド削減
   - エラー時の処理効率化

## 将来の拡張性

### 新ドメイン追加の手順

1. Domain層でInterface定義
2. Application層でUseCase実装
3. Infrastructure層で具体実装
4. DIバインディング追加
5. UI層での利用

### 外部システム統合

```typescript
// 例: Supabase統合時
interface ISupabaseRepository extends IFamilyMemberRepository {
  syncWithCloud(): Promise<Result<void, SyncError>>;
}

// DIバインディング切り替えのみで対応可能
container.bind<IFamilyMemberRepository>(TYPES.IFamilyMemberRepository)
         .to(SupabaseFamilyMemberRepository);
```

このアーキテクチャにより、Sharendarは高い保守性、テスタビリティ、拡張性を持つアプリケーションとして設計されています。