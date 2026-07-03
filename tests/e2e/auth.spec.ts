import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Три браузера: chromium, firefox, webkit
test.use({ browserName: 'chromium' });

test.describe('Chromium', () => {
  test('главная открывается', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('гость видит команды', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('вход с неверным паролем', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await page.fill('input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/auth\/signin/);
  });

  test('успешный вход', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await page.fill('input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE);
  });
});

test.describe('Firefox', () => {
  test.use({ browserName: 'firefox' });

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

test.describe('Safari (WebKit)', () => {
  test.use({ browserName: 'webkit' });

  test('главная открывается', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('форма входа существует', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});
