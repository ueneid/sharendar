import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate between all pages using bottom navigation', async ({ page }) => {
    // Verify home page
    await expect(page.locator('h1')).toContainText('Sharendar');
    
    // Navigate to Calendar
    await page.getByRole('link', { name: 'カレンダー' }).click();
    await expect(page.url()).toContain('/calendar');
    await expect(page.locator('h1')).toContainText('カレンダー');
    
    // Navigate to Tasks
    await page.getByRole('link', { name: 'タスク' }).click();
    await expect(page.url()).toContain('/tasks');
    await expect(page.locator('h1')).toContainText('タスク管理');
    
    // Navigate to OCR
    await page.getByRole('link', { name: '撮影' }).click();
    await expect(page.url()).toContain('/ocr');
    await expect(page.locator('h1')).toContainText('プリント読み取り');
    
    // Navigate to Settings
    await page.getByRole('link', { name: '設定' }).click();
    await expect(page.url()).toContain('/settings');
    await expect(page.locator('h1')).toContainText('設定');
    
    // Navigate back to Home
    await page.getByRole('link', { name: 'ホーム' }).click();
    await expect(page.url()).toBe('http://localhost:3000/');
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    // Start at home
    await expect(page.getByRole('link', { name: 'ホーム' })).toHaveClass(/text-blue-600/);
    
    // Navigate to calendar
    await page.getByRole('link', { name: 'カレンダー' }).click();
    await expect(page.getByRole('link', { name: 'カレンダー' })).toHaveClass(/text-blue-600/);
    await expect(page.getByRole('link', { name: 'ホーム' })).not.toHaveClass(/text-blue-600/);
  });

  test('should navigate using quick action buttons', async ({ page }) => {
    // Click "予定追加" quick action
    await page.getByRole('link', { name: '予定追加' }).click();
    await expect(page.url()).toContain('/calendar');
    
    // Go back home
    await page.getByRole('link', { name: 'ホーム' }).click();
    
    // Click "タスク追加" quick action
    await page.getByRole('link', { name: 'タスク追加' }).click();
    await expect(page.url()).toContain('/tasks');
    
    // Go back home
    await page.getByRole('link', { name: 'ホーム' }).click();
    
    // Click "メンバー追加" quick action
    await page.getByRole('link', { name: 'メンバー追加' }).click();
    await expect(page.url()).toContain('/settings');
    
    // Go back home
    await page.getByRole('link', { name: 'ホーム' }).click();
    
    // Click "プリント読取" quick action
    await page.getByRole('link', { name: 'プリント読取' }).click();
    await expect(page.url()).toContain('/ocr');
  });
});