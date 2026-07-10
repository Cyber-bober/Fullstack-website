import { test, expect } from '@playwright/test';

test.use({ browserName: 'firefox' });

const BASE = 'http://localhost:3000';

test.describe('Firefox', () => {
  test('главная открывается', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('вход с неверным паролем', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await page.fill('input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/auth\/signin/);
  });
});