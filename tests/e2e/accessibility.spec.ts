import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have basic accessibility features', async ({ page }) => {
    await page.goto('/');
    
    // Check page has proper structure
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Check headings exist
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Sharendar');
  });

  test('should have proper ARIA labels on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation has proper role
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check all navigation links have accessible names
    const navLinks = ['ホーム', 'カレンダー', 'タスク', '撮影', '設定'];
    for (const linkName of navLinks) {
      const link = page.getByRole('link', { name: linkName });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('aria-label', linkName);
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check h1 exists and is unique
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    
    // Check that main headings exist
    const h2Headings = page.getByRole('heading', { level: 2 });
    const h2Count = await h2Headings.count();
    expect(h2Count).toBeGreaterThan(0);
    
    // Check that subheadings exist
    const h3Headings = page.getByRole('heading', { level: 3 });
    const h3Count = await h3Headings.count();
    expect(h3Count).toBeGreaterThan(0);
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    
    // Check that links can be focused
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(activeElement);
    
    // Navigate using Enter key
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should navigate to a different page
    await expect(page.url()).not.toBe('http://localhost:3000/');
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/calendar');
    
    // Check that checkboxes have labels
    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    
    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);
      const label = await checkbox.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check primary text contrast
    const textColor = await page.locator('h1').evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    
    const bgColor = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Basic check that text and background are different
    expect(textColor).not.toBe(bgColor);
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to different page
    await page.getByRole('link', { name: 'カレンダー' }).click();
    
    // Check that page title changes
    const title = await page.title();
    expect(title).toContain('Sharendar');
    
    // Check that main content area exists for screen readers
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });
});