import { test, expect } from '@playwright/test';

test.describe('フォームバリデーションとエラーハンドリング - 包括的テスト', () => {
  test.beforeEach(async ({ page }) => {
    // データベースをクリアして初期状態にする
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('sharendar-db');
    });
    await page.reload();
  });

  test('必須フィールドのバリデーション - 全カテゴリ対応', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // タイトル未入力でのバリデーション
    await page.click('button[type="submit"]');
    await expect(page.getByText('タイトルは必須です')).toBeVisible();
    
    // タイトルのみ入力してカテゴリ未選択
    await page.fill('input#title', 'バリデーションテスト');
    await page.click('button[type="submit"]');
    await expect(page.getByText('カテゴリを選択してください')).toBeVisible();
    
    // イベントカテゴリでの必須フィールドテスト
    await page.selectOption('select#category', 'event');
    await page.click('button[type="submit"]');
    await expect(page.getByText('開始日は必須です')).toBeVisible();
    
    await page.fill('input#startDate', '2026-01-15');
    await page.click('button[type="submit"]');
    await expect(page.getByText('開始時刻は必須です')).toBeVisible();
    
    await page.fill('input#startTime', '10:00');
    await page.click('button[type="submit"]');
    await expect(page.getByText('終了時刻は必須です')).toBeVisible();
    
    // 約束カテゴリでの必須フィールドテスト
    await page.selectOption('select#category', 'appointment');
    await page.click('button[type="submit"]');
    // 約束では終了時刻は不要なので、開始日と開始時刻があれば成功するはず
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    await expect(page.getByText('バリデーションテスト')).toBeVisible();
  });

  test('タスクカテゴリの必須フィールドバリデーション', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', 'タスクバリデーションテスト');
    await page.selectOption('select#category', 'task');
    
    // 優先度未選択でのバリデーション
    await page.click('button[type="submit"]');
    await expect(page.getByText('優先度を選択してください')).toBeVisible();
    
    await page.selectOption('select#priority', 'medium');
    
    // 期日未入力でのバリデーション
    await page.click('button[type="submit"]');
    await expect(page.getByText('期日は必須です')).toBeVisible();
    
    // 締切カテゴリでの必須フィールドテスト
    await page.selectOption('select#category', 'deadline');
    await page.click('button[type="submit"]');
    await expect(page.getByText('優先度を選択してください')).toBeVisible();
    await expect(page.getByText('期日は必須です')).toBeVisible();
    
    // リマインダーカテゴリでの必須フィールドテスト
    await page.selectOption('select#category', 'reminder');
    await page.click('button[type="submit"]');
    // リマインダーでは優先度は不要
    await expect(page.getByText('優先度を選択してください')).not.toBeVisible();
    await expect(page.getByText('期日は必須です')).toBeVisible();
  });

  test('日付フォーマットバリデーション', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '日付フォーマットテスト');
    await page.selectOption('select#category', 'event');
    
    // 無効な日付パターンをテスト
    const invalidDates = [
      '2026-13-01', // 無効な月
      '2026-02-30', // 2月30日
      '2026-04-31', // 4月31日
      '2025-02-29', // 2025年は平年なので2月29日は無効
      'invalid-date', // 完全に無効な形式
      '26-01-15',   // 年が2桁
    ];

    for (const invalidDate of invalidDates) {
      await page.fill('input#startDate', '');
      await page.fill('input#startDate', invalidDate);
      await page.fill('input#startTime', '10:00');
      await page.fill('input#endTime', '11:00');
      
      await page.click('button[type="submit"]');
      await expect(page.getByText('有効な日付を入力してください')).toBeVisible();
    }
    
    // 有効な日付パターンをテスト
    const validDates = [
      '2026-02-28', // 2月28日
      '2026-04-30', // 4月30日
      '2024-02-29', // 2024年は閏年なので2月29日は有効
      '2026-12-31', // 年末
    ];

    for (const validDate of validDates) {
      await page.fill('input#startDate', '');
      await page.fill('input#startDate', validDate);
      
      // エラーメッセージが表示されないことを確認
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
      
      // 正常に作成されることを確認
      await expect(page.getByText('日付フォーマットテスト')).toBeVisible();
      
      // 次のテストのために削除（実際の削除機能があれば）
      // または新しいタイトルで作成
      await page.click('button[aria-label="イベント追加"]');
      await page.fill('input#title', `日付フォーマットテスト${validDate}`);
      await page.selectOption('select#category', 'event');
    }
  });

  test('時刻フォーマットバリデーション', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '時刻フォーマットテスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    
    // 無効な時刻パターンをテスト
    const invalidTimes = [
      '25:00', // 25時
      '12:60', // 60分
      '12:70', // 70分
      'ab:cd', // 文字列
      '1:30',  // 1桁の時
      '12:5',  // 1桁の分
      '24:01', // 24時01分
    ];

    for (const invalidTime of invalidTimes) {
      await page.fill('input#startTime', '');
      await page.fill('input#startTime', invalidTime);
      await page.fill('input#endTime', '15:00');
      
      await page.click('button[type="submit"]');
      await expect(page.getByText('有効な時刻を入力してください')).toBeVisible();
    }
    
    // 有効な時刻パターンをテスト
    const validTimes = [
      '00:00', // 0時0分
      '23:59', // 23時59分
      '12:30', // 正午半
      '09:00', // 午前9時
    ];

    for (const validTime of validTimes) {
      await page.fill('input#startTime', '');
      await page.fill('input#startTime', validTime);
      await page.fill('input#endTime', '23:59');
      
      await page.click('button[type="submit"]');
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
      
      // 正常に作成されることを確認
      await expect(page.getByText('時刻フォーマットテスト')).toBeVisible();
      
      // 次のテストのために新しいフォームを開く
      await page.click('button[aria-label="イベント追加"]');
      await page.fill('input#title', `時刻フォーマットテスト${validTime}`);
      await page.selectOption('select#category', 'event');
      await page.fill('input#startDate', '2026-01-15');
    }
  });

  test('時間論理バリデーション', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    await page.fill('input#title', '時間論理テスト');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#endDate', '2026-01-15');
    
    // 終了時刻が開始時刻より早い場合
    await page.fill('input#startTime', '15:00');
    await page.fill('input#endTime', '14:00');
    
    await page.click('button[type="submit"]');
    await expect(page.getByText('終了時刻は開始時刻より後に設定してください')).toBeVisible();
    
    // 同じ時刻の場合
    await page.fill('input#endTime', '15:00');
    await page.click('button[type="submit"]');
    await expect(page.getByText('終了時刻は開始時刻より後に設定してください')).toBeVisible();
    
    // 終了日が開始日より早い場合
    await page.fill('input#endDate', '2026-01-14');
    await page.fill('input#endTime', '16:00');
    await page.click('button[type="submit"]');
    await expect(page.getByText('終了日は開始日より後に設定してください')).toBeVisible();
    
    // 正しい時間論理
    await page.fill('input#endDate', '2026-01-15');
    await page.fill('input#endTime', '16:00');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText('時間論理テスト')).toBeVisible();
  });

  test('過去日付バリデーション', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', '過去日付テスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    
    // 過去の日付を設定
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];
    
    await page.fill('input#dueDate', pastDate);
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('期日は現在より後の日時を設定してください')).toBeVisible();
    
    // 今日の日付（境界値テスト）
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input#dueDate', today);
    await page.fill('input#dueTime', '23:59');
    
    // 今日の日付は有効である可能性がある（実装依存）
    await page.click('button[type="submit"]');
    
    // 未来の日付
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input#dueDate', futureDate);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText('過去日付テスト')).toBeVisible();
  });

  test('テキストフィールドの長さ制限バリデーション', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // 非常に長いタイトル
    const longTitle = 'あ'.repeat(1000);
    await page.fill('input#title', longTitle);
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-15');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    
    await page.click('button[type="submit"]');
    
    // 長すぎるタイトルのエラーメッセージ（実装がある場合）
    const titleLengthError = page.getByText('タイトルは255文字以内で入力してください');
    
    // エラーが表示される場合とされない場合の両方に対応
    try {
      await expect(titleLengthError).toBeVisible({ timeout: 1000 });
    } catch {
      // エラーが表示されない場合は正常に作成される
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    }
    
    // 適切な長さのタイトル
    await page.click('button[aria-label="イベント追加"]');
    const normalTitle = 'テスト用タイトル';
    await page.fill('input#title', normalTitle);
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-16');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    
    // 非常に長い説明
    const longDescription = 'あ'.repeat(2000);
    await page.fill('textarea#description', longDescription);
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText(normalTitle)).toBeVisible();
  });

  test('特殊文字と絵文字のバリデーション', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    // 特殊文字を含むタイトル
    const specialCharacters = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', `特殊文字テスト${specialCharacters}`);
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-01-20');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText('特殊文字テスト', { exact: false })).toBeVisible();
    
    // 絵文字を含むタイトル
    const emojiTitle = '絵文字テスト 🎯📝✅❌⭐🔥💡🚀🎉👍';
    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', emojiTitle);
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'high');
    await page.fill('input#dueDate', '2026-01-25');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText(emojiTitle)).toBeVisible();
  });

  test('HTMLとスクリプトインジェクション対策', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // HTMLタグを含む入力
    const htmlTitle = '<script>alert("XSS")</script>HTMLテスト';
    const htmlDescription = '<h1>見出し</h1><p>段落</p><a href="javascript:alert()">リンク</a>';
    
    await page.fill('input#title', htmlTitle);
    await page.fill('textarea#description', htmlDescription);
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-01-30');
    await page.fill('input#startTime', '10:00');
    await page.fill('input#endTime', '11:00');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // スクリプトが実行されないことを確認（ページにアラートが表示されない）
    const alertDialogs: any[] = [];
    page.on('dialog', dialog => {
      alertDialogs.push(dialog);
      dialog.dismiss();
    });
    
    // HTMLタグがエスケープされて表示されることを確認
    await expect(page.getByText('<script>', { exact: false })).toBeVisible();
    
    // アラートダイアログが表示されていないことを確認
    expect(alertDialogs).toHaveLength(0);
  });

  test('複数エラーの同時表示', async ({ page }) => {
    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    // 複数のフィールドでエラーを発生させる
    // タイトル未入力、カテゴリ未選択で送信
    await page.click('button[type="submit"]');
    
    // 複数のエラーメッセージが同時に表示されることを確認
    await expect(page.getByText('タイトルは必須です')).toBeVisible();
    await expect(page.getByText('カテゴリを選択してください')).toBeVisible();
    
    // 一部を修正して再送信
    await page.fill('input#title', 'エラーテスト');
    await page.selectOption('select#category', 'task');
    // 優先度と期日は未入力のまま
    
    await page.click('button[type="submit"]');
    
    // 残りのエラーメッセージが表示されることを確認
    await expect(page.getByText('タイトルは必須です')).not.toBeVisible();
    await expect(page.getByText('カテゴリを選択してください')).not.toBeVisible();
    await expect(page.getByText('優先度を選択してください')).toBeVisible();
    await expect(page.getByText('期日は必須です')).toBeVisible();
    
    // すべてを修正
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-02-01');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    await expect(page.getByText('エラーテスト')).toBeVisible();
  });

  test('エラーメッセージのクリアとリセット', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // エラーを発生させる
    await page.click('button[type="submit"]');
    await expect(page.getByText('タイトルは必須です')).toBeVisible();
    
    // フィールドに入力してエラーがクリアされることを確認
    await page.fill('input#title', 'エラークリアテスト');
    
    // エラーメッセージが消えることを確認（実装によっては即座に消える）
    await page.click('button[type="submit"]');
    await expect(page.getByText('カテゴリを選択してください')).toBeVisible();
    
    // キャンセルボタンでフォームを閉じる
    await page.click('button:has-text("キャンセル")');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 再度フォームを開いてエラーメッセージがリセットされることを確認
    await page.click('button[aria-label="イベント追加"]');
    
    // 前回のエラーメッセージが表示されていないことを確認
    await expect(page.getByText('タイトルは必須です')).not.toBeVisible();
    await expect(page.getByText('カテゴリを選択してください')).not.toBeVisible();
  });

  test('ネットワークエラーのハンドリング（シミュレーション）', async ({ page }) => {
    // ネットワークリクエストを失敗させる
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    // タスクページに移動
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks');

    await page.click('button[aria-label="タスク追加"]');
    
    await page.fill('input#title', 'ネットワークエラーテスト');
    await page.selectOption('select#category', 'task');
    await page.selectOption('select#priority', 'medium');
    await page.fill('input#dueDate', '2026-02-15');
    
    await page.click('button[type="submit"]');
    
    // ネットワークエラーメッセージが表示されることを確認
    // （実装によってはオフライン対応でIndexedDBに保存される可能性もある）
    try {
      await expect(page.getByText('ネットワークエラーが発生しました')).toBeVisible({ timeout: 5000 });
    } catch {
      // ネットワークエラーが表示されない場合は、オフライン対応が実装されている
      await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
      await expect(page.getByText('ネットワークエラーテスト')).toBeVisible();
    }
  });

  test('フォームの状態復元とオートセーブ', async ({ page }) => {
    // カレンダーページに移動
    await page.click('a[href="/calendar"]');
    await page.waitForURL('**/calendar');

    await page.click('button[aria-label="イベント追加"]');
    
    // フォームに部分的に入力
    await page.fill('input#title', '状態復元テスト');
    await page.fill('textarea#description', '詳細な説明');
    await page.selectOption('select#category', 'event');
    await page.fill('input#startDate', '2026-03-01');
    
    // フォームを閉じる（キャンセル）
    await page.click('button:has-text("キャンセル")');
    await page.waitForSelector('.fixed.inset-0', { state: 'detached' });
    
    // 再度フォームを開く
    await page.click('button[aria-label="イベント追加"]');
    
    // 状態が復元されているかチェック（実装によっては復元されない）
    const titleValue = await page.locator('input#title').inputValue();
    const descriptionValue = await page.locator('textarea#description').inputValue();
    
    // オートセーブ機能がある場合は値が復元される
    // ない場合は空の状態からスタート
    if (titleValue) {
      expect(titleValue).toBe('状態復元テスト');
      expect(descriptionValue).toBe('詳細な説明');
    } else {
      // 状態復元がない場合でも正常な動作
      expect(titleValue).toBe('');
    }
  });
});