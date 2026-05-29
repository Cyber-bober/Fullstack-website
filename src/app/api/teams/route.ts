import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'CAPTAIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
  const exists = await prisma.team.findFirst({ where: { name } });
  if (exists) return NextResponse.json({ error: 'Команда с таким именем уже существует' }, { status: 400 });
  const team = await prisma.team.create({ data: { name } });
  return NextResponse.json({ id: team.id, name: team.name }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Только админ может удалять команды' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
