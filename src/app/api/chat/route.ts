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
  const userId = searchParams.get('userId');
  const currentUserId = (session.user as any).id;

  if (userId) {
    // Get conversation with specific user
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderId === currentUserId ? session.user.name : user?.fullName,
        receiverId: m.receiverId,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
      userName: user?.fullName || 'Unknown',
    });
  }

  // Get conversation list (latest message from each)
  const sentMessages = await prisma.chatMessage.findMany({
    where: { senderId: currentUserId },
    select: { receiverId: true, createdAt: true, text: true },
    orderBy: { createdAt: 'desc' },
  });

  const receivedMessages = await prisma.chatMessage.findMany({
    where: { receiverId: currentUserId },
    select: { senderId: true, createdAt: true, text: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ conversations: [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { receiverId, text } = await req.json();
  if (!receiverId || !text?.trim()) {
    return NextResponse.json({ error: 'Receiver and text required' }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId: (session.user as any).id,
      receiverId,
      text: text.trim(),
    },
  });

  return NextResponse.json({
    id: message.id,
    senderId: message.senderId,
    senderName: session.user.name,
    receiverId: message.receiverId,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  });
}
