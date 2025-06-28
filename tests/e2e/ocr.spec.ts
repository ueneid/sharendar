import { test, expect } from '@playwright/test';

test.describe('OCR Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ocr');
  });

  test('should display OCR page elements', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('プリント読み取り');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: '学校のプリントを撮影' })).toBeVisible();
    await expect(page.getByText('プリントを撮影すると、日付や持ち物を自動で読み取ってカレンダーに登録できます')).toBeVisible();
  });

  test('should display capture options', async ({ page }) => {
    // Check camera capture option
    await expect(page.getByText('タップして撮影')).toBeVisible();
    const cameraButton = page.locator('div').filter({ hasText: /^タップして撮影$/ }).first();
    await expect(cameraButton).toBeVisible();
    
    // Check gallery option
    await expect(page.getByText('ギャラリーから選択')).toBeVisible();
    const galleryButton = page.locator('div').filter({ hasText: /^ギャラリーから選択$/ }).first();
    await expect(galleryButton).toBeVisible();
  });

  test('should display recent scans', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '最近の読み取り' })).toBeVisible();
    
    // Check first scan item
    await expect(page.getByText('遠足のお知らせ')).toBeVisible();
    await expect(page.getByText('2024/03/10 読み取り')).toBeVisible();
    await expect(page.getByText('3/15 遠足')).toBeVisible();
    await expect(page.getByText('持ち物: お弁当')).toBeVisible();
    
    // Check second scan item
    await expect(page.getByText('保護者会のご案内')).toBeVisible();
    await expect(page.getByText('2024/03/08 読み取り')).toBeVisible();
    await expect(page.getByText('3/20 保護者会')).toBeVisible();
  });

  test('should have clickable capture areas', async ({ page }) => {
    // Get camera capture area
    const cameraArea = page.locator('div').filter({ hasText: /^タップして撮影$/ }).first();
    await expect(cameraArea).toHaveAttribute('class', /cursor-pointer/);
    
    // Get gallery area
    const galleryArea = page.locator('div').filter({ hasText: /^ギャラリーから選択$/ }).first();
    await expect(galleryArea).toHaveAttribute('class', /cursor-pointer/);
  });
});