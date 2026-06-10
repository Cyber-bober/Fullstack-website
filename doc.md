## Структура директорий

```text
src/
├── lib/                         # Бекенд-ядро
│   ├── schema.prisma            # БАЗА ДАННЫХ: все таблицы, связи, поля
│   ├── prisma.ts                # Подключение к БД (не трогать)
│   └── auth.ts                  # NextAuth: вход, JWT-сессии, роли
│
├── types/
│   └── next-auth.d.ts           # Типы: чтобы session.user.role работал
│
├── components/                  # UI-компоненты (переиспользуемые)
│   ├── Nav.tsx                  # Верхнее меню (ссылки, вход/выход)
│   ├── Footer.tsx               # Нижний колонтитул
│   └── Card.tsx                 # Универсальная карточка с рамкой и тенью
│
├── app/                         # Страницы и API (Next.js App Router)
│   ├── layout.tsx               # Общий шаблон: Nav + main + Footer
│   ├── page.tsx                 # Главная страница ( / )
│   ├── profile/
│   │   └── page.tsx             # Профиль пользователя ( /profile )
│   ├── teams/
│   │   └── page.tsx             # Список команд ( /teams )
│   ├── chat/
│   │   └── page.tsx             # Чат ( /chat )
│   ├── admin/
│   │   └── page.tsx             # Админка: пользователи и посты ( /admin )
│   ├── settings/
│   │   └── page.tsx             # Настройки: тема ( /settings )
│   ├── auth/
│   │   ├── signin/page.tsx      # Страница входа ( /auth/signin )
│   │   └── register/page.tsx    # Страница регистрации ( /auth/register )
│   └── api/                     # API-эндпоинты (бекенд)
│       ├── auth/
│       │   ├── register/route.ts           # POST — регистрация
│       │   └── [...nextauth]/route.ts      # NextAuth (вход, сессии)
│       ├── profile/route.ts                # GET/PATCH — профиль
│       ├── teams/
│       │   ├── route.ts                    # GET/POST/DELETE — команды
│       │   └── [id]/players/route.ts       # POST/DELETE — игроки команды
│       ├── news/route.ts                   # GET/POST/PATCH/DELETE — новости
│       ├── matches/route.ts                # GET/POST/PATCH — матчи
│       ├── chat/route.ts                   # GET/POST — сообщения чата
│       ├── role-request/route.ts           # GET/POST/PATCH — запросы прав
│       └── support/route.ts                # GET/POST — обращения в поддержку
```

---

## Инструкции по расширению

### Как добавить новую страницу
1. Создать папку: `src/app/название/`
2. Создать файл: `page.tsx` с React-компонентом
3. Добавить ссылку в меню: `<Link href="/название">Текст</Link>` в `components/Nav.tsx`
4. Страница будет доступна по адресу `/название`

### Как добавить новую таблицу в БД
1. В файле `src/lib/schema.prisma` дописать новую модель
2. Выполнить в терминале:
   ```bash
   npx prisma migrate dev --name описание_изменений
   npx prisma generate
   ```

### Как добавить новый API-эндпоинт
1. Создать папку: `src/app/api/название/`
2. Создать файл: `route.ts`
3. Экспортировать нужные функции: `GET`, `POST`, `PATCH`, `DELETE`
4. Использовать `prisma` для выполнения запросов к базе данных

---

## Где что менять

| Задача | Файл для изменения |
| :--- | :--- |
| Добавить поле в профиль | `schema.prisma` - `model User` |
| Изменить дизайн карточек | `components/Card.tsx` |
| Добавить ссылку в меню | `components/Nav.tsx` |
| Изменить главную страницу | `app/page.tsx` |
| Изменить форму входа | `app/auth/signin/page.tsx` |
| Изменить регистрацию | `app/auth/register/page.tsx` + `api/auth/register/route.ts` |
| Изменить права доступа | В нужном `api/*/route.ts` — поменять проверку `role` |
| Сбросить базу данных | `docker compose down -v` |
| Сменить секретный ключ | `.env` - `NEXTAUTH_SECRET` |

---

## Права доступа (роли)

| Роль | Права |
| :--- | :--- |
| **Гость** | Только просмотр |
| **USER** | Доступ к чату, может вступить в команду |
| **EDITOR** | Создание и редактирование новостей, матчей |
| **CAPTAIN** | Добавление и удаление игроков своей команды |
| **ADMIN** | Полный доступ: пользователи, команды, роли, поддержка |

---

## База данных (таблицы)

| Таблица | Назначение |
| :--- | :--- |
| `User` | Пользователи: профиль, роль, команда |
| `Team` | Команды: название, капитан, игроки |
| `Match` | Матчи: дата, команды, счёт, статус |
| `NewsPost` | Новости: автор, заголовок, категория |
| `ChatMessage` | Сообщения чата: отправитель, получатель |
| `RoleRequest` | Запросы на смену роли (EDITOR/CAPTAIN) |
| `SupportMessage` | Обращения в поддержку |

---

## Полезные команды

```bash
# Разработка
npm run dev                          # Запуск сервера разработки

# Docker (База данных)
docker compose up -d postgres        # Запустить БД в фоне
docker compose down                  # Остановить БД
docker compose down -v               # Удалить БД полностью (вместе с данными)

# Prisma (ORM)
npx prisma studio                    # Открыть визуальный редактор БД в браузере
npx prisma migrate dev               # Применить изменения схемы к БД
npx prisma generate                  # Обновить Prisma-клиент (TypeScript типы)
