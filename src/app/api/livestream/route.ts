import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stream = await prisma.liveStream.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("GET /api/livestream - найдена трансляция:", stream ? stream.id : "нет");

    if (!stream) {
      return NextResponse.json({
        isActive: false,
        title: "Прямая трансляция",
        vkVideoUrl: process.env.VK_STREAM_URL || "",
        vkGroupUrl: process.env.VK_GROUP_URL || "",
        tgGroupUrl: process.env.TG_GROUP_URL || "",
      });
    }

    return NextResponse.json(stream);
  } catch (error) {
    console.error("GET /api/livestream error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const body = await req.json();
    console.log("PATCH /api/livestream - данные:", body);

    const { title, vkVideoUrl, vkGroupUrl, tgGroupUrl, isActive } = body;

    await prisma.liveStream.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const stream = await prisma.liveStream.create({
      data: {
        title: title || "Прямая трансляция",
        vkVideoUrl: vkVideoUrl || "",
        vkGroupUrl: vkGroupUrl || process.env.VK_GROUP_URL || "",
        tgGroupUrl: tgGroupUrl || process.env.TG_GROUP_URL || "",
        isActive: isActive !== false,
      },
    });

    console.log("Создана трансляция:", stream.id);
    return NextResponse.json(stream);
  } catch (error) {
    console.error("PATCH /api/livestream error:", error);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
  }
}