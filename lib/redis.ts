import Redis from "ioredis";

// Create Redis client singleton
let redis: Redis | null = null;

export function getRedisClient() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    redis.on("connect", () => {
      console.log("Redis connected successfully");
    });
  }

  return redis;
}

// Cache utilities
export class RedisCache {
  private client: Redis;

  constructor() {
    this.client = getRedisClient();
  }

  // Set with expiration (in seconds)
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn("Failed to parse Redis get value", { error, key });
      return null;
    }
  }

  // Delete key
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Increment counter
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  // Set with no expiration
  async setPermanent(key: string, value: any): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await this.client.mget(...keys);
    return values.map((val) => {
      if (!val) {
        return null;
      }

      try {
        return JSON.parse(val) as T;
      } catch (error) {
        console.warn("Failed to parse Redis mget value", {
          error,
          value: val,
        });
        return null;
      }
    });
  }

  // Set multiple keys
  async mset(entries: Record<string, any>, ttl?: number): Promise<void> {
    const pipeline = this.client.pipeline();

    Object.entries(entries).forEach(([key, value]) => {
      const serialized = JSON.stringify(value);
      if (ttl) {
        pipeline.setex(key, ttl, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    });

    await pipeline.exec();
  }

  // Add to sorted set (useful for leaderboards, time-series)
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  // Get sorted set range
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.zrange(key, start, stop);
  }

  // Publish to channel (pub/sub)
  async publish(channel: string, message: any): Promise<number> {
    return await this.client.publish(channel, JSON.stringify(message));
  }
}

export const cache = new RedisCache();
