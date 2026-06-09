import { PrismaClient, Role, PlayerPosition, MatchStatus, NewsCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Очистка
  await prisma.chatMessage.deleteMany();
  await prisma.roleRequest.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  const hash = await bcrypt.hash('123456', 10);

  // ─── Админ ───────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hash,
      fullName: 'Администратор Системы',
      birthDate: new Date('1990-01-01'),
      city: 'Москва',
      role: Role.ADMIN,
      photos: ['/uploads/players/admin.png'],
      contacts: { email: 'admin@football.ru', phone: '+79000000000', telegram: 'admin_football' },
    },
  });

  // ─── Пользователи ───────────────────────────
  const usersData = [
    { username: 'ivan_moscow', fullName: 'Иван Петров', city: 'Москва', role: Role.USER, position: PlayerPosition.STRIKER },
    { username: 'petr_spb', fullName: 'Пётр Иванов', city: 'Санкт-Петербург', role: Role.USER, position: PlayerPosition.CENTRAL_MIDFIELDER },
    { username: 'alex_kazan', fullName: 'Алексей Смирнов', city: 'Казань', role: Role.USER, position: PlayerPosition.GOALKEEPER },
    { username: 'dima_sochi', fullName: 'Дмитрий Волков', city: 'Сочи', role: Role.USER, position: PlayerPosition.CENTER_BACK },
    { username: 'sergey_ufa', fullName: 'Сергей Кузнецов', city: 'Уфа', role: Role.USER, position: PlayerPosition.LEFT_WINGER },
    { username: 'andrey_omsk', fullName: 'Андрей Попов', city: 'Омск', role: Role.USER, position: PlayerPosition.DEFENSIVE_MIDFIELDER },
    { username: 'editor_nsk', fullName: 'Редактор Новосибирск', city: 'Новосибирск', role: Role.EDITOR, position: PlayerPosition.RIGHT_BACK },
    { username: 'captain_ekb', fullName: 'Капитан Екатеринбург', city: 'Екатеринбург', role: Role.CAPTAIN, position: PlayerPosition.ATTACKING_MIDFIELDER },
    { username: 'roman_vlg', fullName: 'Роман Морозов', city: 'Волгоград', role: Role.USER, position: PlayerPosition.RIGHT_WINGER },
    { username: 'oleg_krd', fullName: 'Олег Васильев', city: 'Краснодар', role: Role.USER, position: PlayerPosition.LEFT_BACK },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        username: u.username,
        passwordHash: hash,
        fullName: u.fullName,
        birthDate: new Date(1995, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        city: u.city,
        role: u.role,
        position: u.position,
        photos: [`/uploads/players/${u.username}.png`],
        contacts: { email: `${u.username}@mail.ru`, phone: `+79${Math.floor(Math.random() * 1000000000)}` },
      },
    });
    users.push(user);
  }

  // ─── Команды ─────────────────────────────────
  const teamsData = [
    { name: 'Спартак', captainId: users[1].id },
    { name: 'Динамо', captainId: users[7].id },
    { name: 'Локомотив' },
    { name: 'Зенит' },
  ];

  const teams = [];
  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        logoUrl: `/uploads/teams/${t.name.toLowerCase()}.png`,
        captainId: t.captainId || null,
        stats: {
          matchesPlayed: Math.floor(Math.random() * 30),
          wins: Math.floor(Math.random() * 20),
          draws: Math.floor(Math.random() * 10),
          losses: Math.floor(Math.random() * 10),
          goalsScored: Math.floor(Math.random() * 50),
          goalsConceded: Math.floor(Math.random() * 30),
          cleanSheets: Math.floor(Math.random() * 10),
        },
      },
    });
    teams.push(team);
  }

  // ─── Распределение игроков по командам ──────
  for (let i = 0; i < users.length; i++) {
    await prisma.user.update({
      where: { id: users[i].id },
      data: { teamId: teams[i % teams.length].id },
    });
  }

  // ─── Матчи ───────────────────────────────────
  const statuses = [MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.FINISHED];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      await prisma.match.create({
        data: {
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          date: new Date(Date.now() + (i + j) * 86400000),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          score: { home: Math.floor(Math.random() * 5), away: Math.floor(Math.random() * 5) },
          venue: `Стадион ${teams[i].name}`,
        },
      });
    }
  }

  // ─── Новости ─────────────────────────────────
  const newsCategories = [NewsCategory.GENERAL, NewsCategory.ANNOUNCEMENT, NewsCategory.MATCH_REPORT, NewsCategory.TRANSFER, NewsCategory.INTERVIEW];
  const newsTitles = [
    'Открытие нового сезона',
    'Трансферное окно закрыто',
    'Обзор матча Спартак - Динамо',
    'Интервью с капитаном Локомотива',
    'Расписание ближайших матчей',
    'Итоги первой половины сезона',
    'Новая форма команды Зенит',
    'Травма ключевого игрока',
  ];

  for (let i = 0; i < 8; i++) {
    await prisma.newsPost.create({
      data: {
        authorId: i % 2 === 0 ? admin.id : users[6].id,
        title: newsTitles[i],
        content: `Подробное содержание новости "${newsTitles[i]}". Здесь будет полный текст статьи с деталями, комментариями экспертов и статистикой.`,
        category: newsCategories[i % newsCategories.length],
        isPublished: true,
      },
    });
  }

  // ─── Сообщения чата ──────────────────────────
  await prisma.chatMessage.createMany({
    data: [
      { senderId: admin.id, receiverId: users[0].id, text: 'Привет! Как дела?' },
      { senderId: users[0].id, receiverId: admin.id, text: 'Отлично! Когда следующий матч?' },
      { senderId: admin.id, receiverId: users[1].id, text: 'Подготовь отчёт по матчу' },
      { senderId: users[1].id, receiverId: admin.id, text: 'Сделаю сегодня вечером' },
    ],
  });

  // ─── Запросы прав ────────────────────────────
  await prisma.roleRequest.createMany({
    data: [
      { userId: users[2].id, requestedRole: 'EDITOR', status: 'PENDING' },
      { userId: users[3].id, requestedRole: 'CAPTAIN', status: 'PENDING' },
    ],
  });

  console.log('   Данные загружены!');
  console.log('   Логин: admin / 123456');
  console.log('   Все пользователи: пароль 123456');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
