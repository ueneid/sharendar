import { test, expect } from '@playwright/test';

test.describe('Calendar Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('should display calendar page elements', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('カレンダー');
    
    // Check calendar header
    await expect(page.getByRole('heading', { level: 2 })).toContainText(/\d{4}年 \d{1,2}月/);
    
    // Check navigation buttons
    await expect(page.getByRole('button').first()).toBeVisible(); // Previous month
    await expect(page.getByRole('button').nth(1)).toBeVisible(); // Next month
    
    // Check weekday headers
    await expect(page.getByText('日')).toBeVisible();
    await expect(page.getByText('月')).toBeVisible();
    await expect(page.getByText('火')).toBeVisible();
    await expect(page.getByText('水')).toBeVisible();
    await expect(page.getByText('木')).toBeVisible();
    await expect(page.getByText('金')).toBeVisible();
    await expect(page.getByText('土')).toBeVisible();
    
    // Check add event button
    await expect(page.getByRole('button', { name: 'イベント追加' }).last()).toBeVisible();
  });

  test('should display filter panel', async ({ page }) => {
    // Check filter heading
    await expect(page.getByRole('heading', { name: 'フィルター' })).toBeVisible();
    
    // Check member filter
    await expect(page.getByRole('heading', { name: '担当者で絞り込み' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '👦 太郎' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '👧 花子' })).toBeVisible();
    
    // Check category filter
    await expect(page.getByRole('heading', { name: 'カテゴリで絞り込み' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'イベント' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'タスク' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '約束' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '締切' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '会議' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'マイルストーン' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'リマインダー' })).toBeVisible();
    
    // Check display options
    await expect(page.getByRole('heading', { name: '表示オプション' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '完了済みアクティビティを表示' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '完了済みアクティビティを表示' })).toBeChecked();
  });

  test('should navigate between months', async ({ page }) => {
    // Get current month header that contains year and month
    const monthHeader = page.getByRole('heading', { level: 2 }).filter({ hasText: /\d{4}年 \d{1,2}月/ });
    const currentMonth = await monthHeader.textContent();
    
    // Click next month button (usually the second button in calendar header)
    const nextButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await nextButton.click();
    
    // Wait for month header to update
    await expect(monthHeader).not.toHaveText(currentMonth || '');
    const newMonth = await monthHeader.textContent();
    expect(newMonth).not.toBe(currentMonth);
    
    // Go back to current month
    const prevButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await prevButton.click();
    
    // Wait for month header to update back
    await expect(monthHeader).toHaveText(currentMonth || '');
    const backToCurrentMonth = await monthHeader.textContent();
    expect(backToCurrentMonth).toBe(currentMonth);
  });

  test('should toggle filters', async ({ page }) => {
    // Toggle member filter
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await expect(page.getByRole('checkbox', { name: '👦 太郎' })).toBeChecked();
    
    // Toggle category filter
    await page.getByRole('checkbox', { name: 'イベント' }).click();
    await expect(page.getByRole('checkbox', { name: 'イベント' })).toBeChecked();
    
    // Toggle completed activities
    await page.getByRole('checkbox', { name: '完了済みアクティビティを表示' }).click();
    await expect(page.getByRole('checkbox', { name: '完了済みアクティビティを表示' })).not.toBeChecked();
  });

  test('should have add event buttons for each day', async ({ page }) => {
    // Check that calendar days have add buttons
    const addButtons = page.getByRole('button', { name: 'イベント追加' });
    const count = await addButtons.count();
    expect(count).toBeGreaterThan(28); // At least 28 days in a month
  });
});