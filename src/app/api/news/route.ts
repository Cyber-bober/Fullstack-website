import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/auth/authOptions';
import { PublishNewsUseCase } from '@/application/use-cases/news/PublishNewsUseCase';
import { PrismaNewsRepository } from '@/infrastructure/database/repositories/PrismaNewsRepository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  const newsRepo = new PrismaNewsRepository();
  const result = await newsRepo.findPublished(page, pageSize);

  return NextResponse.json({
    posts: result.posts.map((p) => ({
      id: p.id,
      title: p.title,
      preview: p.getPreview(200),
      createdAt: p.createdAt.toISOString(),
      category: p.category,
      matchId: p.matchId,
    })),
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'EDITOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { title, content, category, imageUrl, matchId } = await req.json();

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
    }
    if (!content || content.length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    const useCase = new PublishNewsUseCase(new PrismaNewsRepository(), new PrismaUserRepository());
    const post = await useCase.createPost(
      { title, content, category, imageUrl, matchId },
      (session.user as any).id,
    );

    return NextResponse.json(post, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'EDITOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    const body = await req.json();
    const useCase = new PublishNewsUseCase(new PrismaNewsRepository(), new PrismaUserRepository());

    if (id) {
      // Edit existing post
      const post = await useCase.updatePost(id, body, (session.user as any).id);
      return NextResponse.json(post);
    } else {
      // Toggle publish/unpublish
      return NextResponse.json({ error: 'ID required for toggle' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    const useCase = new PublishNewsUseCase(new PrismaNewsRepository(), new PrismaUserRepository());
    await useCase.deletePost(id, (session.user as any).id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
