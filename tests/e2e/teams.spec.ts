import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Команды', () => {
  test('гость видит список команд', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await expect(page.locator('.team-card').first()).toBeVisible();
  });

  test('можно открыть профиль команды', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await page.click('.team-card >> nth=0');
    await expect(page.locator('.team-name')).toBeVisible();
  });
});