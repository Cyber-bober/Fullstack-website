import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { photoUrl } = await req.json();
  if (!photoUrl) {
    return NextResponse.json({ error: 'photoUrl required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { photos: true },
  });

  const photos = user?.photos || [];
  if (photos.length >= 10) {
    return NextResponse.json({ error: 'Max 10 photos' }, { status: 400 });
  }

  photos.push(photoUrl);

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { photos },
  });

  return NextResponse.json({ success: true, photos });
}
