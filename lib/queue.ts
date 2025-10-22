// lib/queue.ts
import { getRedis } from "@/lib/redis";

/**
 * Minimal queue helpers using Redis lists.
 * If Redis is not available, these no-op safely.
 */

export async function enqueue(queue: string, payload: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis || !redis.lpush) return false;
  await redis.lpush(queue, payload);
  return true;
}

export async function dequeue(queue: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis || !redis.rpop) return null;
  return await redis.rpop(queue);
}

/** Required by /app/api/admin/retry and /app/api/process/[imageId]/route.ts */
export async function addImageProcessingJob(imageId: string): Promise<boolean> {
  // You can change the queue name to whatever your app expects.
  return enqueue("image:jobs", imageId);
}