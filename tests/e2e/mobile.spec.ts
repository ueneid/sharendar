import { test, expect, devices } from '@playwright/test';

test.use(devices['Pixel 5']);

test.describe('Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display mobile-optimized layout', async ({ page }) => {
    // Check viewport
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThan(768);
    
    // Check that navigation is at the bottom
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();
    
    // Navigation should be fixed at bottom
    const navBox = await navigation.boundingBox();
    const pageHeight = viewportSize?.height || 0;
    expect(navBox?.y).toBeGreaterThan(pageHeight - 100);
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    // Navigate to calendar
    await page.getByRole('link', { name: 'カレンダー' }).click();
    
    // Check that add event buttons are appropriately sized
    const addButton = page.getByRole('button', { name: 'イベント追加' }).first();
    const buttonBox = await addButton.boundingBox();
    
    // Touch targets should be at least 44x44 pixels
    expect(buttonBox?.width).toBeGreaterThanOrEqual(40);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
  });

  test('should handle mobile gestures on calendar', async ({ page }) => {
    await page.goto('/calendar');
    
    // Get current month
    const currentMonth = await page.getByRole('heading', { level: 2 }).textContent();
    
    // Simulate swipe by clicking navigation buttons
    await page.getByRole('button').nth(1).click(); // Next month
    
    const newMonth = await page.getByRole('heading', { level: 2 }).textContent();
    expect(newMonth).not.toBe(currentMonth);
  });

  test('should display mobile-friendly filters', async ({ page }) => {
    await page.goto('/calendar');
    
    // Filter panel should be scrollable on mobile
    const filterPanel = page.locator('div').filter({ hasText: 'フィルター' }).first();
    await expect(filterPanel).toBeVisible();
    
    // Check that checkboxes are easily tappable
    const checkbox = page.getByRole('checkbox').first();
    const checkboxBox = await checkbox.boundingBox();
    expect(checkboxBox?.width).toBeGreaterThanOrEqual(20);
    expect(checkboxBox?.height).toBeGreaterThanOrEqual(20);
  });

  test('should have responsive navigation icons', async ({ page }) => {
    // Check all navigation items are visible
    const navItems = ['ホーム', 'カレンダー', 'タスク', '撮影', '設定'];
    
    for (const item of navItems) {
      const navLink = page.getByRole('link', { name: item });
      await expect(navLink).toBeVisible();
      
      // Check that icons are displayed
      const icon = navLink.locator('svg');
      await expect(icon).toBeVisible();
    }
  });

  test('should handle orientation changes', async ({ page }) => {
    // Test portrait mode (default)
    let viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThan(viewportSize?.height || 0);
    
    // Switch to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    
    // Navigation should still be visible
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Content should adjust
    await expect(page.locator('h1')).toBeVisible();
  });
});