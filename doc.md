#  Полная документация проекта

##  Быстрый старт

### 1. Запуск инфраструктуры

```bash
# Поднять PostgreSQL и приложение
docker-compose up -d --build

# Проверить статус
docker-compose ps
```

Ожидаемый результат:
- `football-postgres` - **Healthy**
- `football-app` - **Up**

### 2. Синхронизация локальной среды

```bash
# Установить зависимости
npm install

# Сгенерировать Prisma Client (для автодополнения в IDE)
npx prisma generate --schema=./src/lib/schema.prisma
```

> **Важно:** После генерации перезапустите TypeScript сервер в VS Code:
> `Ctrl+Shift+P` → **"TypeScript: Restart TS Server"**

### 3. Синхронизация схемы с БД

Схема автоматически применяется при запуске Docker. Для ручной синхронизации:

```bash
# Через Docker (рекомендуется)
docker-compose exec app sh -c "npx --yes prisma@5.22.0 db push --schema=./src/lib/schema.prisma --accept-data-loss --skip-generate"

# Либо локально (если PostgreSQL доступен на localhost:5433)
DATABASE_URL="postgresql://football:football_pass@localhost:5433/football_db" \
npx prisma db push --schema=./src/lib/schema.prisma --accept-data-loss
```

---

## Управление данными

### Создание тестовых данных

**Рекомендуется запускать локально** — быстрее и удобнее:

```bash
# 1. Убедитесь, что PostgreSQL запущен
docker-compose up -d postgres

# 2. Запустите seed локально
npx tsx scripts/seed.ts
```

**Альтернатива через Docker** (если нет локального Node.js):

```bash
# Нужно добавить в Dockerfile (этап runner):
# COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Затем пересобрать и запустить
docker-compose build --no-cache
docker-compose exec app npx tsx scripts/seed.ts
```

### Тестовые учётные записи

| Роль | Логин | Пароль | Примечание |
|------|-------|--------|------------|
| Администратор | `admin_vlad` | `admin123` | Капитан ФК Спартак |
| Администратор | `admin_sergey` | `admin123` | Капитан ФК Ахмат |
| Редактор | `editor_anna` | `editor123` | Капитан ФК Краснодар |
| Редактор | `editor_dmitry` | `editor123` | Обычный редактор |
| Редактор | `editor_elena` | `editor123` | Обычный редактор |
| Игрок | `player_*` | `user123` | ~495 игроков в 45 командах |

>  **Совет:** ID игроков случайные. Чтобы узнать ID — зайдите в админку → вкладка "Пользователи".

### Очистка базы данных

>  **ВНИМАНИЕ:** Удаляет все данные безвозвратно! Только для разработки.

```bash
# Локально (рекомендуется)
npx tsx scripts/reset-db.ts

# Через Docker
docker-compose exec app npx tsx scripts/reset-db.ts
```

После очистки сразу наполните базу:

```bash
npx tsx scripts/seed.ts
```

---


### Управление схемой

**Добавление нового поля:**

1. Отредактируйте `src/lib/schema.prisma`
2. Синхронизируйте с БД:
   ```bash
   docker-compose exec app sh -c "npx --yes prisma@5.22.0 db push --schema=./src/lib/schema.prisma --accept-data-loss --skip-generate"
   ```
3. Перегенерируйте клиент:
   ```bash
   npx prisma generate --schema=./src/lib/schema.prisma
   ```

**Использование `db push` вместо миграций:**
-  Проще — не нужно создавать SQL файлы
-  Быстрее — автоматическая синхронизация
-  Нет истории изменений (для учебного проекта — ок)
-  Нет отката (для production используйте миграции)

---

##  Полезные команды

### Docker

```bash
# Запустить всё
docker-compose up -d

# Остановить
docker-compose down

# Пересобрать без кэша
docker-compose build --no-cache

# Логи приложения
docker-compose logs -f app

# Логи PostgreSQL
docker-compose logs -f postgres

# Войти в контейнер
docker-compose exec app sh

# Выполнить SQL запрос
docker-compose exec postgres psql -U football -d football_db -c "SELECT * FROM \"Team\" LIMIT 5;"
```

### Prisma

