import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Только админ" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `team-${params.id}-${Date.now()}.jpg`;
  const filePath = path.join(process.cwd(), "public", "uploads", fileName);
  await writeFile(filePath, buffer);

  const logoUrl = `/uploads/${fileName}`;
  await prisma.team.update({ where: { id: params.id }, data: { logoUrl } });
  return NextResponse.json({ logoUrl });
}
