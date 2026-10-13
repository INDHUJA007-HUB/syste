import Redis from 'ioredis';
import { config } from './env';

interface CacheDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

// In-Memory Fallback Driver
class MemoryCacheDriver implements CacheDriver {
  private cache = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }
}

class RedisCacheDriver implements CacheDriver {
  private client: Redis;

  constructor(client: Redis) {
    this.client = client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async flush(): Promise<void> {
    await this.client.flushdb();
  }
}

let activeDriver: CacheDriver = new MemoryCacheDriver();
let isRedisConnected = false;

export function initCache(): CacheDriver {
  try {
    const redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't infinitely retry if Redis is down
      lazyConnect: true,
      connectTimeout: 2000,
    });

    redis.on('error', () => {
      // Suppress unhandled error log when Redis is offline in local development
    });

    redis
      .connect()
      .then(() => {
        isRedisConnected = true;
        activeDriver = new RedisCacheDriver(redis);
        console.log('✅ Connected to Redis cache cluster');
      })
      .catch(() => {
        isRedisConnected = false;
        activeDriver = new MemoryCacheDriver();
        console.log('ℹ️ Redis unavailable: using in-memory high-performance TTL cache fallback');
      });
  } catch {
    activeDriver = new MemoryCacheDriver();
    console.log('ℹ️ Using in-memory cache driver');
  }

  return {
    async get(key: string) {
      return activeDriver.get(key);
    },
    async set(key: string, value: string, ttlSeconds?: number) {
      return activeDriver.set(key, value, ttlSeconds);
    },
    async del(key: string) {
      return activeDriver.del(key);
    },
    async flush() {
      return activeDriver.flush();
    },
  };
}

export const cache = initCache();
export const isUsingRedis = () => isRedisConnected;
