// src/app/api/news/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("q") || "";

    const skip = (page - 1) * limit;

    const where = query 
      ? {
          OR: [
            { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { content: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
          isPublished: true,
        } 
      : { isPublished: true };

    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, fullName: true, username: true } }
        }
      }),
      prisma.newsPost.count({ where })
    ]);

    return NextResponse.json({
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Ошибка загрузки новостей:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" }, 
      { status: 500 }
    );
  }
}