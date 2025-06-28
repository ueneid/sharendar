import { test, expect } from '@playwright/test';

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('should display tasks page elements', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('タスク管理');
    
    // Check add task button
    await expect(page.getByRole('button', { name: 'タスク追加' })).toBeVisible();
    
    // Check empty state
    await expect(page.getByRole('heading', { name: 'タスクがありません' })).toBeVisible();
    await expect(page.getByText('新しいタスクを追加して始めましょう')).toBeVisible();
    await expect(page.getByRole('button', { name: '最初のタスクを追加' })).toBeVisible();
  });

  test('should display task filter panel', async ({ page }) => {
    // Check filter heading
    await expect(page.getByRole('heading', { name: 'タスクフィルター' })).toBeVisible();
    
    // Check member filter
    await expect(page.getByRole('heading', { name: '担当者で絞り込み' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '👦 太郎' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '👧 花子' })).toBeVisible();
    
    // Check task type filter
    await expect(page.getByRole('heading', { name: 'タスクタイプで絞り込み' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'タスク' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '締切' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'リマインダー' })).toBeVisible();
    
    // Check status filter
    await expect(page.getByRole('heading', { name: 'ステータスで絞り込み' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '完了済みタスクを表示' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '完了済みタスクを表示' })).toBeChecked();
    
    // Check priority filter placeholder
    await expect(page.getByRole('heading', { name: '優先度で絞り込み' })).toBeVisible();
    await expect(page.getByText('優先度フィルターは今後実装予定です')).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '統計' })).toBeVisible();
    await expect(page.getByText('未完了')).toBeVisible();
    await expect(page.getByText('完了')).toBeVisible();
    
    // Check initial statistics values
    const stats = page.locator('text="0"');
    await expect(stats).toHaveCount(2);
  });

  test('should toggle filters', async ({ page }) => {
    // Toggle member filter
    await page.getByRole('checkbox', { name: '👦 太郎' }).click();
    await expect(page.getByRole('checkbox', { name: '👦 太郎' })).toBeChecked();
    
    // Toggle task type filter
    await page.getByRole('checkbox', { name: 'タスク' }).click();
    await expect(page.getByRole('checkbox', { name: 'タスク' })).toBeChecked();
    
    // Toggle completed tasks
    await page.getByRole('checkbox', { name: '完了済みタスクを表示' }).click();
    await expect(page.getByRole('checkbox', { name: '完了済みタスクを表示' })).not.toBeChecked();
  });

  test('should have consistent add task buttons', async ({ page }) => {
    // Check floating add button
    const floatingAddButton = page.getByRole('button', { name: 'タスク追加' });
    await expect(floatingAddButton).toBeVisible();
    
    // Check empty state add button
    const emptyStateAddButton = page.getByRole('button', { name: '最初のタスクを追加' });
    await expect(emptyStateAddButton).toBeVisible();
  });
});