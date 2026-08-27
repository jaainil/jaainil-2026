import { Redis } from 'ioredis';
import crypto from 'node:crypto';

let redisClient: Redis | null = null;
let currentKbVersion = process.env.KB_VERSION || '20260825_1';

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.DRAGONFLY_URL || process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      commandTimeout: 3000,
      lazyConnect: false,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('error', (err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Dragonfly/Redis cache warning:', err.message);
      }
    });

    // Clear the singleton when the connection is permanently closed so the
    // next call to getRedisClient() can attempt a fresh connection.
    redisClient.on('end', () => {
      redisClient = null;
    });

    return redisClient;
  } catch (err) {
    console.warn('Failed to initialize Dragonfly client:', err);
    return null;
  }
}

export function getKbVersion(): string {
  return currentKbVersion;
}

export function setKbVersion(version: string): void {
  currentKbVersion = version;
}

/**
 * Normalizes user queries by trimming, lowercasing, collapsing spaces, and stripping trailing punctuation.
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// Versioned Cache Key Generators
export function getAnswerCacheKey(query: string, kbVersion = currentKbVersion): string {
  return `rag:answer:v2:${kbVersion}:${hashString(normalizeQuery(query))}`;
}

export function getEmbeddingCacheKey(model: string, query: string): string {
  return `rag:emb:${model}:${hashString(normalizeQuery(query))}`;
}

export function getSearchCacheKey(query: string, optionsStr = '', kbVersion = currentKbVersion): string {
  return `rag:search:v2:${kbVersion}:${hashString(`${normalizeQuery(query)}:${optionsStr}`)}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    const str = JSON.stringify(value);
    await client.set(key, str, 'EX', ttlSeconds);
  } catch {
    // Graceful fallback
  }
}

/**
 * Safe Singleflight Mutex Lock with Ownership Token (TTL: 15s)
 */
export async function acquireStampedeLock(queryHash: string, lockToken: string, ttlSeconds = 15): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return true;
  const lockKey = `rag:lock:${queryHash}`;
  try {
    const res = await client.set(lockKey, lockToken, 'EX', ttlSeconds, 'NX');
    return res === 'OK';
  } catch {
    return true;
  }
}

/**
 * Atomic Lock Release using Lua script: only delete if the token matches.
 */
export async function releaseStampedeLock(queryHash: string, lockToken: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  const lockKey = `rag:lock:${queryHash}`;
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  try {
    await client.eval(luaScript, 1, lockKey, lockToken);
  } catch {}
}

/**
 * Polls for concurrently generated answer with 3000ms max timeout and 150ms intervals.
 */
export async function waitForCachedAnswer<T>(
  cacheKey: string,
  maxWaitMs = 3000,
  pollIntervalMs = 150
): Promise<T | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const cached = await getCached<T>(cacheKey);
    if (cached) return cached;
  }
  return null;
}

export async function checkRateLimit(
  identifier: string,
  limit = 30,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const client = getRedisClient();
  const now = Math.floor(Date.now() / 1000);

  if (!client) {
    return { allowed: true, remaining: limit, reset: now + windowSeconds };
  }

  const key = `rag:ratelimit:${identifier}`;
  try {
    const count = await client.incr(key);
    let ttl = await client.ttl(key);
    if (count === 1 || ttl < 0) {
      await client.expire(key, windowSeconds);
      ttl = windowSeconds;
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: now + ttl,
    };
  } catch {
    return { allowed: true, remaining: limit, reset: now + windowSeconds };
  }
}

export async function closeCache(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
  }
}
