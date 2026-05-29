import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestedRole } = await req.json();

    // Check for existing pending request
    const existing = await prisma.roleRequest.findFirst({
      where: {
        userId: (session.user as any).id,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'У вас уже есть активный запрос' }, { status: 400 });
    }

    await prisma.roleRequest.create({
      data: {
        userId: (session.user as any).id,
        requestedRole,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const requests = await prisma.roleRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.fullName,
      userUsername: r.user.username,
      requestedRole: r.requestedRole,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const { status } = await req.json();

  await prisma.roleRequest.update({
    where: { id },
    data: { status },
  });

  if (status === 'APPROVED') {
    const request = await prisma.roleRequest.findUnique({ where: { id } });
    if (request) {
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole as any },
      });
    }
  }

  return NextResponse.json({ success: true });
}
