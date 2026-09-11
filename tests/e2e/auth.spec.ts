import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chromium', () => {
  test('успешный вход', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    
    await page.fill('input[name="username"], input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    
    await expect(page.locator('text=admin_vlad, text=Выйти, [data-testid="user-menu"]')
      .first()).toBeVisible({ timeout: 10000 });
  });
  
  test('неудачный вход', async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    
    await page.fill('input[name="username"], input[type="text"]', 'admin_vlad');
    await page.fill('input[type="password"]', 'wrong_password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
