import { Redis } from "@upstash/redis";

// Preverimo, če ključi sploh obstajajo
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

export async function checkRateLimitByIp(ip: string) {
  const limit = 100;
  
  // Če ni Redisa, se delajmo, da je vse v redu
  if (!redis) {
    return { allowed: true, current: 0, limit: limit };
  }

  const key = "ratelimit:" + ip;
  const duration = 60 * 60;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, duration);
    }
    return {
      allowed: current <= limit,
      current: current,
      limit: limit
    };
  } catch (error) {
    return { allowed: true, current: 0, limit: limit };
  }
}
