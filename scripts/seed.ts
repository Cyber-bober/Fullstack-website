// scripts/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем заполнение базы...');

  // 1. Создаем админов и редакторов
  const admin1 = await prisma.user.upsert({
    where: { username: 'admin_vlad' },
    update: {},
    create: {
      username: 'admin_vlad',
      fullName: 'Владислав Админ',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      city: 'Москва',
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { username: 'admin_test' },
    update: {},
    create: {
      username: 'admin_test',
      fullName: 'Тестовый Админ',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      city: 'Санкт-Петербург',
    },
  });

  const editor1 = await prisma.user.upsert({
    where: { username: 'editor_one' },
    update: {},
    create: {
      username: 'editor_one',
      fullName: 'Редактор Один',
      passwordHash: await bcrypt.hash('editor123', 10),
      role: 'EDITOR',
      city: 'Казань',
    },
  });

  const editor2 = await prisma.user.upsert({
    where: { username: 'editor_two' },
    update: {},
    create: {
      username: 'editor_two',
      fullName: 'Редактор Два',
      passwordHash: await bcrypt.hash('editor123', 10),
      role: 'EDITOR',
      city: 'Новосибирск',
    },
  });

  console.log('Пользователи созданы');

  // 2. Создаем 10 команд с игроками
  const teams = [];
  for (let i = 1; i <= 10; i++) {
    const team = await prisma.team.create({
      data: {
        name: `ФК Тестовая Команда ${i}`,
        captainId: i === 1 ? admin1.id : undefined,
      },
    });
    
    // Добавляем по 5 игроков в каждую команду
    for (let j = 1; j <= 5; j++) {
      await prisma.user.create({
        data: {
          username: `player_t${i}_${j}`,
          fullName: `Игрок ${i}-${j}`,
          passwordHash: await bcrypt.hash('user123', 10),
          role: 'USER',
          teamId: team.id,
          position: ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий'][j % 4],
          city: 'Тестовый город',
        },
      });
    }
    teams.push(team);
  }
  console.log('Команды и игроки созданы');

  // 3. Создаем 10 матчей
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const matchDate = new Date(now.getTime() + i * 86400000);
    await prisma.match.create({
      data: {
        homeTeamId: teams[i % 10].id,
        awayTeamId: teams[(i + 1) % 10].id,
        date: matchDate,
        status: i < 3 ? 'FINISHED' : i < 6 ? 'LIVE' : 'SCHEDULED',
        score: i < 3 ? `${Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 3)}` : null,
        venue: `Стадион №${i + 1}`,
      },
    });
  }
  console.log('Матчи созданы');

  // 4. Создаем 15 тестовых новостей
  for (let i = 1; i <= 15; i++) {
    await prisma.newsPost.create({
      data: {
        title: `Тестовая новость номер ${i}`,
        content: `Это содержание тестовой новости ${i}. Здесь может быть любой текст о футболе, матчах или трансферах.`,
        authorId: i % 2 === 0 ? editor1.id : editor2.id,
        isPublished: true,
        imageUrl: i % 3 === 0 ? 'https://via.placeholder.com/800x400/0070f3/ffffff?text=News+Image' : null,
      },
    });
  }
  console.log('Новости созданы');

  console.log('Заполнение завершено!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });