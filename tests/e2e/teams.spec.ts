import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Команды', () => {
  test('гость видит список команд', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await expect(page.locator('.teams-table-row').first()).toBeVisible();
  });

  test('можно открыть профиль команды', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    
    await expect(page.locator('.teams-table-row').first()).toBeVisible();
    
    await page.click('.teams-table-row >> nth=0');
    
    await page.waitForURL(/\/teams\/[a-f0-9-]+/);
    
    await expect(page.locator('h1, .team-name').first()).toBeVisible({ timeout: 10000 });
    
    expect(page.url()).toMatch(/\/teams\/[a-f0-9-]+/);
  });
});