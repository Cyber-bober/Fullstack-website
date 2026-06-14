// scripts/reset-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(' Начинаем очистку базы данных...');

  try {
    // Отключаем проверку внешних ключей на время очистки
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Удаляем данные из всех таблиц (порядок больше не важен)
    await prisma.supportMessage.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.matchEvent.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.newsPost.deleteMany({});
    await prisma.roleRequest.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({});

    // Включаем проверку внешних ключей обратно
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;

    console.log(' База данных полностью очищена!');
    console.log(' Теперь можно запустить seed-скрипт для наполнения новыми данными.');
  } catch (error) {
    console.error(' Ошибка при очистке:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();