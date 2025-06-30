import { test, expect } from '@playwright/test';

test.describe('ActivityCard編集機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のページに移動
    await page.goto('http://localhost:3001');
    
    // データベースをクリアして初期状態にする
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    
    // ページを再読み込みして初期状態にする
    await page.reload();
  });

  test('ActivityCardの編集ボタンをクリックしてフォームが開く', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    // フォームに入力
    await page.fill('input#title', 'テスト編集タスク');
    await page.fill('textarea#description', '編集前の説明');
    await page.selectOption('select#priority', 'high');
    
    // タスクを作成
    await page.click('button[type="submit"]');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたタスクが表示されることを確認
    await expect(page.getByText('テスト編集タスク')).toBeVisible();
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // 編集フォームが開くことを確認
    await expect(page.getByText('アクティビティ編集')).toBeVisible();
    
    // フォームに既存の値が入力されていることを確認
    await expect(page.locator('input#title')).toHaveValue('テスト編集タスク');
    await expect(page.locator('textarea#description')).toHaveValue('編集前の説明');
    await expect(page.locator('select#priority')).toHaveValue('high');
  });

  test('ActivityCardの編集フォームで値を変更して保存', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '編集前タスク');
    await page.fill('textarea#description', '編集前の説明');
    await page.selectOption('select#priority', 'medium');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // フォームの値を変更
    await page.fill('input#title', '編集後タスク');
    await page.fill('textarea#description', '編集後の説明');
    await page.selectOption('select#priority', 'high');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 更新された内容が表示されることを確認
    await expect(page.getByText('編集後タスク')).toBeVisible();
    await expect(page.getByText('編集後の説明')).toBeVisible();
    
    // 優先度が高（赤色）に変更されていることを確認
    await expect(page.locator('[data-testid="activity-card"]')).toHaveClass(/border-l-red-400/);
  });

  test('編集フォームでキャンセルボタンを押すと変更が保存されない', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // タスクを作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '変更されないタスク');
    await page.fill('textarea#description', '元の説明');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // フォームの値を変更
    await page.fill('input#title', '変更されるはずのタイトル');
    await page.fill('textarea#description', '変更されるはずの説明');
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 元の内容が保持されていることを確認
    await expect(page.getByText('変更されないタスク')).toBeVisible();
    await expect(page.getByText('元の説明')).toBeVisible();
    
    // 変更されたはずのテキストが表示されていないことを確認
    await expect(page.getByText('変更されるはずのタイトル')).not.toBeVisible();
    await expect(page.getByText('変更されるはずの説明')).not.toBeVisible();
  });

  test('カレンダーページでもActivityCard編集機能が動作する', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    // フローティングアクションボタンが表示されるまで待機
    await page.waitForSelector('button[aria-label="イベント追加"]');
    
    // イベントを作成
    await page.click('button[aria-label="イベント追加"]');
    
    // フォームが表示されるまで待機
    await page.waitForSelector('input#title');
    
    await page.fill('input#title', 'カレンダーイベント');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたイベントが表示されるまで待機
    await page.waitForSelector('[data-testid="activity-card"]');
    
    // 作成されたイベントの編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // 編集フォームが開くことを確認
    await expect(page.getByText('アクティビティ編集')).toBeVisible();
    await expect(page.locator('input#title')).toHaveValue('カレンダーイベント');
    await expect(page.locator('select#category')).toHaveValue('event');
  });
});