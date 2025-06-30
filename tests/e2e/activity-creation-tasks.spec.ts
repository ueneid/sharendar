import { test, expect } from '@playwright/test';

test.describe('タスクページ - Activity作成機能', () => {
  test.beforeEach(async ({ page }) => {
    // データベースをクリアして初期状態にする
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    await page.reload();
    
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');
  });

  test('フローティングアクションボタンからタスクを作成', async ({ page }) => {
    // フローティングアクションボタンが表示されるまで待機
    await page.waitForSelector('button[aria-label="タスク追加"]');
    
    // タスク追加ボタンをクリック
    await page.click('button[aria-label="タスク追加"]');
    
    // フォームが表示されることを確認
    await expect(page.getByText('新しいアクティビティ')).toBeVisible();
    
    // フォームに入力
    await page.fill('input#title', 'テストタスク');
    await page.fill('textarea#description', 'テストタスクの説明');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-01-20');
    await page.fill('input#dueTime', '15:00');
    
    // タスクを作成
    await page.click('button[type="submit"]');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたタスクが表示されることを確認
    await expect(page.getByText('テストタスク')).toBeVisible();
    await expect(page.getByText('テストタスクの説明')).toBeVisible();
    
    // 優先度が高（赤色の境界線）で表示されることを確認
    await expect(page.locator('[data-testid="activity-card"]')).toHaveClass(/border-l-red-400/);
  });

  test('空の状態からタスクを作成', async ({ page }) => {
    // 空の状態のボタンからタスクを作成
    await page.click('button:has-text("最初のタスクを追加")');
    
    // フォームが表示されることを確認
    await expect(page.getByText('新しいアクティビティ')).toBeVisible();
    
    // フォームに入力
    await page.fill('input#title', '最初のタスク');
    await page.fill('textarea#description', '空の状態から作成されたタスク');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-01-25');
    
    // タスクを作成
    await page.click('button[type="submit"]');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたタスクが表示されることを確認
    await expect(page.getByText('最初のタスク')).toBeVisible();
    await expect(page.getByText('空の状態から作成されたタスク')).toBeVisible();
    
    // 空の状態メッセージが消えることを確認
    await expect(page.getByText('タスクがありません')).not.toBeVisible();
  });

  test('異なる優先度のタスクを作成', async ({ page }) => {
    const priorities = [
      { value: 'low', name: '低', color: 'border-l-gray-400' },
      { value: 'medium', name: '中', color: 'border-l-yellow-400' },
      { value: 'high', name: '高', color: 'border-l-red-400' }
    ];

    for (const priority of priorities) {
      await page.click('button[aria-label="タスク追加"]');
      
      await page.fill('input#title', `${priority.name}優先度タスク`);
      await page.selectOption('select#category', 'task');
      await page.selectOption('select#priority', priority.value);
      await page.fill('input#dueDate', '2026-01-30');
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
      
      // 作成されたタスクが表示されることを確認
      await expect(page.getByText(`${priority.name}優先度タスク`)).toBeVisible();
      
      // 適切な優先度の色が表示されることを確認
      const taskCard = page.locator('[data-testid="activity-card"]').filter({ hasText: `${priority.name}優先度タスク` });
      await expect(taskCard).toHaveClass(new RegExp(priority.color));
    }
  });

  test('締切カテゴリのActivityを作成', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '重要な締切');
    await page.selectOption('select#category', 'deadline');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-02-01');
    await page.fill('input#dueTime', '23:59');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('重要な締切')).toBeVisible();
  });

  test('リマインダーカテゴリのActivityを作成', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '重要なリマインダー');
    await page.selectOption('select#category', 'reminder');
    await page.fill('input#dueDate', '2026-02-05');
    await page.fill('input#dueTime', '09:00');
    
    // リマインダーでは優先度フィールドが表示されないことを確認
    await expect(page.locator('select#priority')).not.toBeVisible();
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('重要なリマインダー')).toBeVisible();
  });

  test('メンバー割り当てを含むタスクを作成', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', 'メンバー付きタスク');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-02-10');
    
    // メンバーを選択
    await page.selectOption('select#assignedMember', 'hanako');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたTaskが表示されることを確認
    await expect(page.getByText('メンバー付きタスク')).toBeVisible();
    
    // メンバーアイコンが表示されることを確認
    await expect(page.getByText('👧')).toBeVisible();
  });

  test('フォームバリデーション - 必須フィールドのテスト', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    // タイトルを空にして送信
    await page.click('button[type="submit"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('タイトルは必須です')).toBeVisible();
    
    // タイトルを入力
    await page.fill('input#title', 'バリデーションテスト');
    
    // カテゴリが未選択で送信
    await page.click('button[type="submit"]');
    
    // カテゴリ選択エラーが表示されることを確認  
    await expect(page.getByText('カテゴリを選択してください')).toBeVisible();
    
    // カテゴリを選択
    await page.selectOption('select#category', 'task');
    
    // 優先度が未選択で送信（タスクカテゴリでは必須）
    await page.click('button[type="submit"]');
    
    // 優先度選択エラーが表示されることを確認
    await expect(page.getByText('優先度を選択してください')).toBeVisible();
  });

  test('期日フォーマットのバリデーション', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '期日テスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    
    // 無効な日付を入力
    await page.fill('input#dueDate', '2026-13-40');
    await page.fill('input#dueTime', '25:70');
    
    await page.click('button[type="submit"]');
    
    // 日付フォーマットエラーが表示されることを確認
    await expect(page.getByText('有効な日付を入力してください')).toBeVisible();
    await expect(page.getByText('有効な時刻を入力してください')).toBeVisible();
  });

  test('過去の日付に対するバリデーション', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '過去日付テスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    
    // 過去の日付を入力
    await page.fill('input#dueDate', '2020-01-01');
    
    await page.click('button[type="submit"]');
    
    // 過去日付エラーが表示されることを確認
    await expect(page.getByText('期日は現在より後の日時を設定してください')).toBeVisible();
  });

  test('フォームのキャンセル機能', async ({ page }) => {
    await page.click('button[aria-label="タスク追加"]');
    
    // フォームに入力
    await page.fill('input#title', 'キャンセルテスト');
    await page.fill('textarea#description', 'キャンセルされる予定の説明');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'high');
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")');
    
    // フォームが閉じることを確認
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // タスクが作成されていないことを確認
    await expect(page.getByText('キャンセルテスト')).not.toBeVisible();
    
    // 空の状態が表示されることを確認
    await expect(page.getByText('タスクがありません')).toBeVisible();
  });

  test('作成後のTask表示とフィルタリング', async ({ page }) => {
    // 複数のTaskを作成
    const tasks = [
      { title: 'フィルター用タスク1', category: 'task', priority: 'high', member: 'taro' },
      { title: 'フィルター用締切1', category: 'deadline', priority: 'medium', member: 'hanako' },
      { title: 'フィルター用リマインダー1', category: 'reminder', priority: null, member: 'taro' }
    ];

    for (const task of tasks) {
      await page.click('button[aria-label="タスク追加"]');
      
      await page.fill('input#title', task.title);
      await page.selectOption('select#category', task.category);
      
      if (task.priority) {
        await page.selectOption('select#priority', task.priority);
      }
      
      await page.fill('input#dueDate', '2026-03-01');
      await page.selectOption('select#assignedMember', task.member);
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    }

    // 全てのTaskが表示されることを確認
    for (const task of tasks) {
      await expect(page.getByText(task.title)).toBeVisible();
    }

    // タスクタイプフィルターをテスト
    await page.getByRole('checkbox', { name: 'タスク' }).click();
    await expect(page.getByText('フィルター用タスク1')).toBeVisible();
    await expect(page.getByText('フィルター用締切1')).not.toBeVisible();
    await expect(page.getByText('フィルター用リマインダー1')).not.toBeVisible();

    // フィルターをリセット
    await page.getByRole('checkbox', { name: 'タスク' }).click();

    // メンバーフィルターをテスト  
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await expect(page.getByText('フィルター用タスク1')).toBeVisible();
    await expect(page.getByText('フィルター用締切1')).not.toBeVisible();
    await expect(page.getByText('フィルター用リマインダー1')).toBeVisible();
  });

  test('統計の更新確認', async ({ page }) => {
    // 初期状態で統計が0であることを確認
    await expect(page.getByText('未完了').locator('..').getByText('0')).toBeVisible();
    await expect(page.getByText('完了').locator('..').getByText('0')).toBeVisible();
    
    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '統計テストタスク');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-03-15');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 未完了統計が1に更新されることを確認
    await expect(page.getByText('未完了').locator('..').getByText('1')).toBeVisible();
    await expect(page.getByText('完了').locator('..').getByText('0')).toBeVisible();
  });

  test('長いテキストを含むタスクの作成', async ({ page }) => {
    const longTitle = 'とても長いタイトルのタスクです。'.repeat(10);
    const longDescription = 'とても長い説明文です。'.repeat(50);
    
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', longTitle);
    await page.fill('textarea#description', longDescription);
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'low');
    await page.fill('input#dueDate', '2026-04-01');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたタスクが表示されることを確認（タイトルの一部でも表示されていれば良い）
    await expect(page.getByText('とても長いタイトルのタスクです。', { exact: false })).toBeVisible();
  });

  test('特殊文字を含むタスクの作成', async ({ page }) => {
    const specialTitle = '特殊文字テスト!@#$%^&*()_+-=[]{}|;:,.<>?';
    const emojiTitle = '絵文字テスト 🎯📝✅❌⭐🔥💡';
    
    // 特殊文字を含むタスク
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', specialTitle);
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-04-05');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText(specialTitle)).toBeVisible();
    
    // 絵文字を含むタスク
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', emojiTitle);
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-04-10');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText(emojiTitle)).toBeVisible();
  });
});