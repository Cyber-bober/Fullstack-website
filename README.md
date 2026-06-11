# Football Hub — FullStack веб-приложение

Футбольный портал на Next.js + Prisma + PostgreSQL + Docker

## Требования

- Docker
- Node.js 20+

## Быстрый старт (с нуля)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Cyber-bober/Fullstack-website.git
cd Fullstack-website

# 2. Установить зависимости
npm install

# 3. Запустить PostgreSQL
docker compose up -d postgres

# 4. Создать базу данных
npx prisma migrate dev --name init --schema=src/lib/schema.prisma
npx prisma generate --schema=src/lib/schema.prisma

# 5. Создать админа
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: hash, fullName: 'Admin', city: 'Moscow', role: 'ADMIN', photos: [] }
  });
  console.log('Admin: admin / admin123');
  await prisma.\$disconnect();
})();
"

# 6. Запустить
npm run dev

docker-compose down
docker-compose build --no-cache
docker-compose up