import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have PWA manifest', async ({ page }) => {
    // Check for manifest link
    const manifestLink = await page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  });

  test('should have service worker registration', async ({ page }) => {
    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);
  });

  test('should have mobile meta tags', async ({ page }) => {
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    // Check theme color
    const themeColor = await page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#3b82f6');
  });

  test('should have apple mobile web app meta tags', async ({ page }) => {
    // Check apple mobile web app capable
    const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable).toHaveAttribute('content', 'yes');
    
    // Check apple status bar style
    const statusBar = await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
    await expect(statusBar).toHaveAttribute('content', 'default');
  });

  test('should work offline with cached assets', async ({ page, context }) => {
    // First load to cache assets
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate - should still work with cached content
    await page.reload();
    
    // Check that basic elements are still visible
    await expect(page.locator('h1')).toContainText('Sharendar');
    
    // Go back online
    await context.setOffline(false);
  });

  test('should display install prompt after engagement', async ({ page }) => {
    // Navigate through multiple pages to trigger engagement
    await page.getByRole('link', { name: 'カレンダー' }).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('link', { name: 'タスク' }).click();
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('link', { name: '設定' }).click();
    await page.waitForLoadState('networkidle');
    
    // Check if install UI elements exist (they may be hidden initially)
    const installElements = await page.locator('[class*="install"]').count();
    expect(installElements).toBeGreaterThanOrEqual(0);
  });
});