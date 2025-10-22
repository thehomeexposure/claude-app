import { getRedis } from "@/lib/redis";

/**
 * Minimal queue helpers using Redis lists.
 * - Works if REDIS_URL is set and ioredis is available.
 * - If Redis is unavailable, functions no-op safely.
 */
export async function enqueue(queue: string, payload: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  // @ts-ignore (runtime client)
  await redis.lpush(queue, payload);
  return true;
}

export async function dequeue(queue: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  // @ts-ignore
  return await redis.rpop(queue);
}
