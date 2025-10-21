// lib/redis.ts
// Safe Redis accessor that won't connect during build or without proper env.
// Works with Upstash (preferred) or any hosted Redis URL.

let _client: any | null = null;

export function getRedis() {
  // Prefer Upstash REST (serverless-friendly)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!_client) {
      // Lazy import to avoid bundling at build if unused
      const { Redis } = require("@upstash/redis");
      _client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return _client as import("@upstash/redis").Redis;
  }

  // Fallback: standard Redis (ioredis) via REDIS_URL (DO NOT default to localhost)
  if (process.env.REDIS_URL) {
    if (!_client) {
      const IORedis = require("ioredis");
      _client = new IORedis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        // tls: {} // uncomment if your provider requires TLS but doesn't use rediss://
      });
    }
    return _client as import("ioredis");
  }

  // No Redis configured – return null to avoid crashes at build/prerender
  return null;
}