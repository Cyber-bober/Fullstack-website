import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { prisma } from '@/infrastructure/database/client';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const receiverId = formData.get('receiverId') as string;

    if (!file || !receiverId) {
      return NextResponse.json({ error: 'File and receiverId required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.bin';
    const fileName = `chat-${Date.now()}${ext}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'chat', fileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/chat/${fileName}`;

    const message = await prisma.chatMessage.create({
      data: {
        senderId: (session.user as any).id,
        receiverId,
        text: `📎 ${file.name}`,
        fileUrl,
      },
    });

    return NextResponse.json({
      id: message.id,
      senderId: message.senderId,
      senderName: session.user.name,
      receiverId: message.receiverId,
      text: message.text,
      fileUrl: message.fileUrl,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
