# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Chromium >> гость видит команды
- Location: tests/e2e/auth.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- complementary:
  - navigation:
    - link "Главная":
      - /url: /
    - link "Команды":
      - /url: /teams
    - link "Чат":
      - /url: /chat
    - link "Профиль":
      - /url: /profile
    - link "Настройки":
      - /url: /settings
    - link "Поддержка":
      - /url: /support
  - link "Войти":
    - /url: /auth/signin
- navigation:
  - link "Главная":
    - /url: /
  - link "Команды":
    - /url: /teams
  - link "Чат":
    - /url: /chat
  - link "Профиль":
    - /url: /profile
  - link "Настройки":
    - /url: /settings
  - link "Поддержка":
    - /url: /support
  - link "Войти":
    - /url: /auth/signin
- main:
  - navigation "Breadcrumb":
    - list:
      - listitem:
        - link "Главная":
          - /url: /
      - listitem: / Команды
  - paragraph: Загрузка...
- contentinfo:
  - paragraph: © 2026 RTLive. Все права защищены.
  - navigation:
    - link "Политика конфиденциальности":
      - /url: /privacy-policy
    - link "Пользовательское соглашение":
      - /url: /terms
    - link "Настройки cookies":
      - /url: "#"
    - link "Исходный код":
      - /url: https://github.com/Cyber-bober/Fullstack-website
      - img
      - text: Исходный код
- alert
- dialog "Согласие на использование cookies":
  - paragraph:
    - text: Мы используем cookies для работы системы входа и улучшения сервиса. Продолжая использовать сайт, вы соглашаетесь с нашей
    - link "Политикой конфиденциальности.":
      - /url: /privacy-policy
  - button "Принять"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = 'http://localhost:3000';
  4  | 
  5  | test.describe('Chromium', () => {
  6  |   test('главная открывается', async ({ page }) => {
  7  |     await page.goto(BASE);
  8  |     await expect(page.locator('h1')).toBeVisible();
  9  |   });
  10 | 
  11 |   test('гость видит команды', async ({ page }) => {
  12 |     await page.goto(`${BASE}/teams`);
> 13 |     await expect(page.locator('h1')).toBeVisible();
     |                                      ^ Error: expect(locator).toBeVisible() failed
  14 |   });
  15 | 
  16 |   test('вход с неверным паролем', async ({ page }) => {
  17 |     await page.goto(`${BASE}/auth/signin`);
  18 |     await page.fill('input[type="text"]', 'admin_vlad');
  19 |     await page.fill('input[type="password"]', 'wrong');
  20 |     await page.click('button[type="submit"]');
  21 |     await expect(page).toHaveURL(/auth\/signin/);
  22 |   });
  23 | 
  24 |   test('успешный вход', async ({ page }) => {
  25 |     await page.goto(`${BASE}/auth/signin`);
  26 |     await page.fill('input[type="text"]', 'admin_vlad');
  27 |     await page.fill('input[type="password"]', 'admin123');
  28 |     await page.click('button[type="submit"]');
  29 |     await page.waitForURL(BASE);
  30 |   });
  31 | });
  32 | 
```