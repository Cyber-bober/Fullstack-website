import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Команды', () => {
  test('гость видит список команд', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    
    await page.waitForLoadState('networkidle');
    
    const teamElement = page.locator(
      '.teams-table-row, .team-card, [class*="team"], .team-name, [data-testid="team-item"]'
    ).first();
    
    await expect(teamElement).toBeVisible({ timeout: 15000 });
  });

  test('можно открыть профиль команды', async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await page.waitForLoadState('networkidle');
    
    const teamLink = page.locator(
      '.teams-table-row, .team-card, [class*="team"]'
    ).first();
    
    await expect(teamLink).toBeVisible({ timeout: 15000 });
    await teamLink.click();
    
    await expect(page).toHaveURL(/\/teams\/.+/);
    
    await expect(page.locator('h1, h2, .team-name').first()).toBeVisible();
  });
});