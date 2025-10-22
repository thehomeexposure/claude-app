// lib/redis.ts
// Safe Redis accessor that won't break build and won't use localhost.
// Uses REDIS_URL with ioredis if available; otherwise returns null.

let _client: any | null = null;

function safeRequire<T = any>(name: string): T | null {
  try {
    // avoid bundler static resolution
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = (0, eval)("require") as NodeRequire;
    return req(name) as T;
  } catch {
    return null;
  }
}

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  // Try to load ioredis at runtime; if not installed, return null gracefully
  const IORedis = safeRequire<any>("ioredis");
  if (!IORedis) return null;

  if (!_client) {
    _client = new IORedis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      // tls: {} // uncomment if your provider needs TLS but plain redis://
    });
  }
  return _client;
}