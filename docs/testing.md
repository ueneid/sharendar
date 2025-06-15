# テスト戦略

このドキュメントでは、SharendarにおけるTDD（テスト駆動開発）実践とテスト戦略について説明します。

## TDD基本方針

### Red-Green-Refactorサイクル

1. **Red**: まず失敗するテストを書く
2. **Green**: テストを通す最小限のコードを書く
3. **Refactor**: コードを改善し、テストが通ることを確認

### テストファースト原則

- すべての新機能は**テストから開始**
- 実装前に**期待される動作を明確化**
- **テストが仕様書**の役割を果たす

## テストの分類

### 1. ユニットテスト（Unit Tests）

**対象**: 純粋関数、ドメインロジック、バリデーション

```typescript
// __tests__/domain/activity/operations.test.ts
import { describe, it, expect } from 'vitest';
import { createActivity } from '../../../domain/activity/operations';
import { asActivityId, asActivityTitle } from '../../../domain/shared/branded-types';

describe('Activity Operations', () => {
  describe('createActivity', () => {
    it('should create a valid activity with required fields', () => {
      const result = createActivity('買い物', 'task', 'medium');
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activity = result.value;
        expect(activity.title).toBe('買い物');
        expect(activity.category).toBe('task');
        expect(activity.priority).toBe('medium');
        expect(activity.status).toBe('pending');
        expect(activity.checklist).toEqual([]);
        expect(activity.memberIds).toEqual([]);
      }
    });

    it('should return error for empty title', () => {
      const result = createActivity('', 'task', 'medium');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('タイトルは必須です');
      }
    });

    it('should create activity with optional fields', () => {
      const result = createActivity('会議', 'meeting', 'high', {
        description: '月次定例会議',
        startDate: '2025-06-15',
        startTime: '14:00',
        endDate: '2025-06-15',
        endTime: '15:00',
        location: '会議室A',
        memberIds: ['member-1', 'member-2'],
        tags: ['仕事', '定例']
      });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const activity = result.value;
        expect(activity.description).toBe('月次定例会議');
        expect(activity.startDate).toBe('2025-06-15');
        expect(activity.location).toBe('会議室A');
        expect(activity.memberIds).toHaveLength(2);
        expect(activity.tags).toEqual(['仕事', '定例']);
      }
    });
  });

  describe('updateActivity', () => {
    it('should update activity title', () => {
      const activity = createActivityFixture({
        title: asActivityTitle('元のタイトル')
      });
      
      const result = updateActivity(activity, { title: '新しいタイトル' });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('新しいタイトル');
        expect(result.value.updatedAt).not.toBe(activity.updatedAt);
      }
    });
  });
});
```

### 2. インテグレーションテスト（Integration Tests）

**対象**: Repository、UseCase、外部依存との統合

```typescript
// __tests__/infrastructure/db/activity-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DexieActivityRepository } from '../../../infrastructure/db/activity-repository';
import { createActivityFixture } from '../../fixtures/activity-fixtures';
import { setupTestDatabase, cleanupTestDatabase } from '../../helpers/test-database';

describe('DexieActivityRepository', () => {
  let repository: DexieActivityRepository;

  beforeEach(async () => {
    await setupTestDatabase();
    repository = new DexieActivityRepository();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('save', () => {
    it('should save activity to database', async () => {
      const activity = createActivityFixture();
      
      const result = await repository.save(activity);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(activity);
      }
    });

    it('should update existing activity', async () => {
      const activity = createActivityFixture();
      await repository.save(activity);
      
      const updatedActivity = { ...activity, title: asActivityTitle('更新済み') };
      const result = await repository.save(updatedActivity);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe('更新済み');
      }
    });
  });

  describe('findById', () => {
    it('should find activity by id', async () => {
      const activity = createActivityFixture();
      await repository.save(activity);
      
      const result = await repository.findById(activity.id);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(activity);
      }
    });

    it('should return null for non-existent id', async () => {
      const result = await repository.findById(asActivityId('non-existent'));
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });
});
```

### 3. アプリケーション層テスト

**対象**: UseCase、Command/Query処理

