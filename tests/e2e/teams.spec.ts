import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Команды', () => {
  test('гость видит список команд', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await expect(page.locator('.teams-table-row').first()).toBeVisible();
  });

  test('можно открыть профиль команды', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await page.click('.teams-table-row >> nth=0');
    
    await expect(page.locator('.team-profile-page .team-name').first()).toBeVisible();
  });
});