```bash
# Валидация схемы
npx prisma validate --schema=./src/lib/schema.prisma

# Форматирование схемы
npx prisma format --schema=./src/lib/schema.prisma

# Открыть Prisma Studio (GUI для БД)
DATABASE_URL="postgresql://football:football_pass@localhost:5433/football_db" \
npx prisma studio --schema=./src/lib/schema.prisma
```

### Отладка

```bash
# Проверить подключение к БД
docker-compose exec postgres psql -U football -d football_db -c "\dt"

# Посмотреть текущие миграции (если используются)
docker-compose exec app sh -c "npx --yes prisma@5.22.0 migrate status --schema=./src/lib/schema.prisma"

# Проверить переменные окружения в контейнере
docker-compose exec app env | grep DATABASE
```

---

## Доступ к приложению

### Локально (на хост-машине)

```
http://localhost:3000
```

### С других устройств в сети

```bash
# Узнать IP хоста
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -1

# Пример: http://192.168.1.100:3000
```

### PostgreSQL (для внешних клиентов)

```
Host: localhost
Port: 5433
User: football
Password: football_pass
Database: football_db
```

---

## Git Workflow

### Для разработчика

```bash
# Забрать последние изменения
git checkout develop
git pull origin develop

# Работать над задачей
# ... код ...

# Закоммитить
git add .
git commit -m "feat: календарь матчей"

# Отправить в develop
git push origin develop
```

### При конфликтах

```bash
git pull --rebase origin develop
```

### Релиз (только ОДИН разработчик)

```bash
# Переключиться на main
git checkout main
git pull origin main

# Влить develop
git merge develop
git push origin main

# Вернуться в develop
git checkout develop
git merge main   # синхронизировать develop с релизом
git push origin develop
```

---

##  Решение частых проблем

### Ошибка: `Cannot find module '@prisma/client'`

```bash
# Перегенерировать Prisma Client
npx prisma generate --schema=./src/lib/schema.prisma
```

### Ошибка: `Can't reach database server at localhost:5432`

```bash
# Проверить, что PostgreSQL запущен
docker-compose ps

# Если не запущен — запустить
docker-compose up -d postgres

# Проверить подключение
docker-compose exec postgres psql -U football -d football_db -c "SELECT 1;"
```

### Ошибка: `EACCES: permission denied` для `.next/trace`

```bash
# Удалить .next (создан от root в Docker)
sudo rm -rf .next

# Пересобрать локально
npm run build
```

### Ошибка: `sh: ./node_modules/.bin/prisma: not found`

Это происходит в Docker, когда `node_modules` не скопирован. Решение — использовать `npx`:

```dockerfile
CMD ["sh", "-c", "npx --yes prisma@5.22.0 db push --schema=./src/lib/schema.prisma --accept-data-loss --skip-generate && node server.js"]
```

### TypeScript ошибки после изменения схемы

```bash
# 1. Перегенерировать клиент
npx prisma generate --schema=./src/lib/schema.prisma

# 2. Перезапустить TS сервер в VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## Чек-лист нового разработчика

- [ ] Клонировать репозиторий
- [ ] `npm install`
- [ ] `docker-compose up -d --build`
- [ ] `npx prisma generate --schema=./src/lib/schema.prisma`
- [ ] Перезапустить TS Server в VS Code
- [ ] `npx tsx scripts/seed.ts`
- [ ] Открыть http://localhost:3000
- [ ] Войти как `admin_vlad` / `admin123`

---

## Подключение к DBeaver

| Параметр | Значение |
|----------|----------|
| Host | `localhost` |
| Port | **`5433`** |
| Database | `football_db` |
| Username | `football` |
| Password | `football_pass` |

## тесты
```bash
docker compose exec app pytest tests/ -v --html=report.html

docker compose exec app sh -c "apk add --no-cache python3 py3-pip && python3 -m venv /venv && /venv/bin/pip install pytest requests pytest-html"


# Локально (в папке проекта)
npm test                                  #unit

# Создать виртуальное окружение (один раз и добавь в гитигнор венв не забудь)
python -m venv venv

# Активировать
source venv/bin/activate

# Установить зависимости
pip install pytest requests pytest-html pytest-xdist


pytest tests/ -v                          # все тесты (api)
pytest tests/ -v --html=report.html       # с HTML-отчётом

# После работы — деактивировать
deactivate


```
