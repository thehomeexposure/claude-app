// lib/queue.ts
import { getRedis } from "@/lib/redis";

export type ImageJobStep = "ENHANCE" | "RERENDER" | "UPSCALE";

export type ImageJobMessage = {
  imageId: string;
  jobId?: string;
  steps?: ImageJobStep[];
  // add fields here later if needed
};

/** LPUSH helper: JSON-encode any payload (object or string) */
export async function enqueue(queue: string, payload: unknown): Promise<boolean> {
  const redis = getRedis();
  if (!redis || !redis.lpush) return false;
  const value = typeof payload === "string" ? payload : JSON.stringify(payload);
  await redis.lpush(queue, value);
  return true;
}

/** RPOP helper: returns raw string; parse at the consumer as needed */
export async function dequeue(queue: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis || !redis.rpop) return null;
  return await redis.rpop(queue);
}

/** Export used by /api/admin/retry and /api/process/[imageId]/route.ts */
export async function addImageProcessingJob(
  payload: ImageJobMessage | string
): Promise<boolean> {
  return enqueue("image:jobs", payload);
}