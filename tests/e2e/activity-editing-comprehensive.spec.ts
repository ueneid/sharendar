import { test, expect } from '@playwright/test';

test.describe('Activity編集機能 - 包括的テスト', () => {
  test.beforeEach(async ({ page }) => {
    // データベースをクリアして初期状態にする
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    await page.reload();
  });

  test('カレンダーページでのActivity編集', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // イベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '編集前イベント');
    await page.fill('textarea#description', '編集前の説明');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    await page.selectOption('select#assignedMember', 'taro');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // 編集フォームが開くことを確認
    await expect(page.getByText('アクティビティ編集')).toBeVisible();
    
    // 既存の値が正しく表示されることを確認
    await expect(page.locator('input#title')).toHaveValue('編集前イベント');
    await expect(page.locator('textarea#description')).toHaveValue('編集前の説明');
    await expect(page.locator('select#category')).toHaveValue('event');
    await expect(page.locator('input#startDate')).toHaveValue('2026-01-15');
    await expect(page.locator('input#startTime')).toHaveValue('10:00');
    await expect(page.locator('input#endTime')).toHaveValue('11:00');
    await expect(page.locator('select#assignedMember')).toHaveValue('taro');
    
    // 値を変更
    await page.fill('input#title', '編集後イベント');
    await page.fill('textarea#description', '編集後の説明');
    await page.selectOption('select#category', 'meeting');
    await page.fill('input#startTime', '14:00');
    await page.fill('input#endTime', '15:30');
    await page.selectOption('select#assignedMember', 'hanako');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 更新された内容が表示されることを確認
    await expect(page.getByText('編集後イベント')).toBeVisible();
    await expect(page.getByText('編集後の説明')).toBeVisible();
    await expect(page.getByText('👧')).toBeVisible(); // 花子のアイコン
  });

  test('タスクページでのActivity編集', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '編集前タスク');
    await page.fill('textarea#description', '編集前の説明');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'low');
    await page.fill('input#dueDate', '2026-01-20');
    await page.fill('input#dueTime', '15:00');
    await page.selectOption('select#assignedMember', 'taro');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // 編集フォームが開くことを確認
    await expect(page.getByText('アクティビティ編集')).toBeVisible();
    
    // 既存の値が正しく表示されることを確認
    await expect(page.locator('input#title')).toHaveValue('編集前タスク');
    await expect(page.locator('textarea#description')).toHaveValue('編集前の説明');
    await expect(page.locator('select#category')).toHaveValue('task');
    await expect(page.locator('select#priority')).toHaveValue('low');
    await expect(page.locator('input#dueDate')).toHaveValue('2026-01-20');
    await expect(page.locator('input#dueTime')).toHaveValue('15:00');
    await expect(page.locator('select#assignedMember')).toHaveValue('taro');
    
    // 値を変更
    await page.fill('input#title', '編集後タスク');
    await page.fill('textarea#description', '編集後の説明');
    await page.selectOption('select#category', 'deadline');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-01-25');
    await page.fill('input#dueTime', '23:59');
    await page.selectOption('select#assignedMember', 'hanako');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 更新された内容が表示されることを確認
    await expect(page.getByText('編集後タスク')).toBeVisible();
    await expect(page.getByText('編集後の説明')).toBeVisible();
    await expect(page.getByText('👧')).toBeVisible(); // 花子のアイコン
    
    // 優先度が高（赤色）に変更されていることを確認
    await expect(page.locator('[data-testid="activity-card"]')).toHaveClass(/border-l-red-400/);
  });

  test('カテゴリ変更時のフィールド表示切り替え', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // イベントカテゴリのActivityを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', 'カテゴリ変更テスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-30');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // イベントカテゴリでは終了時刻が表示されることを確認
    await expect(page.locator('input#endTime')).toBeVisible();
    await expect(page.locator('select#priority')).not.toBeVisible();
    
    // カテゴリをタスクに変更
    await page.selectOption('select#category', 'task');
    
    // タスクカテゴリでは優先度が表示され、終了時刻が非表示になることを確認
    await expect(page.locator('select#priority')).toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    // カテゴリをリマインダーに変更
    await page.selectOption('select#category', 'reminder');
    
    // リマインダーカテゴリでは優先度が非表示になることを確認
    await expect(page.locator('select#priority')).not.toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    // 優先度を設定
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 更新された内容が表示されることを確認
    await expect(page.getByText('カテゴリ変更テスト')).toBeVisible();
  });

  test('編集中のバリデーションエラー処理', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', 'バリデーションテスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-02-01');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // タイトルを削除
    await page.fill('input#title', '');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('タイトルは必須です')).toBeVisible();
    
    // 無効な日付を入力
    await page.fill('input#title', 'バリデーションテスト更新版');
    await page.fill('input#dueDate', '2020-01-01'); // 過去の日付
    
    await page.click('button[type="submit"]');
    
    // 過去日付エラーが表示されることを確認
    await expect(page.getByText('期日は現在より後の日時を設定してください')).toBeVisible();
    
    // 有効な日付に修正
    await page.fill('input#dueDate', '2026-02-15');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 更新された内容が表示されることを確認
    await expect(page.getByText('バリデーションテスト更新版')).toBeVisible();
  });

  test('編集のキャンセル機能', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // イベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '元のタイトル');
    await page.fill('textarea#description', '元の説明');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-10');
    await page.fill('input#startTime', '09:00');
    await page.fill('input#endTime', '10:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // 値を変更
    await page.fill('input#title', '変更されたタイトル');
    await page.fill('textarea#description', '変更された説明');
    await page.selectOption('select#category', 'meeting');
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")');
    
    // フォームが閉じることを確認
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 元の内容が保持されていることを確認
    await expect(page.getByText('元のタイトル')).toBeVisible();
    await expect(page.getByText('元の説明')).toBeVisible();
    
    // 変更されたはずのテキストが表示されていないことを確認
    await expect(page.getByText('変更されたタイトル')).not.toBeVisible();
    await expect(page.getByText('変更された説明')).not.toBeVisible();
  });

  test('複数のActivityを連続して編集', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // 3つのタスクを作成
    const tasks = [
      { title: '編集テスト1', category: 'task', priority: 'low' },
      { title: '編集テスト2', category: 'deadline', priority: 'medium' },
      { title: '編集テスト3', category: 'task', priority: 'high' }
    ];

    for (const task of tasks) {
      await page.click('button[aria-label="タスク追加"]');
      
      await page.fill('input#title', task.title);
      await page.selectOption('select#category', task.category);
      await page.selectOption('select#priority', task.priority);
      await page.fill('input#dueDate', '2026-02-20');
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    }

    // 各タスクを編集
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // 特定のタスクの編集ボタンをクリック
      const taskCard = page.locator('[data-testid="activity-card"]').filter({ hasText: task.title });
      await taskCard.locator('button[aria-label="編集"]').click();
      
      // タイトルに「更新済み」を追加
      await page.fill('input#title', `${task.title} 更新済み`);
      
      // 優先度を変更
      const newPriority = task.priority === 'high' ? 'low' : 'high';
      await page.selectOption('select#priority', newPriority);
      
      // 更新ボタンをクリック
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
      
      // 更新された内容が表示されることを確認
      await expect(page.getByText(`${task.title} 更新済み`)).toBeVisible();
    }

    // 全ての編集が完了していることを確認
    for (const task of tasks) {
      await expect(page.getByText(`${task.title} 更新済み`)).toBeVisible();
    }
  });

  test('メンバー変更の編集', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // メンバーなしのイベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', 'メンバー変更テスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-25');
    await page.fill('input#startTime', '16:00');
    await page.fill('input#endTime', '17:00');
    // メンバーは未選択のまま
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // メンバーを太郎に設定
    await page.selectOption('select#assignedMember', 'taro');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 太郎のアイコンが表示されることを確認
    await expect(page.getByText('👦')).toBeVisible();
    
    // 再度編集してメンバーを花子に変更
    await page.click('button[aria-label="編集"]');
    await page.selectOption('select#assignedMember', 'hanako');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 花子のアイコンが表示されることを確認
    await expect(page.getByText('👧')).toBeVisible();
    
    // 再度編集してメンバーを未選択に戻す
    await page.click('button[aria-label="編集"]');
    await page.selectOption('select#assignedMember', '');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // メンバーアイコンが表示されないことを確認
    await expect(page.getByText('👦')).not.toBeVisible();
    await expect(page.getByText('👧')).not.toBeVisible();
  });

  test('長時間の編集操作とフォームの状態維持', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '長時間編集テスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-03-01');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // フォームを段階的に変更
    await page.fill('input#title', '');
    await page.fill('input#title', '長時間編集テスト 段階1');
    
    // 少し待機
    await page.waitForTimeout(500);
    
    await page.fill('textarea#description', '詳細な説明を追加');
    
    // さらに待機
    await page.waitForTimeout(500);
    
    await page.selectOption('select#category', 'deadline');
    await page.selectOption('select#priority', 'high');
    
    // 最終的に更新
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // すべての変更が正しく反映されることを確認
    await expect(page.getByText('長時間編集テスト 段階1')).toBeVisible();
    await expect(page.getByText('詳細な説明を追加')).toBeVisible();
    await expect(page.locator('[data-testid="activity-card"]')).toHaveClass(/border-l-red-400/);
  });
});