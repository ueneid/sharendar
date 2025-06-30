import { test, expect } from '@playwright/test';

test.describe('メンバー割り当て機能', () => {
  test.beforeEach(async ({ page }) => {
    // データベースをクリアして初期状態にする
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    await page.reload();
  });

  test('カレンダーページでメンバー選択とフィルタリング', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // 太郎を担当者にしたイベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '太郎のイベント');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    await page.selectOption('select#assignedMember', 'taro');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 花子を担当者にしたイベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '花子のイベント');
    await page.selectOption('select#category', 'meeting');
    await page.fill('input#startDate', '2026-01-16');
    await page.fill('input#startTime', '14:00');
    await page.fill('input#endTime', '15:00');
    await page.selectOption('select#assignedMember', 'hanako');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // メンバー未選択のイベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '未割り当てイベント');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-17');
    await page.fill('input#startTime', '16:00');
    await page.fill('input#endTime', '17:00');
    // メンバーは選択しない
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 全てのイベントが表示されることを確認
    await expect(page.getByText('太郎のイベント')).toBeVisible();
    await expect(page.getByText('花子のイベント')).toBeVisible();
    await expect(page.getByText('未割り当てイベント')).toBeVisible();
    
    // メンバーアイコンが正しく表示されることを確認
    const taroCard = page.locator('[data-testid="activity-card"]').filter({ hasText: '太郎のイベント' });
    await expect(taroCard.getByText('👦')).toBeVisible();
    
    const hanakoCard = page.locator('[data-testid="activity-card"]').filter({ hasText: '花子のイベント' });
    await expect(hanakoCard.getByText('👧')).toBeVisible();
    
    // 太郎フィルターを有効にする
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    
    // 太郎のイベントのみ表示されることを確認
    await expect(page.getByText('太郎のイベント')).toBeVisible();
    await expect(page.getByText('花子のイベント')).not.toBeVisible();
    await expect(page.getByText('未割り当てイベント')).not.toBeVisible();
    
    // 花子フィルターも有効にする
    await page.getByRole('checkbox', { name: '👧 花子' }).click();
    
    // 太郎と花子の両方のイベントが表示されることを確認
    await expect(page.getByText('太郎のイベント')).toBeVisible();
    await expect(page.getByText('花子のイベント')).toBeVisible();
    await expect(page.getByText('未割り当てイベント')).not.toBeVisible();
    
    // フィルターを解除
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await page.getByRole('checkbox', { name: '👧 花子' }).click();
    
    // 全てのイベントが再び表示されることを確認
    await expect(page.getByText('太郎のイベント')).toBeVisible();
    await expect(page.getByText('花子のイベント')).toBeVisible();
    await expect(page.getByText('未割り当てイベント')).toBeVisible();
  });

  test('タスクページでメンバー選択とフィルタリング', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // 太郎を担当者にしたタスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '太郎のタスク');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-01-20');
    await page.selectOption('select#assignedMember', 'taro');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 花子を担当者にしたタスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '花子のタスク');
    await page.selectOption('select#category', 'deadline');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-01-25');
    await page.selectOption('select#assignedMember', 'hanako');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // メンバー未選択のタスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '未割り当てタスク');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'low');
    await page.fill('input#dueDate', '2026-01-30');
    // メンバーは選択しない
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 全てのタスクが表示されることを確認
    await expect(page.getByText('太郎のタスク')).toBeVisible();
    await expect(page.getByText('花子のタスク')).toBeVisible();
    await expect(page.getByText('未割り当てタスク')).toBeVisible();
    
    // メンバーアイコンが正しく表示されることを確認
    const taroTaskCard = page.locator('[data-testid="activity-card"]').filter({ hasText: '太郎のタスク' });
    await expect(taroTaskCard.getByText('👦')).toBeVisible();
    
    const hanakoTaskCard = page.locator('[data-testid="activity-card"]').filter({ hasText: '花子のタスク' });
    await expect(hanakoTaskCard.getByText('👧')).toBeVisible();
    
    // 太郎フィルターを有効にする
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    
    // 太郎のタスクのみ表示されることを確認
    await expect(page.getByText('太郎のタスク')).toBeVisible();
    await expect(page.getByText('花子のタスク')).not.toBeVisible();
    await expect(page.getByText('未割り当てタスク')).not.toBeVisible();
    
    // 花子フィルターも有効にする
    await page.getByRole('checkbox', { name: '👧 花子' }).click();
    
    // 太郎と花子の両方のタスクが表示されることを確認
    await expect(page.getByText('太郎のタスク')).toBeVisible();
    await expect(page.getByText('花子のタスク')).toBeVisible();
    await expect(page.getByText('未割り当てタスク')).not.toBeVisible();
  });

  test('メンバー選択の境界値テスト', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // メンバー選択フィールドのテスト
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', 'メンバー選択テスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-01');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    
    // メンバー選択フィールドのオプションを確認
    const memberSelect = page.locator('select#assignedMember');
    await expect(memberSelect.locator('option[value=""]')).toHaveText('選択してください');
    await expect(memberSelect.locator('option[value="taro"]')).toHaveText('👦 太郎');
    await expect(memberSelect.locator('option[value="hanako"]')).toHaveText('👧 花子');
    
    // 最初にメンバーを選択
    await page.selectOption('select#assignedMember', 'taro');
    
    // メンバーを変更
    await page.selectOption('select#assignedMember', 'hanako');
    
    // メンバーを未選択に戻す
    await page.selectOption('select#assignedMember', '');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // メンバー未選択でもActivityが作成されることを確認
    await expect(page.getByText('メンバー選択テスト')).toBeVisible();
    
    // メンバーアイコンが表示されないことを確認
    const activityCard = page.locator('[data-testid="activity-card"]').filter({ hasText: 'メンバー選択テスト' });
    await expect(activityCard.getByText('👦')).not.toBeVisible();
    await expect(activityCard.getByText('👧')).not.toBeVisible();
  });

  test('複数メンバーの複合フィルタリング', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // 様々な組み合わせのタスクを作成
    const tasks = [
      { title: '太郎の高優先度タスク', member: 'taro', category: 'task', priority: 'high' },
      { title: '太郎の低優先度タスク', member: 'taro', category: 'task', priority: 'low' },
      { title: '花子の高優先度タスク', member: 'hanako', category: 'deadline', priority: 'high' },
      { title: '花子の中優先度タスク', member: 'hanako', category: 'task', priority: 'medium' },
      { title: '未割り当て高優先度タスク', member: '', category: 'task', priority: 'high' },
      { title: '未割り当てリマインダー', member: '', category: 'reminder', priority: null }
    ];

    for (const task of tasks) {
      await page.click('button[aria-label="タスク追加"]');
      
      await page.fill('input#title', task.title);
      await page.selectOption('select#category', task.category);
      
      if (task.priority) {
        await page.selectOption('select#priority', task.priority);
      }
      
      await page.fill('input#dueDate', '2026-02-15');
      
      if (task.member) {
        await page.selectOption('select#assignedMember', task.member);
      }
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    }

    // 全てのタスクが表示されることを確認
    for (const task of tasks) {
      await expect(page.getByText(task.title)).toBeVisible();
    }

    // 太郎フィルターとタスクカテゴリフィルターを有効にする
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await page.getByRole('checkbox', { name: 'タスク' }).click();
    
    // 太郎のタスクカテゴリのみ表示されることを確認
    await expect(page.getByText('太郎の高優先度タスク')).toBeVisible();
    await expect(page.getByText('太郎の低優先度タスク')).toBeVisible();
    await expect(page.getByText('花子の高優先度タスク')).not.toBeVisible();
    await expect(page.getByText('花子の中優先度タスク')).not.toBeVisible();
    await expect(page.getByText('未割り当て高優先度タスク')).not.toBeVisible();
    await expect(page.getByText('未割り当てリマインダー')).not.toBeVisible();

    // フィルターを変更：花子フィルターと締切カテゴリフィルターを有効にする
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await page.getByRole('checkbox', { name: 'タスク' }).click();
    await page.getByRole('checkbox', { name: '👧 花子' }).click();
    await page.getByRole('checkbox', { name: '締切' }).click();
    
    // 花子の締切カテゴリのみ表示されることを確認
    await expect(page.getByText('太郎の高優先度タスク')).not.toBeVisible();
    await expect(page.getByText('太郎の低優先度タスク')).not.toBeVisible();
    await expect(page.getByText('花子の高優先度タスク')).toBeVisible();
    await expect(page.getByText('花子の中優先度タスク')).not.toBeVisible();
    await expect(page.getByText('未割り当て高優先度タスク')).not.toBeVisible();
    await expect(page.getByText('未割り当てリマインダー')).not.toBeVisible();
  });

  test('メンバー編集とフィルターの動的更新', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // 最初は太郎のイベントとして作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', 'メンバー変更テスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-20');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    await page.selectOption('select#assignedMember', 'taro');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 太郎フィルターを有効にする
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    
    // イベントが表示されることを確認
    await expect(page.getByText('メンバー変更テスト')).toBeVisible();
    
    // イベントを編集してメンバーを花子に変更
    await page.click('button[aria-label="編集"]');
    await page.selectOption('select#assignedMember', 'hanako');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 太郎フィルターが有効なのでイベントが表示されないことを確認
    await expect(page.getByText('メンバー変更テスト')).not.toBeVisible();
    
    // 花子フィルターを有効にする
    await page.getByRole('checkbox', { name: '👧 花子' }).click();
    
    // イベントが再び表示されることを確認
    await expect(page.getByText('メンバー変更テスト')).toBeVisible();
    
    // 花子のアイコンが表示されることを確認
    const activityCard = page.locator('[data-testid="activity-card"]').filter({ hasText: 'メンバー変更テスト' });
    await expect(activityCard.getByText('👧')).toBeVisible();
  });

  test('メンバー関連のアクセシビリティテスト', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // メンバー選択フィールドのラベルとアクセシビリティ属性を確認
    const memberSelect = page.locator('select#assignedMember');
    await expect(memberSelect).toBeVisible();
    
    // ラベルが正しく関連付けられていることを確認
    const memberLabel = page.locator('label[for="assignedMember"]');
    await expect(memberLabel).toBeVisible();
    await expect(memberLabel).toContainText('担当者');
    
    // フィルターのチェックボックスのアクセシビリティを確認
    const taroCheckbox = page.getByRole('checkbox', { name: '👦 太郎' });
    await expect(taroCheckbox).toBeVisible();
    await expect(taroCheckbox).not.toBeChecked();
    
    const hanakoCheckbox = page.getByRole('checkbox', { name: '👧 花子' });
    await expect(hanakoCheckbox).toBeVisible();
    await expect(hanakoCheckbox).not.toBeChecked();
    
    // キーボード操作でメンバーを選択
    await memberSelect.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // フォームの他のフィールドを入力
    await page.fill('input#title', 'アクセシビリティテスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-25');
    await page.fill('input#startTime', '15:00');
    await page.fill('input#endTime', '16:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたイベントが表示されることを確認
    await expect(page.getByText('アクセシビリティテスト')).toBeVisible();
  });

  test('大量のメンバー割り当てActivityでのパフォーマンステスト', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // 多数のActivityを作成（パフォーマンステスト）
    const taskCount = 20;
    
    for (let i = 0; i < taskCount; i++) {
      await page.click('button[aria-label="タスク追加"]');
      
      const member = i % 2 === 0 ? 'taro' : 'hanako';
      const priority = ['low', 'medium', 'high'][i % 3];
      
      await page.fill('input#title', `パフォーマンステスト${i + 1}`);
      await page.selectOption('select#category', 'task');
      await page.selectOption('select#priority', priority);
      await page.fill('input#dueDate', '2026-03-01');
      await page.selectOption('select#assignedMember', member);
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    }

    // フィルターの動作確認
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    
    // 太郎のタスクのみが表示されることを確認（パフォーマンス測定）
    const startTime = Date.now();
    
    // 太郎のタスクが表示されることを確認
    await expect(page.getByText('パフォーマンステスト1')).toBeVisible();
    await expect(page.getByText('パフォーマンステスト3')).toBeVisible();
    
    // 花子のタスクが表示されないことを確認
    await expect(page.getByText('パフォーマンステスト2')).not.toBeVisible();
    await expect(page.getByText('パフォーマンステスト4')).not.toBeVisible();
    
    const endTime = Date.now();
    const filterTime = endTime - startTime;
    
    // フィルタリングが適切な時間内（例：3秒以内）に完了することを確認
    expect(filterTime).toBeLessThan(3000);
    
    // フィルターを解除
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    
    // 全てのタスクが再び表示されることを確認
    await expect(page.getByText('パフォーマンステスト1')).toBeVisible();
    await expect(page.getByText('パフォーマンステスト2')).toBeVisible();
  });
});