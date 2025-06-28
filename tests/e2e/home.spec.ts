import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display correct home page content', async ({ page }) => {
    // Check title and subtitle
    await expect(page.locator('h1')).toContainText('Sharendar');
    await expect(page.locator('p')).toContainText('家族の予定とタスクを簡単に共有');
    
    // Check main navigation cards
    await expect(page.getByRole('link', { name: 'カレンダー 家族の予定を管理' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'タスク やることリスト' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'OCR読取 プリントを撮影' })).toBeVisible();
    await expect(page.getByRole('link', { name: '設定 家族メンバー管理' })).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    // Check statistics cards
    await expect(page.getByRole('heading', { name: '家族メンバー' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '未完了タスク' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '完了タスク' })).toBeVisible();
    
    // Check initial values
    await expect(page.getByText('0').first()).toBeVisible();
  });

  test('should display today sections', async ({ page }) => {
    // Check today's schedule section
    await expect(page.getByRole('heading', { name: /今日の予定/ })).toBeVisible();
    await expect(page.getByText('今日の予定はありません')).toBeVisible();
    await expect(page.getByRole('link', { name: 'カレンダーを見る →' })).toBeVisible();
    
    // Check today's tasks section
    await expect(page.getByRole('heading', { name: /今日のタスク/ })).toBeVisible();
    await expect(page.getByText('今日のタスクはありません')).toBeVisible();
    await expect(page.getByRole('link', { name: 'タスク一覧を見る →' })).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'クイックアクション' })).toBeVisible();
    await expect(page.getByRole('link', { name: '予定追加' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'タスク追加' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'メンバー追加' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'プリント読取' })).toBeVisible();
  });

  test('should navigate from main cards', async ({ page }) => {
    // Test calendar card navigation
    await page.getByRole('link', { name: 'カレンダー 家族の予定を管理' }).click();
    await expect(page.url()).toContain('/calendar');
    await page.goBack();
    
    // Test tasks card navigation
    await page.getByRole('link', { name: 'タスク やることリスト' }).click();
    await expect(page.url()).toContain('/tasks');
    await page.goBack();
    
    // Test OCR card navigation
    await page.getByRole('link', { name: 'OCR読取 プリントを撮影' }).click();
    await expect(page.url()).toContain('/ocr');
    await page.goBack();
    
    // Test settings card navigation
    await page.getByRole('link', { name: '設定 家族メンバー管理' }).click();
    await expect(page.url()).toContain('/settings');
  });
});