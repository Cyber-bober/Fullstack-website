// scripts/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Вспомогательные данные для генерации
const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург', 'Сочи', 'Краснодар'];
const POSITIONS = ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий'];
const STADIUMS = ['Лужники', 'Газпром Арена', 'Открытие Банк Арена', 'Ростов Арена', 'Фишт', 'Ак Барс Арена'];

async function main() {
  console.log(' Начинаем масштабное заполнение базы...');

  // ==========================================
  // 1. АДМИНИСТРАТОРЫ И РЕДАКТОРЫ
  // ==========================================
  const admins = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin_vlad' },
      update: {},
      create: {
        username: 'admin_vlad', fullName: 'Владислав Главный', passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN', city: 'Москва', privacyAcceptedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { username: 'admin_sergey' },
      update: {},
      create: {
        username: 'admin_sergey', fullName: 'Сергей Техадмин', passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN', city: 'Санкт-Петербург', privacyAcceptedAt: new Date(),
      },
    }),
  ]);

  const editors = await Promise.all([
    prisma.user.upsert({
      where: { username: 'editor_anna' },
      update: {},
      create: {
        username: 'editor_anna', fullName: 'Анна Спортивная', passwordHash: await bcrypt.hash('editor123', 10),
        role: 'EDITOR', city: 'Казань', privacyAcceptedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { username: 'editor_dmitry' },
      update: {},
      create: {
        username: 'editor_dmitry', fullName: 'Дмитрий Аналитик', passwordHash: await bcrypt.hash('editor123', 10),
        role: 'EDITOR', city: 'Новосибирск', privacyAcceptedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { username: 'editor_elena' },
      update: {},
      create: {
        username: 'editor_elena', fullName: 'Елена Репортер', passwordHash: await bcrypt.hash('editor123', 10),
        role: 'EDITOR', city: 'Сочи', privacyAcceptedAt: new Date(),
      },
    }),
  ]);

  console.log(` Создано ${admins.length} админ(а/ов) и ${editors.length} редактор(а/ов)`);

  // ==========================================
  // 2. КОМАНДЫ (45 шт.) И ИГРОКИ (~500 чел.)
  // ==========================================
  const teamNames = [
    'Спартак', 'Зенит', 'ЦСКА', 'Динамо', 'Локомотив', 'Краснодар', 'Рубин', 'Ростов', 
    'Сочи', 'Урал', 'Ахмат', 'Крылья Советов', 'Оренбург', 'Факел', 'Пари НН', 
    'Балтика', 'Торпедо', 'Арсенал', 'Химки', 'Акрон', 'Чайка', 'Велес', 'Нефтехимик',
    'Алания', 'СКА-Хабаровск', 'Енисей', 'Ротор', 'КАМАЗ', 'Тюмень', 'Черноморец',
    'Динамо Брянск', 'Шинник', 'Волгарь', 'Металлург Липецк', 'Иртыш', 'Луч',
    'Текстильщик', 'Машук-КМВ', 'Биолог-Новокубанск', 'Легион', 'Динамо Ставрополь',
    'Интер Черкесск', 'Электрон', 'Форте', 'Дружба'
  ];

  const teams = [];
  
  for (let i = 0; i < 45; i++) {
    // Каждую 5-ю команду делаем капитаном одного из админов/редакторов для теста прав
    let captainId: string | undefined = undefined;
    if (i === 0) captainId = admins[0].id;
    else if (i === 5) captainId = editors[0].id;
    else if (i === 10) captainId = admins[1].id;

    const team = await prisma.team.create({
      data: {
        name: `ФК ${teamNames[i] || `Команда-${i+1}`}`,
        captainId,
        logoUrl: null,
        stats: `Статистика команды ${i + 1}`,
      },
    });
    teams.push(team);

    // Создаем ровно 11 игроков для каждой команды
    const playerPromises = [];
    for (let j = 0; j < 11; j++) {
      playerPromises.push(
        prisma.user.create({
          data: {
            username: `player_${team.id.slice(0, 6)}_${j + 1}`,
            fullName: `${teamNames[i]?.split(' ')[0] || 'Игрок'} ${String.fromCharCode(65 + j)}.`,
            passwordHash: await bcrypt.hash('user123', 10),
            role: 'USER',
            teamId: team.id,
            position: POSITIONS[j % 4],
            city: CITIES[i % CITIES.length],
            birthDate: new Date(1990 + (j % 10), j % 12, (j * 2) + 1),
            contacts: `tel:+7900${1000000 + i * 10000 + j}`,
            stats: `Игр: ${10 + j}, Голы: ${j > 7 ? j - 7 : 0}`,
            privacyAcceptedAt: new Date(),
          },
        })
      );
    }
    await Promise.all(playerPromises);
    
    if ((i + 1) % 15 === 0) console.log(`    Команд создано: ${i + 1}/45`);
  }
  console.log(` Создано 45 команд и ~495 игроков`);

  // ==========================================
  // 3. МАТЧИ (100 шт.)
  // ==========================================
  const now = new Date();
  const matchPromises = [];
  
  for (let i = 0; i < 100; i++) {
    const homeIdx = i % 45;
    const awayIdx = (i + 1 + Math.floor(i / 10)) % 45; // Чтобы не играли сами с собой
    
    const daysOffset = Math.floor(i / 3); // По 3 матча в день
    const hoursOffset = (i % 3) * 4; // Матчи в 14:00, 18:00, 22:00
    
    const matchDate = new Date(now.getTime());
    matchDate.setDate(matchDate.getDate() + daysOffset);
    matchDate.setHours(14 + hoursOffset, 0, 0, 0);

    const isFinished = i < 30;
    const isLive = i >= 30 && i < 40;

    matchPromises.push(
      prisma.match.create({
        data: {
          homeTeamId: teams[homeIdx].id,
          awayTeamId: teams[awayIdx].id,
          date: matchDate,
          status: isFinished ? 'FINISHED' : isLive ? 'LIVE' : 'SCHEDULED',
          score: isFinished ? `${Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 3)}` : null,
          venue: STADIUMS[i % STADIUMS.length],
          stats: `Протокол матча #${i + 1}`,
        },
      })
    );
  }
  await Promise.all(matchPromises);
  console.log('Создано 100 матчей');

  // ==========================================
  // 4. НОВОСТИ (100 шт.)
  // ==========================================
  const newsPromises = [];
  for (let i = 1; i <= 100; i++) {
    const author = editors[i % editors.length];
    newsPromises.push(
      prisma.newsPost.create({
        data: {
          title: `Важная футбольная новость №${i}: Трансферы и результаты`,
          content: `Подробный обзор события номер ${i}. Эксперты анализируют тактику команд, обсуждают судейские решения и прогнозируют исходы следующих туров. Это тестовый контент для проверки пагинации и поиска на сайте Football Hub.`,
          authorId: author.id,
          category: i % 3 === 0 ? 'TRANSFERS' : i % 3 === 1 ? 'MATCHES' : 'GENERAL',
          isPublished: true,
          imageUrl: i % 4 === 0 ? `https://via.placeholder.com/800x400/0070f3/ffffff?text=News+${i}` : null,
        },
      })
    );
  }
  await Promise.all(newsPromises);
  console.log('Создано 100 новостей');

  console.log('\n ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ УСПЕШНО ЗАВЕРШЕНО!');
  console.log('=============================================');
  console.log('👤АДМИНЫ:');
  console.log('   admin_vlad / admin123');
  console.log('   admin_sergey / admin123');
  console.log('  РЕДАКТОРЫ:');
  console.log('   editor_anna / editor123');
  console.log('   editor_dmitry / editor123');
  console.log('   editor_elena / editor123');
  console.log(' КАПИТАНЫ КОМАНД:');
  console.log('   admin_vlad (капитан ФК Спартак)');
  console.log('   editor_anna (капитан ФК Краснодар)');
  console.log('   admin_sergey (капитан ФК Ахмат)');
  console.log(' ОБЫЧНЫЕ ПОЛЬЗОВАТЕЛИ:');
  console.log('   Любой игрок из списка (например: player_<id>_1)');
  console.log('   Пароль для всех игроков: user123');
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error(' Ошибка при заполнении:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });