import { test, expect } from '@playwright/test';

test.describe('カレンダーページ - Activity作成機能', () => {
  test.beforeEach(async ({ page }) => {
    // データベースをクリアして初期状態にする
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    await page.reload();
    
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');
  });

  test('フローティングアクションボタンからイベントを作成', async ({ page }) => {
    // フローティングアクションボタンが表示されるまで待機
    await page.waitForSelector('button[aria-label="イベント追加"]');
    
    // イベント追加ボタンをクリック
    await page.click('button[aria-label="イベント追加"]');
    
    // フォームが表示されることを確認
    await expect(page.getByText('新しいアクティビティ')).toBeVisible();
    
    // フォームに入力
    await page.fill('input#title', 'テストイベント');
    await page.fill('textarea#description', 'テストイベントの説明');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endDate', '2026-01-15');
    await page.fill('input#endTime', '11:00');
    
    // イベントを作成
    await page.click('button[type="submit"]');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたイベントが表示されることを確認
    await expect(page.getByText('テストイベント')).toBeVisible();
    await expect(page.getByText('テストイベントの説明')).toBeVisible();
  });

  test('カレンダーの特定日付ボタンからイベントを作成', async ({ page }) => {
    // カレンダーの日付ボタンを探す（例：15日）
    const dateButtons = page.getByRole('button', { name: 'イベント追加' });
    const firstDateButton = dateButtons.first();
    await firstDateButton.click();
    
    // フォームが表示されることを確認
    await expect(page.getByText('新しいアクティビティ')).toBeVisible();
    
    // フォームに入力
    await page.fill('input#title', '日付指定イベント');
    await page.fill('textarea#description', '特定日付で作成されたイベント');
    await page.selectOption('select#category', 'event');
    
    // 日付フィールドが自動で設定されているか確認（可能な場合）
    const startDateValue = await page.locator('input#startDate').inputValue();
    expect(startDateValue).toBeTruthy();
    
    // 時間を設定
    await page.fill('input#startTime', '14:00');
    await page.fill('input#endTime', '15:00');
    
    // イベントを作成
    await page.click('button[type="submit"]');
    
    // フォームが閉じるまで待機
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたイベントが表示されることを確認
    await expect(page.getByText('日付指定イベント')).toBeVisible();
  });

  test('異なるカテゴリのActivityを作成', async ({ page }) => {
    // 約束カテゴリのActivityを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '重要な約束');
    await page.selectOption('select#category', 'appointment');
    await page.fill('input#startDate', '2026-01-20');
    await page.fill('input#startTime', '09:00');
    
    // 約束カテゴリでは終了時刻が不要
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('重要な約束')).toBeVisible();
    
    // 会議カテゴリのActivityを作成
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', 'チーム会議');
    await page.selectOption('select#category', 'meeting');
    await page.fill('input#startDate', '2026-01-22');
    await page.fill('input#startTime', '13:00');
    await page.fill('input#endTime', '14:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('チーム会議')).toBeVisible();
  });

  test('メンバー割り当てを含むActivityを作成', async ({ page }) => {
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', 'メンバー付きイベント');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-25');
    await page.fill('input#startTime', '16:00');
    await page.fill('input#endTime', '17:00');
    
    // メンバーを選択
    await page.selectOption('select#assignedMember', 'taro');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('メンバー付きイベント')).toBeVisible();
    
    // メンバーアイコンが表示されることを確認
    await expect(page.getByText('👦')).toBeVisible();
  });

  test('フォームバリデーション - 必須フィールドのテスト', async ({ page }) => {
    await page.click('button[aria-label="イベント追加"]');
    
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
    await page.selectOption('select#category', 'event');
    
    // 開始日が未入力で送信
    await page.click('button[type="submit"]');
    
    // 開始日エラーが表示されることを確認
    await expect(page.getByText('開始日は必須です')).toBeVisible();
  });

  test('日付フォーマットのバリデーション', async ({ page }) => {
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '日付テスト');
    await page.selectOption('select#category', 'event');
    
    // 無効な日付を入力
    await page.fill('input#startDate', '2026-13-40');
    await page.fill('input#startTime', '25:70');
    
    await page.click('button[type="submit"]');
    
    // 日付フォーマットエラーが表示されることを確認
    await expect(page.getByText('有効な日付を入力してください')).toBeVisible();
    await expect(page.getByText('有効な時刻を入力してください')).toBeVisible();
  });

  test('時間論理のバリデーション', async ({ page }) => {
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '時間論理テスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#endDate', '2026-01-15');
    
    // 終了時刻が開始時刻より早い場合
    await page.fill('input#startTime', '15:00');
    await page.fill('input#endTime', '14:00');
    
    await page.click('button[type="submit"]');
    
    // 時間論理エラーが表示されることを確認
    await expect(page.getByText('終了時刻は開始時刻より後に設定してください')).toBeVisible();
  });

  test('フォームのキャンセル機能', async ({ page }) => {
    await page.click('button[aria-label="イベント追加"]');
    
    // フォームに入力
    await page.fill('input#title', 'キャンセルテスト');
    await page.fill('textarea#description', 'キャンセルされる予定の説明');
    await page.selectOption('select#category', 'event');
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")');
    
    // フォームが閉じることを確認
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // Activityが作成されていないことを確認
    await expect(page.getByText('キャンセルテスト')).not.toBeVisible();
  });

  test('作成後のActivity表示とフィルタリング', async ({ page }) => {
    // 複数のActivityを作成
    const activities = [
      { title: 'フィルター用イベント1', category: 'event', member: 'taro' },
      { title: 'フィルター用約束1', category: 'appointment', member: 'hanako' },
      { title: 'フィルター用会議1', category: 'meeting', member: 'taro' }
    ];

    for (const activity of activities) {
      await page.click('button[aria-label="イベント追加"]');
      
      await page.fill('input#title', activity.title);
      await page.selectOption('select#category', activity.category);
      await page.fill('input#startDate', '2026-01-30');
      await page.fill('input#startTime', '10:00');
      
      if (activity.category === 'event' || activity.category === 'meeting') {
        await page.fill('input#endTime', '11:00');
      }
      
      await page.selectOption('select#assignedMember', activity.member);
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    }

    // 全てのActivityが表示されることを確認
    for (const activity of activities) {
      await expect(page.getByText(activity.title)).toBeVisible();
    }

    // カテゴリフィルターをテスト
    await page.getByRole('checkbox', { name: 'イベント' }).click();
    await expect(page.getByText('フィルター用イベント1')).toBeVisible();
    await expect(page.getByText('フィルター用約束1')).not.toBeVisible();
    await expect(page.getByText('フィルター用会議1')).not.toBeVisible();

    // フィルターをリセット
    await page.getByRole('checkbox', { name: 'イベント' }).click();

    // メンバーフィルターをテスト  
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await expect(page.getByText('フィルター用イベント1')).toBeVisible();
    await expect(page.getByText('フィルター用約束1')).not.toBeVisible();
    await expect(page.getByText('フィルター用会議1')).toBeVisible();
  });

  test('長時間のActivityの作成', async ({ page }) => {
    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '長時間イベント');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-01');
    await page.fill('input#startTime', '09:00');
    await page.fill('input#endDate', '2026-02-02');
    await page.fill('input#endTime', '18:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('長時間イベント')).toBeVisible();
  });
});