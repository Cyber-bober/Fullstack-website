# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: news.spec.ts >> Новости >> админ может создать новость
- Location: tests/e2e/news.spec.ts:11:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Добавить новость")')

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
      - link "Войти":
        - /url: /auth/signin
        - generic: Войти
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
    - link "Войти" [ref=e27] [cursor=pointer]:
      - /url: /auth/signin
      - generic [ref=e28]: Войти
  - generic [ref=e29]:
    - main [ref=e30]:
      - navigation "Breadcrumb" [ref=e31]:
        - list [ref=e32]:
          - listitem [ref=e33]:
            - generic [ref=e34]: Главная
      - generic [ref=e35]:
        - heading "RTLive" [level=1] [ref=e37]
        - generic [ref=e38]:
          - button "Новости" [ref=e39] [cursor=pointer]
          - button "Текстовая трансляция" [ref=e40] [cursor=pointer]
          - button "Прямая трансляция" [ref=e41] [cursor=pointer]
          - button "Календарь событий" [ref=e42] [cursor=pointer]
        - textbox "Поиск новостей..." [ref=e44]
        - generic [ref=e45]:
          - heading "Новости" [level=3] [ref=e47]
          - article [ref=e48]:
            - generic [ref=e49]:
              - heading "N1786818516046759" [level=3] [ref=e50]
              - paragraph [ref=e51]: Valid admin content
              - generic [ref=e52]:
                - generic [ref=e53]: "Автор: Владислав Главный"
                - text: • 15 августа 2026 г. в 22:28
          - article [ref=e54]:
            - generic [ref=e55]:
              - heading "Тестовая новость" [level=3] [ref=e56]
              - paragraph [ref=e57]: Содержание тестовой новости для проверки
              - generic [ref=e58]:
                - generic [ref=e59]: "Автор: Владислав Главный"
                - text: • 15 августа 2026 г. в 22:28
          - article [ref=e60]:
            - generic [ref=e61]:
              - heading "M1785144696335055" [level=3] [ref=e62]
              - paragraph [ref=e63]: News with match
              - generic [ref=e64]:
                - generic [ref=e65]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e66]:
            - generic [ref=e67]:
              - heading "I1785144695935754" [level=3] [ref=e68]
              - paragraph [ref=e69]: Interview content test now
              - generic [ref=e70]:
                - generic [ref=e71]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e72]:
            - generic [ref=e73]:
              - heading "TR1785144695547535" [level=3] [ref=e74]
              - paragraph [ref=e75]: Transfer news test content
              - generic [ref=e76]:
                - generic [ref=e77]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e78]:
            - generic [ref=e79]:
              - heading "MR1785144695203336" [level=3] [ref=e80]
              - paragraph [ref=e81]: Match report content test
              - generic [ref=e82]:
                - generic [ref=e83]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e84]:
            - generic [ref=e85]:
              - heading "A1785144694828533" [level=3] [ref=e86]
              - paragraph [ref=e87]: Announcement test content
              - generic [ref=e88]:
                - generic [ref=e89]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e90]:
            - generic [ref=e91]:
              - heading "G1785144694429537" [level=3] [ref=e92]
              - paragraph [ref=e93]: General category news test
              - generic [ref=e94]:
                - generic [ref=e95]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e96]:
            - generic [ref=e97]:
              - heading "CC1785144685379008_3" [level=3] [ref=e98]
              - paragraph [ref=e99]: Concurrent news test content
              - generic [ref=e100]:
                - generic [ref=e101]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
          - article [ref=e102]:
            - generic [ref=e103]:
              - heading "CC1785144685379008_4" [level=3] [ref=e104]
              - paragraph [ref=e105]: Concurrent news test content
              - generic [ref=e106]:
                - generic [ref=e107]: "Автор: Владислав Главный"
                - text: • 27 июля 2026 г. в 13:31
        - generic [ref=e108]:
          - button "← Назад" [disabled] [ref=e109]
          - button "1" [ref=e110] [cursor=pointer]
          - button "2" [ref=e111] [cursor=pointer]
          - generic [ref=e112]: …
          - button "54" [ref=e113] [cursor=pointer]
          - button "Вперёд →" [ref=e114] [cursor=pointer]
    - contentinfo [ref=e115]:
      - generic [ref=e116]:
        - paragraph [ref=e117]: © 2026 RTLive. Все права защищены.
        - generic [ref=e118]:
          - link "Политика конфиденциальности" [ref=e119] [cursor=pointer]:
            - /url: /privacy-policy
          - link "Пользовательское соглашение" [ref=e120] [cursor=pointer]:
            - /url: /terms
          - link "Исходный код" [ref=e121] [cursor=pointer]:
            - /url: https://github.com/Cyber-bober/Fullstack-website
            - img [ref=e122]
            - text: Исходный код
  - alert [ref=e124]
  - generic [ref=e125]:
    - paragraph [ref=e126]:
      - text: Мы используем cookies для работы системы входа и улучшения сервиса. Продолжая использовать сайт, вы соглашаетесь с нашей
      - link "Политикой конфиденциальности" [ref=e127] [cursor=pointer]:
        - /url: /privacy-policy
      - text: .
    - button "Принять" [ref=e128] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE = 'http://localhost:3000';
  4  | 
  5  | test.describe('Новости', () => {
  6  |   test('гость видит новости', async ({ page }) => {
  7  |     await page.goto(`${BASE}/`);
  8  |     await expect(page.locator('.news-list')).toBeVisible();
  9  |   });
  10 | 
  11 |   test('админ может создать новость', async ({ page }) => {
  12 |     await page.goto(`${BASE}/auth/signin`);
  13 |     await page.fill('input[type="text"]', 'admin_vlad');
  14 |     await page.fill('input[type="password"]', 'admin123');
  15 |     await page.click('button[type="submit"]');
  16 |     await page.waitForURL(BASE);
  17 | 
> 18 |     await page.click('button:has-text("Добавить новость")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  19 |     await page.fill('input[placeholder*="заголовок"]', 'Тестовая новость');
  20 |     await page.fill('textarea[placeholder*="текст"]', 'Содержание тестовой новости для проверки');
  21 |     await page.click('button:has-text("Создать")');
  22 |     
  23 |     await expect(page.locator('.news-title').first()).toContainText('Тестовая новость');
  24 |   });
  25 | });
```