```typescript
// __tests__/application/activity/use-cases.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityUseCase } from '../../../application/activity/use-cases';
import { ActivityRepository } from '../../../domain/activity/repository';
import { createMockRepository } from '../../mocks/repository-mocks';
import { CreateActivityCommand } from '../../../application/activity/commands';
import { ok, err } from 'neverthrow';

describe('ActivityUseCase', () => {
  let useCase: ActivityUseCase;
  let mockRepository: jest.Mocked<ActivityRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    useCase = new ActivityUseCase(mockRepository);
  });

  describe('createActivity', () => {
    it('should create activity successfully', async () => {
      const command: CreateActivityCommand = {
        title: '新しいタスク',
        category: 'task',
        priority: 'medium',
        description: 'テスト用タスク'
      };

      mockRepository.save.mockResolvedValue(ok(expect.any(Object)));
      
      const result = await useCase.createActivity(command);
      
      expect(result.isOk()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      if (result.isOk()) {
        expect(result.value.title).toBe('新しいタスク');
        expect(result.value.category).toBe('task');
      }
    });

    it('should return error for invalid command', async () => {
      const command: CreateActivityCommand = {
        title: '', // 空のタイトル
        category: 'task',
        priority: 'medium'
      };
      
      const result = await useCase.createActivity(command);
      
      expect(result.isErr()).toBe(true);
      expect(mockRepository.save).not.toHaveBeenCalled();
      if (result.isErr()) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle repository save failure', async () => {
      const command: CreateActivityCommand = {
        title: '有効なタスク',
        category: 'task',
        priority: 'medium'
      };

      mockRepository.save.mockResolvedValue(
        err(new RepositoryError('SAVE_FAILED', 'Database error'))
      );
      
      const result = await useCase.createActivity(command);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('SAVE_FAILED');
      }
    });
  });
});
```

### 4. コンポーネントテスト（React Testing Library）

**対象**: React コンポーネント、UI相互作用

```typescript
// __tests__/components/activity/ActivityForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityForm } from '../../../components/activity/ActivityForm';
import { useActivityStore } from '../../../lib/store/activity-store';

// Zustandストアをモック
vi.mock('../../../lib/store/activity-store');

describe('ActivityForm', () => {
  const mockCreateActivity = vi.fn();
  const mockUseActivityStore = useActivityStore as jest.MockedFunction<typeof useActivityStore>;

  beforeEach(() => {
    mockUseActivityStore.mockReturnValue({
      createActivity: mockCreateActivity,
      isLoading: false,
      error: null,
      // 他の必要なストア状態...
    });
  });

  it('should render form fields', () => {
    render(<ActivityForm />);
    
    expect(screen.getByLabelText('タイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockCreateActivity.mockResolvedValue(undefined);
    
    render(<ActivityForm />);
    
    await user.type(screen.getByLabelText('タイトル'), '新しいタスク');
    await user.selectOptions(screen.getByLabelText('カテゴリ'), 'task');
    await user.selectOptions(screen.getByLabelText('優先度'), 'high');
    await user.click(screen.getByRole('button', { name: '作成' }));
    
    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalledWith({
        title: '新しいタスク',
        category: 'task',
        priority: 'high'
      });
    });
  });

  it('should show validation error for empty title', async () => {
    const user = userEvent.setup();
    
    render(<ActivityForm />);
    
    await user.click(screen.getByRole('button', { name: '作成' }));
    
    expect(screen.getByText('タイトルは必須です')).toBeInTheDocument();
    expect(mockCreateActivity).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    mockUseActivityStore.mockReturnValue({
      createActivity: vi.fn(() => new Promise(() => {})), // 永続化しないPromise
      isLoading: true,
      error: null,
    });
    
    render(<ActivityForm />);
    
    expect(screen.getByRole('button', { name: '作成' })).toBeDisabled();
    expect(screen.getByText('作成中...')).toBeInTheDocument();
  });
});
```

### 5. E2Eテスト（End-to-End）

**対象**: ユーザーワークフロー全体

```typescript
// e2e/activity-management.test.ts
import { test, expect } from '@playwright/test';

test.describe('Activity Management', () => {
  test('should create, edit, and complete activity', async ({ page }) => {
    await page.goto('/');
    
    // Activity作成
    await page.click('[data-testid="create-activity-button"]');
    await page.fill('[data-testid="activity-title"]', '重要なタスク');
    await page.selectOption('[data-testid="activity-category"]', 'task');
    await page.selectOption('[data-testid="activity-priority"]', 'high');
    await page.click('[data-testid="submit-button"]');
    
    // 作成されたActivityの確認
    await expect(page.locator('[data-testid="activity-card"]')).toContainText('重要なタスク');
    await expect(page.locator('[data-testid="activity-priority"]')).toContainText('高');
    
    // Activity編集
    await page.click('[data-testid="edit-activity-button"]');
    await page.fill('[data-testid="activity-title"]', '更新されたタスク');
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('[data-testid="activity-card"]')).toContainText('更新されたタスク');
    
    // Activity完了
    await page.click('[data-testid="complete-activity-button"]');
    
    await expect(page.locator('[data-testid="activity-status"]')).toContainText('完了');
  });

  test('should filter activities by category', async ({ page }) => {
    // テストデータの準備
    await page.goto('/');
    
    // フィルター適用
    await page.click('[data-testid="filter-button"]');
    await page.check('[data-testid="filter-category-task"]');
    await page.click('[data-testid="apply-filter-button"]');
    
    // フィルター結果の確認
    const activityCards = page.locator('[data-testid="activity-card"]');
    const count = await activityCards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(activityCards.nth(i).locator('[data-testid="activity-category"]'))
        .toContainText('タスク');
    }
  });
});
```

