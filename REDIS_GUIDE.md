# Redis Integration Guide

## Overview

Redis is integrated into this Next.js project for caching, session management, and real-time features.

## Setup

### 1. Install Redis locally (for development)

**Windows:**

```powershell
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**Mac:**

```bash
brew install redis
brew services start redis
```

**Docker:**

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### 2. Environment Variables

Add to your `.env.local`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

For production (Upstash, Redis Cloud, etc.):

```env
REDIS_HOST=your-redis-host.com
REDIS_PORT=6380
REDIS_PASSWORD=your-password
```

## Usage Examples

### Basic Caching

```typescript
import { cache } from "@/lib/redis";

// Cache API response
export async function GET() {
  const cacheKey = "projects:all";

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from database
  const data = await fetchFromDatabase();

  // Cache for 5 minutes
  await cache.set(cacheKey, data, 300);

  return NextResponse.json(data);
}
```

### User Session Caching

```typescript
import { cache } from "@/lib/redis";

// Cache user session
export async function cacheUserSession(userId: string, sessionData: any) {
  await cache.set(`session:${userId}`, sessionData, 3600); // 1 hour
}

// Get cached session
export async function getUserSession(userId: string) {
  return await cache.get(`session:${userId}`);
}
```

### Rate Limiting

```typescript
import { cache } from "@/lib/redis";

export async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await cache.incr(key);

  if (count === 1) {
    // Set expiration on first request
    await cache.set(key, count, 60); // 60-second window
  }

  return count <= 100; // Max 100 requests per minute
}
```

### Leaderboard

```typescript
import { cache } from "@/lib/redis";

// Add score
export async function addScore(userId: string, score: number) {
  await cache.zadd("leaderboard", score, userId);
}

// Get top 10
export async function getTopPlayers() {
  return await cache.zrange("leaderboard", 0, 9);
}
```

### Real-time Notifications (Pub/Sub)

```typescript
import { getRedisClient } from "@/lib/redis";

// Publisher
export async function notifyUser(userId: string, message: any) {
  const redis = getRedisClient();
  await redis.publish(`user:${userId}`, JSON.stringify(message));
}

// Subscriber (in a separate process/route)
export async function subscribeToUser(
  userId: string,
  callback: (msg: any) => void,
) {
  const redis = getRedisClient();
  const subscriber = redis.duplicate();

  await subscriber.subscribe(`user:${userId}`);
  subscriber.on("message", (channel, message) => {
    callback(JSON.parse(message));
  });
}
```

## Use Cases for Your Project

### 1. **Cache Project Lists**

Cache frequently accessed project lists to reduce database load.

```typescript
// app/api/projects/route.ts
const cacheKey = `projects:user:${user.id}`;
const cached = await cache.get(cacheKey);
if (cached) return NextResponse.json(cached);

// ... fetch from database ...
await cache.set(cacheKey, projects, 300); // 5 min cache
```

### 2. **Session Storage**

Store user sessions, preferences, and temporary data.

```typescript
await cache.set(`user:${userId}:preferences`, userPrefs, 86400); // 24 hours
```

### 3. **AI Response Caching**

Cache AI-generated responses for similar queries.

```typescript
const queryHash = hashQuery(userQuery);
const cached = await cache.get(`ai:response:${queryHash}`);
if (cached) return cached;

// ... generate AI response ...
await cache.set(`ai:response:${queryHash}`, response, 3600);
```

### 4. **File Upload Progress**

Track file upload progress across requests.

```typescript
await cache.set(`upload:${uploadId}:progress`, { percent: 45 }, 600);
```

### 5. **Workspace Activity Feed**

Cache recent workspace activities.

```typescript
await cache.zadd("workspace:activity", Date.now(), JSON.stringify(activity));
```

## Production Setup

### Option 1: Upstash (Serverless Redis)

1. Sign up at https://upstash.com/
2. Create a Redis database
3. Copy connection details to `.env`

### Option 2: Redis Cloud

1. Sign up at https://redis.com/try-free/
2. Create a database
3. Configure connection

### Option 3: Self-hosted

Deploy Redis on your VPS or use managed Redis on AWS/Azure/GCP.

## Best Practices

1. **Use meaningful key prefixes**: `user:123:settings` instead of `u123s`
2. **Set TTL on all caches**: Prevent memory bloat
3. **Handle cache misses gracefully**: Always have fallback to database
4. **Use pipelines for bulk operations**: Better performance
5. **Monitor Redis memory**: Use `INFO memory` command

## Commands Cheat Sheet

```bash
# CLI access
redis-cli

# Check if Redis is running
redis-cli ping

# View all keys
redis-cli KEYS "*"

# Get a value
redis-cli GET key_name

# Delete a key
redis-cli DEL key_name

# Clear all data (careful!)
redis-cli FLUSHALL

# Monitor Redis commands in real-time
redis-cli MONITOR
```

## Monitoring

Use Redis Insight (GUI) for visual monitoring:

```bash
# Install Redis Insight
# Download from: https://redis.com/redis-enterprise/redis-insight/
```

## Next Steps

1. Start Redis locally: `redis-server`
2. Test connection: `redis-cli ping` (should return "PONG")
3. Add caching to your API routes
4. Monitor performance improvements
