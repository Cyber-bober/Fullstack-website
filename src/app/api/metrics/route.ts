import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [users, news, teams, matches] = await Promise.all([
      prisma.user.count(),
      prisma.newsPost.count(),
      prisma.team.count(),
      prisma.match.count(),
    ]);

    let redisMemory = 0;
    let redisConnected = 0;
    try {
      const info = await redis.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      if (match) redisMemory = parseInt(match[1]);
      redisConnected = 1;
    } catch (e) {
      redisConnected = 0;
    }

    const metrics = `# HELP users_total Total number of users
# TYPE users_total gauge
users_total ${users}

# HELP news_total Total number of news posts
# TYPE news_total gauge
news_total ${news}

# HELP teams_total Total number of teams
# TYPE teams_total gauge
teams_total ${teams}

# HELP matches_total Total number of matches
# TYPE matches_total gauge
matches_total ${matches}

# HELP redis_memory_bytes Redis memory usage in bytes
# TYPE redis_memory_bytes gauge
redis_memory_bytes ${redisMemory}

# HELP redis_connected Redis connection status
# TYPE redis_connected gauge
redis_connected ${redisConnected}

# HELP app_info Application information
# TYPE app_info gauge
app_info{version="1.0.0",environment="production"} 1
`;

    return new NextResponse(metrics, {
      headers: { 
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error) {
    return new NextResponse('# Error collecting metrics\n', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}