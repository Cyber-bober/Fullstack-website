import { createClient, RedisClientType } from 'redis';

declare global {
  // eslint-disable-next-line no-var
  var redisClient: RedisClientType | undefined;
}

function getClient(): RedisClientType {
  if (global.redisClient) {
    return global.redisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  client.on('error', (err: Error) => console.error('Redis error:', err.message));
  client.on('connect', () => console.log('Redis connected'));
  client.on('reconnecting', () => console.log('Redis reconnecting...'));

  client.connect().catch((err: Error) => {
    console.error('Redis connection failed:', err.message);
  });

  global.redisClient = client;
  return client;
}

export const redis = getClient();
export default redis;