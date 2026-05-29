import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUserId = (session.user as any).id;

  // Get all unique conversation partners
  const sentTo = await prisma.chatMessage.findMany({
    where: { senderId: currentUserId },
    select: { receiverId: true },
    distinct: ['receiverId'],
  });

  const receivedFrom = await prisma.chatMessage.findMany({
    where: { receiverId: currentUserId },
    select: { senderId: true },
    distinct: ['senderId'],
  });

  const partnerIds = [...new Set([
    ...sentTo.map((m) => m.receiverId),
    ...receivedFrom.map((m) => m.senderId),
  ])];

  const conversations = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { fullName: true, username: true },
      });

      const lastMessage = await prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: partnerId },
            { senderId: partnerId, receiverId: currentUserId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { text: true },
      });

      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderId: partnerId,
          receiverId: currentUserId,
          isRead: false,
        },
      });

      return {
        otherUserId: partnerId,
        otherUserName: partner?.fullName || 'Unknown',
        otherUserUsername: partner?.username || 'unknown',
        lastMessage: lastMessage?.text || '',
        unreadCount,
      };
    })
  );

  return NextResponse.json({ conversations });
}
