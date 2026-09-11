import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Новости', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await page.fill('input[name="username"], input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
  });

  test('админ может создать новость', async ({ page }) => {
    await page.goto(`${BASE}`);
    
    await page.click('button:has-text("Новости")');
    
    const addBtn = page.locator('button').filter({ hasText: /Добавить новость|Add news|Создать/i }).first();
    await addBtn.click();
    
    await page.fill('input[placeholder*="заголовок" i], input[name="title"]', 'Тестовая новость');
    await page.fill('textarea[placeholder*="содерж" i], textarea[name="content"]', 'Тестовое содержание новости');
    
    await page.click('button[type="submit"]:has-text("Сохранить"), button[type="submit"]:has-text("Создать")');
    
    await expect(page.locator('text=Тестовая новость')).toBeVisible({ timeout: 10000 });
  });
});