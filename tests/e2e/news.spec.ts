import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Новости', () => {
  test('гость видит новости', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('.news-list')).toBeVisible();
  });

  test('админ может создать новость', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await page.fill('input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE);

    await page.click('button:has-text("Добавить новость")');
    await page.fill('input[placeholder*="заголовок"]', 'Тестовая новость');
    await page.fill('textarea[placeholder*="текст"]', 'Содержание тестовой новости для проверки');
    await page.click('button:has-text("Создать")');
    
    await expect(page.locator('.news-title').first()).toContainText('Тестовая новость');
  });
});