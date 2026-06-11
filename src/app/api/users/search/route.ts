import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json([]);
  }

  // Поиск по fullName, username или id
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { id: query }, // точное совпадение по ID
      ],
      NOT: {
        id: session.user.id, // исключить текущего пользователя
      },
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      photos: true,
    },
    take: 10,
  });

  return NextResponse.json(users);
}