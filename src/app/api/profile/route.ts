import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { city: true, contacts: true, photos: true },
  });

  return NextResponse.json(user || {});
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fullName, username, city, contacts, photos } = await req.json();
  const userId = (session.user as any).id;

  // Check username uniqueness
  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Этот username уже занят' }, { status: 400 });
    }
  }

  const updateData: any = {};
  if (fullName) updateData.fullName = fullName;
  if (username) updateData.username = username;
  if (city !== undefined) updateData.city = city;
  if (contacts) updateData.contacts = contacts;
  if (photos) updateData.photos = photos;

  await prisma.user.update({ where: { id: userId }, data: updateData });

  return NextResponse.json({ success: true });
}
