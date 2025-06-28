import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings page elements', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('設定');
    
    // Check family members section
    await expect(page.getByRole('heading', { name: '家族メンバー' })).toBeVisible();
    await expect(page.getByText('(2人)')).toBeVisible();
    await expect(page.getByRole('button', { name: '追加' })).toBeVisible();
  });

  test('should display family members', async ({ page }) => {
    // Check Taro
    await expect(page.getByRole('heading', { name: '太郎' })).toBeVisible();
    await expect(page.getByText('👦')).toBeVisible();
    await expect(page.getByText('#0ea5e9')).toBeVisible();
    await expect(page.getByRole('button', { name: '太郎を編集' })).toBeVisible();
    await expect(page.getByRole('button', { name: '太郎を削除' })).toBeVisible();
    
    // Check Hanako
    await expect(page.getByRole('heading', { name: '花子' })).toBeVisible();
    await expect(page.getByText('👧')).toBeVisible();
    await expect(page.getByText('#06b6d4')).toBeVisible();
    await expect(page.getByRole('button', { name: '花子を編集' })).toBeVisible();
    await expect(page.getByRole('button', { name: '花子を削除' })).toBeVisible();
  });

  test('should display family member information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '家族メンバーについて' })).toBeVisible();
    
    const infoList = page.getByRole('listitem');
    await expect(infoList).toHaveCount(3);
    await expect(infoList.nth(0)).toContainText('家族メンバーを追加すると、予定やタスクを割り当てできます');
    await expect(infoList.nth(1)).toContainText('色分けで誰の予定やタスクかが一目で分かります');
    await expect(infoList.nth(2)).toContainText('アバターを設定して個性を表現できます');
  });

  test('should display future features', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '今後の機能' })).toBeVisible();
    
    // Check data export feature
    await expect(page.getByRole('heading', { name: 'データエクスポート' })).toBeVisible();
    await expect(page.getByText('家族の予定やタスクをバックアップ・共有')).toBeVisible();
    
    // Check notification settings feature
    await expect(page.getByRole('heading', { name: '通知設定' })).toBeVisible();
    await expect(page.getByText('予定やタスクのリマインダー設定')).toBeVisible();
    
    // Check theme settings feature
    await expect(page.getByRole('heading', { name: 'テーマ設定' })).toBeVisible();
    await expect(page.getByText('ダークモードやカスタムテーマ')).toBeVisible();
    
    // Check PWA settings feature
    await expect(page.getByRole('heading', { name: 'PWA設定' })).toBeVisible();
    await expect(page.getByText('ホーム画面への追加とオフライン設定')).toBeVisible();
  });

  test('should have action buttons for each member', async ({ page }) => {
    // Check edit buttons
    const editButtons = page.getByRole('button', { name: /を編集/ });
    await expect(editButtons).toHaveCount(2);
    
    // Check delete buttons
    const deleteButtons = page.getByRole('button', { name: /を削除/ });
    await expect(deleteButtons).toHaveCount(2);
  });
});