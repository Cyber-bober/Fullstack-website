import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

declare global {
  var redisClient: RedisClient | undefined;
}

function createRedisClient(): RedisClient {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error('[Redis] Max retries reached');
          return new Error('Redis max retries reached');
        }
        return Math.min(retries * 100, 3000);
      },
      connectTimeout: 10000,
    },
  });

  client.on('error', (err) => {
    if (err.message?.includes('ECONNRESET') && process.env.NODE_ENV !== 'production') return;
    console.error('[Redis] Error:', err.message);
  });
  client.on('connect', () => console.log('[Redis] Connected'));
  client.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
  client.on('end', () => console.log('[Redis] Disconnected'));

  return client;
}

function getClient(): RedisClient {
  if (global.redisClient) {
    return global.redisClient;
  }

  const client = createRedisClient();
  global.redisClient = client;

  client.connect().catch((err: Error) => {
    console.error('[Redis] Connection failed:', err.message);
  });

  return client;
}

export async function invalidateCache(prefix: string): Promise<number> {
  try {
    const client = getClient();
    if (!client.isOpen) return 0;

    let cursor = 0;
    const keysToDelete: string[] = [];

    do {
      const result = await client.scan(cursor, {
        MATCH: `${prefix}:*`,
        COUNT: 100,
      });
      cursor = result.cursor;
      keysToDelete.push(...result.keys);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await client.del(keysToDelete);
    }
    return keysToDelete.length;
  } catch (err) {
    console.error('[Redis] invalidateCache error:', (err as Error).message);
    return 0;
  }
}

export async function flushAll(): Promise<void> {
  try {
    const client = getClient();
    if (client.isOpen) await client.flushDb();
  } catch (err) {
    console.error('[Redis] flushAll error:', (err as Error).message);
  }
}

async function shutdown() {
  if (global.redisClient?.isOpen) {
    try {
      await global.redisClient.quit();
      console.log('[Redis] Graceful shutdown complete');
    } catch {
      await global.redisClient.disconnect();
    }
  }
}

if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export const redis = getClient();
export default redis;
