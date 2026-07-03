# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e/auth.spec.ts >> успешный вход и выход
- Location: tests/e2e/auth.spec.ts:35:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav, aside, header')
Expected: visible
Error: strict mode violation: locator('nav, aside, header') resolved to 4 elements:
    1) <aside class="sidebar">…</aside> aka getByRole('complementary')
    2) <nav class="sidebar-nav">…</nav> aka getByText('ГлавнаяКомандыЧатПрофильНастройкиПоддержка', { exact: true })
    3) <header class="mobile-header">…</header> aka locator('header')
    4) <nav class="mobile-nav">…</nav> aka getByRole('navigation').filter({ hasText: 'ГлавнаяКомандыЧатПрофильНастройкиПоддержкаЗагрузка' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav, aside, header')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - complementary [ref=e2]:
    - navigation [ref=e4]:
      - link "Главная" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic: Главная
      - link "Команды" [ref=e6] [cursor=pointer]:
        - /url: /teams
        - generic: Команды
      - link "Чат" [ref=e7] [cursor=pointer]:
        - /url: /chat
        - generic: Чат
      - link "Профиль" [ref=e8] [cursor=pointer]:
        - /url: /profile
        - generic: Профиль
      - link "Настройки" [ref=e9] [cursor=pointer]:
        - /url: /settings
        - generic: Настройки
      - link "Поддержка" [ref=e10] [cursor=pointer]:
        - /url: /support
        - generic: Поддержка
    - generic [ref=e11]:
      - generic:
        - generic: Загрузка...
  - navigation [ref=e13]:
    - link "Главная" [ref=e14] [cursor=pointer]:
      - /url: /
      - generic [ref=e15]: Главная
    - link "Команды" [ref=e16] [cursor=pointer]:
      - /url: /teams
      - generic [ref=e17]: Команды
    - link "Чат" [ref=e18] [cursor=pointer]:
      - /url: /chat
      - generic [ref=e19]: Чат
    - link "Профиль" [ref=e20] [cursor=pointer]:
      - /url: /profile
      - generic [ref=e21]: Профиль
    - link "Настройки" [ref=e22] [cursor=pointer]:
      - /url: /settings
      - generic [ref=e23]: Настройки
    - link "Поддержка" [ref=e24] [cursor=pointer]:
      - /url: /support
      - generic [ref=e25]: Поддержка
    - generic [ref=e28] [cursor=pointer]: Загрузка...
  - generic [ref=e29]:
    - main [ref=e30]:
      - generic [ref=e31]:
        - heading "RTLive" [level=1] [ref=e33]
        - generic [ref=e34]:
          - button "Новости" [ref=e35] [cursor=pointer]
          - button "Текстовая трансляция" [ref=e36] [cursor=pointer]
          - button "Прямая трансляция" [ref=e37] [cursor=pointer]
          - button "Календарь событий" [ref=e38] [cursor=pointer]
        - textbox "Поиск новостей..." [ref=e40]
        - paragraph [ref=e42]: Новостей пока нет
    - contentinfo [ref=e43]:
      - generic [ref=e44]:
        - paragraph [ref=e45]: © 2026 RTLive. Все права защищены.
        - generic [ref=e46]:
          - link "Политика конфиденциальности" [ref=e47] [cursor=pointer]:
            - /url: /privacy-policy
          - link "Пользовательское соглашение" [ref=e48] [cursor=pointer]:
            - /url: /terms
          - link "Исходный код" [ref=e49] [cursor=pointer]:
            - /url: https://github.com/Cyber-bober/Fullstack-website
            - img [ref=e50]
            - text: Исходный код
  - alert [ref=e52]
  - generic [ref=e53]:
    - paragraph [ref=e54]:
      - text: Мы используем cookies для работы системы входа и улучшения сервиса. Продолжая использовать сайт, вы соглашаетесь с нашей
      - link "Политикой конфиденциальности" [ref=e55] [cursor=pointer]:
        - /url: /privacy-policy
      - text: .
    - button "Принять" [ref=e56] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = 'http://localhost:3000';
  4  | 
  5  | test('главная открывается без авторизации', async ({ page }) => {
  6  |   await page.goto(BASE);
  7  |   await expect(page.locator('h1')).toBeVisible();
  8  | });
  9  | 
  10 | test('гость не может зайти в профиль', async ({ page }) => {
  11 |   await page.goto(`${BASE}/profile`);
  12 |   await expect(page).toHaveURL(/auth\/signin/);
  13 | });
  14 | 
  15 | test('гость видит команды', async ({ page }) => {
  16 |   await page.goto(`${BASE}/teams`);
  17 |   await expect(page.locator('h1')).toBeVisible();
  18 | });
  19 | 
  20 | test('форма входа существует', async ({ page }) => {
  21 |   await page.goto(`${BASE}/auth/signin`);
  22 |   await expect(page.locator('input[type="text"]')).toBeVisible();
  23 |   await expect(page.locator('input[type="password"]')).toBeVisible();
  24 |   await expect(page.locator('button[type="submit"]')).toBeVisible();
  25 | });
  26 | 
  27 | test('вход с неверным паролем показывает ошибку', async ({ page }) => {
  28 |   await page.goto(`${BASE}/auth/signin`);
  29 |   await page.fill('input[type="text"]', 'admin_vlad');
  30 |   await page.fill('input[type="password"]', 'wrong');
  31 |   await page.click('button[type="submit"]');
  32 |   await expect(page).toHaveURL(/auth\/signin/);
  33 | });
  34 | 
  35 | test('успешный вход и выход', async ({ page }) => {
  36 |   await page.goto(`${BASE}/auth/signin`);
  37 |   await page.fill('input[type="text"]', 'admin_vlad');
  38 |   await page.fill('input[type="password"]', 'admin123');
  39 |   await page.click('button[type="submit"]');
  40 |   await page.waitForURL(BASE);
> 41 |   await expect(page.locator('nav, aside, header')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  42 | });
  43 | 
```