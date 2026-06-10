import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { username, password, fullName, city } = await req.json();
  if (!username || !password || !fullName) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Логин занят" }, { status: 400 });
  
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash: hash, fullName, city: city || "" },
  });
  return NextResponse.json({ id: user.id, username: user.username });
}
