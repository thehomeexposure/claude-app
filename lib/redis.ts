// lib/redis.ts
// Safe, typed Redis accessor for server runtime.
// Uses REDIS_URL with ioredis if available; otherwise returns null.

type RedisLike = {
  lpush?: (key: string, value: string) => Promise<number>;
  rpop?: (key: string) => Promise<string | null>;
  get?: (key: string) => Promise<string | null>;
  set?: (key: string, value: string, ...args: unknown[]) => Promise<unknown>;
  connect?: () => Promise<void>;
  quit?: () => Promise<void>;
};

type IORedisCtor = new (
  url: string,
  options?: Record<string, unknown>
) => RedisLike;

let client: RedisLike | null = null;

function safeRequire(name: string): unknown {
  try {
    const req = (0, eval)("require") as (m: string) => unknown;
    return req(name);
  } catch {
    return null;
  }
}

export function getRedis(): RedisLike | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  const IORedis = safeRequire("ioredis") as IORedisCtor | null;
  if (!IORedis) return null;

  if (!client) {
    client = new IORedis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    } as Record<string, unknown>);
  }
  return client;
}