## テストヘルパーとFixture

### テストFixture

```typescript
// __tests__/fixtures/activity-fixtures.ts
import { Activity, ActivityCategory, ActivityPriority, ActivityStatus } from '../../domain/activity/types';
import { asActivityId, asActivityTitle, asDateString, asMemberId } from '../../domain/shared/branded-types';

export const createActivityFixture = (overrides: Partial<Activity> = {}): Activity => {
  const now = new Date().toISOString();
  
  return {
    id: asActivityId('test-activity-1'),
    title: asActivityTitle('テストActivity'),
    description: 'テスト用のActivity',
    category: 'task' as ActivityCategory,
    status: 'pending' as ActivityStatus,
    priority: 'medium' as ActivityPriority,
    isAllDay: false,
    checklist: [],
    memberIds: [],
    tags: [],
    createdAt: asDateString(now),
    updatedAt: asDateString(now),
    ...overrides,
  };
};

export const createActivityWithDatesFixture = (): Activity => {
  return createActivityFixture({
    startDate: asDateString('2025-06-15'),
    endDate: asDateString('2025-06-15'),
    dueDate: asDateString('2025-06-20'),
  });
};

export const createCompletedActivityFixture = (): Activity => {
  return createActivityFixture({
    status: 'completed' as ActivityStatus,
    completedAt: asDateString(new Date().toISOString()),
  });
};
```

### モックヘルパー

```typescript
// __tests__/mocks/repository-mocks.ts
import { vi } from 'vitest';
import { ActivityRepository } from '../../domain/activity/repository';

export const createMockRepository = (): jest.Mocked<ActivityRepository> => {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    deleteById: vi.fn(),
    findByFilters: vi.fn(),
  };
};
```

### テストデータベースヘルパー

```typescript
// __tests__/helpers/test-database.ts
import Dexie from 'dexie';
import { SharendarDB } from '../../infrastructure/db/schema';

let testDb: SharendarDB;

export const setupTestDatabase = async (): Promise<void> => {
  // テスト用のインメモリデータベース
  testDb = new SharendarDB();
  testDb.name = `test-db-${Date.now()}`;
  
  await testDb.open();
};

export const cleanupTestDatabase = async (): Promise<void> => {
  if (testDb) {
    await testDb.delete();
  }
};

export const getTestDatabase = (): SharendarDB => {
  return testDb;
};
```

## テスト実行とCI/CD

### 本ローカル実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm test -- --coverage

# 特定のテストファイルのみ
npm test -- __tests__/domain/activity/operations.test.ts

# テストUI（ブラウザでテスト結果確認）
npm run test:ui
```

### テスト設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

### テストセットアップ

```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// IntersectionObserver のモック
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// ResizeObserver のモック
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));
```

## テストのベストプラクティス

### 1. テスト命名規則

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // テスト実装
    });
  });
});
```

### 2. テストの構造（AAA Pattern）

```typescript
it('should create activity with valid data', () => {
  // Arrange（準備）
  const title = 'テストタスク';
  const category = 'task';
  const priority = 'high';
  
  // Act（実行）
  const result = createActivity(title, category, priority);
  
  // Assert（検証）
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.title).toBe(title);
    expect(result.value.category).toBe(category);
    expect(result.value.priority).toBe(priority);
  }
});
```

### 3. Brand型テストのベストプラクティス

```typescript
// ❌ 避けるべきパターン
const activity = { id: 'test-1', title: 'テスト' };

// ✅ 推奨パターン
const activity = createActivityFixture({
  id: asActivityId('test-1'),
  title: asActivityTitle('テスト')
});
```

### 4. エラーケースのテスト

```typescript
it('should handle repository error gracefully', async () => {
  mockRepository.save.mockResolvedValue(
    err(new RepositoryError('SAVE_FAILED', 'Database connection failed'))
  );
  
  const result = await useCase.createActivity(validCommand);
  
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(RepositoryError);
    expect(result.error.code).toBe('SAVE_FAILED');
  }
});
```

### 5. 非同期処理のテスト

```typescript
it('should handle async operations correctly', async () => {
  const promise = useCase.createActivity(command);
  
  // ロード中の状態確認
  expect(store.getState().isLoading).toBe(true);
  
  // 完了後の状態確認
  await promise;
  expect(store.getState().isLoading).toBe(false);
});
```

## 関連ドキュメント

- [アーキテクチャ詳細](/docs/architecture.md) - 全体設計と技術スタック
- [ドメインモデル](/docs/domain-models.md) - 統一Activityドメインの詳細仕様
- [API設計パターン](/docs/api-patterns.md) - Repository, UseCase, Error handling patterns