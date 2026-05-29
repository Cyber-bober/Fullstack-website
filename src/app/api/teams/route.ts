import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'CAPTAIN') {
    return NextResponse.json({ error: 'Только админ или капитан может создавать команды' }, { status: 403 });
  }

  const { name, logoUrl } = await req.json();
  if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

  const team = await prisma.team.create({
    data: { name, logoUrl },
  });

  return NextResponse.json({ id: team.id, name: team.name });
}
