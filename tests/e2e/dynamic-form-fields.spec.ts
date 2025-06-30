import { test, expect } from '@playwright/test';

test.describe('カテゴリ切り替えとダイナミックフォームフィールド', () => {
  test.beforeEach(async ({ page }) => {
    // データベースをクリアして初期状態にする
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    await page.reload();
  });

  test('カレンダーページでのカテゴリ切り替えとフィールド表示', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // デフォルト状態では必要最小限のフィールドが表示される
    await expect(page.locator('input#title')).toBeVisible();
    await expect(page.locator('select#category')).toBeVisible();
    
    // イベントカテゴリを選択
    await page.selectOption('select#category', 'event');
    
    // イベントカテゴリ専用フィールドが表示されることを確認
    await expect(page.locator('input#startDate')).toBeVisible();
    await expect(page.locator('input#startTime')).toBeVisible();
    await expect(page.locator('input#endDate')).toBeVisible();
    await expect(page.locator('input#endTime')).toBeVisible();
    
    // タスク専用フィールドは表示されないことを確認
    await expect(page.locator('select#priority')).not.toBeVisible();
    await expect(page.locator('input#dueDate')).not.toBeVisible();
    await expect(page.locator('input#dueTime')).not.toBeVisible();
    
    // 約束カテゴリに変更
    await page.selectOption('select#category', 'appointment');
    
    // 約束カテゴリでは終了時刻関連フィールドが非表示になる
    await expect(page.locator('input#startDate')).toBeVisible();
    await expect(page.locator('input#startTime')).toBeVisible();
    await expect(page.locator('input#endDate')).not.toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    // 会議カテゴリに変更
    await page.selectOption('select#category', 'meeting');
    
    // 会議カテゴリでは全ての時刻フィールドが表示される
    await expect(page.locator('input#startDate')).toBeVisible();
    await expect(page.locator('input#startTime')).toBeVisible();
    await expect(page.locator('input#endDate')).toBeVisible();
    await expect(page.locator('input#endTime')).toBeVisible();
    
    // マイルストーンカテゴリに変更
    await page.selectOption('select#category', 'milestone');
    
    // マイルストーンでは期日フィールドが表示される
    await expect(page.locator('input#dueDate')).toBeVisible();
    await expect(page.locator('input#dueTime')).toBeVisible();
    
    // 開始・終了時刻フィールドは非表示
    await expect(page.locator('input#startTime')).not.toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
  });

  test('タスクページでのカテゴリ切り替えとフィールド表示', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    // タスクカテゴリを選択
    await page.selectOption('select#category', 'task');
    
    // タスクカテゴリ専用フィールドが表示されることを確認
    await expect(page.locator('select#priority')).toBeVisible();
    await expect(page.locator('input#dueDate')).toBeVisible();
    await expect(page.locator('input#dueTime')).toBeVisible();
    
    // イベント専用フィールドは表示されないことを確認
    await expect(page.locator('input#startTime')).not.toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    // 締切カテゴリに変更
    await page.selectOption('select#category', 'deadline');
    
    // 締切カテゴリでも優先度と期日フィールドが表示される
    await expect(page.locator('select#priority')).toBeVisible();
    await expect(page.locator('input#dueDate')).toBeVisible();
    await expect(page.locator('input#dueTime')).toBeVisible();
    
    // リマインダーカテゴリに変更
    await page.selectOption('select#category', 'reminder');
    
    // リマインダーでは優先度フィールドが非表示になる
    await expect(page.locator('select#priority')).not.toBeVisible();
    await expect(page.locator('input#dueDate')).toBeVisible();
    await expect(page.locator('input#dueTime')).toBeVisible();
    
    // イベントカテゴリに変更
    await page.selectOption('select#category', 'event');
    
    // イベントカテゴリでは開始・終了時刻が表示される
    await expect(page.locator('input#startDate')).toBeVisible();
    await expect(page.locator('input#startTime')).toBeVisible();
    await expect(page.locator('input#endDate')).toBeVisible();
    await expect(page.locator('input#endTime')).toBeVisible();
    
    // タスク専用フィールドは非表示
    await expect(page.locator('select#priority')).not.toBeVisible();
    await expect(page.locator('input#dueDate')).not.toBeVisible();
  });

  test('カテゴリ変更時の既存データ保持・クリア動作', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // 共通フィールドに入力
    await page.fill('input#title', '動的フィールドテスト');
    await page.fill('textarea#description', 'テスト説明');
    
    // イベントカテゴリを選択して時刻を入力
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endDate', '2026-01-15');
    await page.fill('input#endTime', '11:00');
    
    // 約束カテゴリに変更
    await page.selectOption('select#category', 'appointment');
    
    // 共通フィールドの値は保持される
    await expect(page.locator('input#title')).toHaveValue('動的フィールドテスト');
    await expect(page.locator('textarea#description')).toHaveValue('テスト説明');
    await expect(page.locator('input#startDate')).toHaveValue('2026-01-15');
    await expect(page.locator('input#startTime')).toHaveValue('10:00');
    
    // 終了時刻フィールドは非表示になる
    await expect(page.locator('input#endDate')).not.toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    // タスクカテゴリに変更
    await page.selectOption('select#category', 'task');
    
    // 共通フィールドは保持される
    await expect(page.locator('input#title')).toHaveValue('動的フィールドテスト');
    await expect(page.locator('textarea#description')).toHaveValue('テスト説明');
    
    // 優先度フィールドが表示される
    await expect(page.locator('select#priority')).toBeVisible();
    
    // 優先度を設定
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-01-20');
    
    // Activity作成
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('動的フィールドテスト')).toBeVisible();
  });

  test('編集時のカテゴリ変更とフィールド動的表示', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // 最初にタスクとして作成
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '編集時カテゴリ変更テスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-01-25');
    await page.fill('input#dueTime', '15:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 編集ボタンをクリック
    await page.click('button[aria-label="編集"]');
    
    // 現在の値が正しく表示されることを確認
    await expect(page.locator('input#title')).toHaveValue('編集時カテゴリ変更テスト');
    await expect(page.locator('select#category')).toHaveValue('task');
    await expect(page.locator('select#priority')).toHaveValue('high');
    await expect(page.locator('input#dueDate')).toHaveValue('2026-01-25');
    await expect(page.locator('input#dueTime')).toHaveValue('15:00');
    
    // カテゴリをイベントに変更
    await page.selectOption('select#category', 'event');
    
    // イベント用フィールドが表示され、タスク用フィールドが非表示になる
    await expect(page.locator('input#startDate')).toBeVisible();
    await expect(page.locator('input#startTime')).toBeVisible();
    await expect(page.locator('input#endDate')).toBeVisible();
    await expect(page.locator('input#endTime')).toBeVisible();
    await expect(page.locator('select#priority')).not.toBeVisible();
    await expect(page.locator('input#dueDate')).not.toBeVisible();
    
    // イベント用フィールドに値を設定
    await page.fill('input#startDate', '2026-01-30');
    await page.fill('input#startTime', '09:00');
    await page.fill('input#endDate', '2026-01-30');
    await page.fill('input#endTime', '10:00');
    
    // カテゴリをリマインダーに変更
    await page.selectOption('select#category', 'reminder');
    
    // リマインダー用フィールドが表示される
    await expect(page.locator('input#dueDate')).toBeVisible();
    await expect(page.locator('input#dueTime')).toBeVisible();
    await expect(page.locator('select#priority')).not.toBeVisible();
    await expect(page.locator('input#startTime')).not.toBeVisible();
    await expect(page.locator('input#endTime')).not.toBeVisible();
    
    // 期日を設定
    await page.fill('input#dueDate', '2026-02-05');
    await page.fill('input#dueTime', '12:00');
    
    // 更新ボタンをクリック
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 更新されたActivityが表示されることを確認
    await expect(page.getByText('編集時カテゴリ変更テスト')).toBeVisible();
  });

  test('必須フィールドのカテゴリ別バリデーション', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', 'バリデーションテスト');
    
    // イベントカテゴリを選択
    await page.selectOption('select#category', 'event');
    
    // 開始日を入力せずに送信
    await page.click('button[type="submit"]');
    
    // イベントカテゴリでは開始日が必須
    await expect(page.getByText('開始日は必須です')).toBeVisible();
    
    // 開始日のみ入力
    await page.fill('input#startDate', '2026-02-01');
    await page.click('button[type="submit"]');
    
    // 開始時刻も必須
    await expect(page.getByText('開始時刻は必須です')).toBeVisible();
    
    // 開始時刻を入力
    await page.fill('input#startTime', '10:00');
    await page.click('button[type="submit"]');
    
    // 終了時刻が必須（イベントカテゴリの場合）
    await expect(page.getByText('終了時刻は必須です')).toBeVisible();
    
    // タスクカテゴリに変更
    await page.selectOption('select#category', 'task');
    
    // 優先度を入力せずに送信
    await page.click('button[type="submit"]');
    
    // タスクカテゴリでは優先度が必須
    await expect(page.getByText('優先度を選択してください')).toBeVisible();
    
    // 優先度のみ入力
    await page.selectOption('select#priority', 'medium');
    await page.click('button[type="submit"]');
    
    // 期日も必須
    await expect(page.getByText('期日は必須です')).toBeVisible();
    
    // リマインダーカテゴリに変更
    await page.selectOption('select#category', 'reminder');
    
    // 期日を入力せずに送信
    await page.click('button[type="submit"]');
    
    // リマインダーカテゴリでは期日が必須（優先度は不要）
    await expect(page.getByText('期日は必須です')).toBeVisible();
    await expect(page.getByText('優先度を選択してください')).not.toBeVisible();
  });

  test('複雑なカテゴリ切り替えシナリオ', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    // 複数回のカテゴリ切り替えを行う
    const categorySequence = [
      { category: 'task', requiredFields: ['select#priority', 'input#dueDate'] },
      { category: 'event', requiredFields: ['input#startDate', 'input#startTime', 'input#endTime'] },
      { category: 'appointment', requiredFields: ['input#startDate', 'input#startTime'] },
      { category: 'deadline', requiredFields: ['select#priority', 'input#dueDate'] },
      { category: 'meeting', requiredFields: ['input#startDate', 'input#startTime', 'input#endTime'] },
      { category: 'milestone', requiredFields: ['input#dueDate'] },
      { category: 'reminder', requiredFields: ['input#dueDate'] }
    ];

    await page.fill('input#title', '複雑切り替えテスト');
    
    for (const { category, requiredFields } of categorySequence) {
      await page.selectOption('select#category', category);
      
      // 各カテゴリで必要なフィールドが表示されることを確認
      for (const field of requiredFields) {
        await expect(page.locator(field)).toBeVisible();
      }
      
      // 少し待機（UIの更新を確実にするため）
      await page.waitForTimeout(100);
    }
    
    // 最終的にタスクカテゴリで完成させる
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'low');
    await page.fill('input#dueDate', '2026-02-10');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 作成されたActivityが表示されることを確認
    await expect(page.getByText('複雑切り替えテスト')).toBeVisible();
  });

  test('カテゴリ固有フィールドの値の自動設定・クリア', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '自動設定テスト');
    
    // イベントカテゴリで全フィールドに値を入力
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-02-15');
    await page.fill('input#startTime', '14:00');
    await page.fill('input#endDate', '2026-02-15');
    await page.fill('input#endTime', '15:00');
    
    // 約束カテゴリに変更（終了時刻フィールドが非表示になる）
    await page.selectOption('select#category', 'appointment');
    
    // 開始時刻の値は保持される
    await expect(page.locator('input#startDate')).toHaveValue('2026-02-15');
    await expect(page.locator('input#startTime')).toHaveValue('14:00');
    
    // 再度イベントカテゴリに戻す
    await page.selectOption('select#category', 'event');
    
    // 終了時刻フィールドが再表示される
    await expect(page.locator('input#endDate')).toBeVisible();
    await expect(page.locator('input#endTime')).toBeVisible();
    
    // 開始時刻の値は保持されている
    await expect(page.locator('input#startDate')).toHaveValue('2026-02-15');
    await expect(page.locator('input#startTime')).toHaveValue('14:00');
    
    // 終了時刻フィールドは空になっている可能性がある（実装依存）
    // これは正常な動作として受け入れる
    
    // 終了時刻を再設定
    await page.fill('input#endDate', '2026-02-15');
    await page.fill('input#endTime', '16:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText('自動設定テスト')).toBeVisible();
  });

  test('フィールド表示切り替えのアニメーション・トランジション', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', 'アニメーションテスト');
    
    // 素早いカテゴリ切り替えでUIが破綻しないことを確認
    const categories = ['task', 'event', 'appointment', 'deadline', 'reminder'];
    
    for (let i = 0; i < 3; i++) { // 3回繰り返し
      for (const category of categories) {
        await page.selectOption('select#category', category);
        // 短い待機時間でUI更新を確認
        await page.waitForTimeout(50);
      }
    }
    
    // 最終的にタスクカテゴリで完成
    await page.selectOption('select#category', 'task');
    await expect(page.locator('select#priority')).toBeVisible();
    await expect(page.locator('input#dueDate')).toBeVisible();
    
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-02-20');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText('アニメーションテスト')).toBeVisible();
  });

  test('カテゴリ変更時のアクセシビリティ保持', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // フォーカス状態の確認
    await page.locator('select#category').focus();
    await page.selectOption('select#category', 'event');
    
    // カテゴリ変更後もフォーカスが適切に維持されることを確認
    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElement).toBe('category');
    
    // 新しく表示されたフィールドにタブで移動できることを確認
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // タイトルフィールドに移動
    await page.keyboard.press('Tab'); // 説明フィールドに移動
    await page.keyboard.press('Tab'); // 開始日フィールドに移動
    
    const newFocusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(newFocusedElement).toBe('startDate');
    
    // ラベルとフィールドの関係が正しく維持されることを確認
    const startDateLabel = page.locator('label[for="startDate"]');
    await expect(startDateLabel).toBeVisible();
    await expect(startDateLabel).toContainText('開始日');
    
    // カテゴリを変更してもアクセシビリティが保持される
    await page.selectOption('select#category', 'task');
    
    // 新しく表示されたフィールドのラベルが正しく設定される
    const priorityLabel = page.locator('label[for="priority"]');
    await expect(priorityLabel).toBeVisible();
    await expect(priorityLabel).toContainText('優先度');
    
    const dueDateLabel = page.locator('label[for="dueDate"]');
    await expect(dueDateLabel).toBeVisible();
    await expect(dueDateLabel).toContainText('期日');
  });
});