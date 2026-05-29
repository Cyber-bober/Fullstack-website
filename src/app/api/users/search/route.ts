import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { fullName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      photos: true,
    },
    take: 10,
  });

  return NextResponse.json({ users });
}
