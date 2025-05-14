import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
// Create different rate limiters for different actions
// For login attempts - stricter limits
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5m"), // 5 attempts per 5 minutes
  analytics: true,
  prefix: "ratelimit:login",
});

// For registration - moderate limits
export const registerRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10m"), // 3 attempts per 10 minutes
  analytics: true,
  prefix: "ratelimit:register",
});

// For password reset requests - lenient limits
export const resetRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "15m"), // 2 attempts per 15 minutes
  analytics: true,
  prefix: "ratelimit:reset",
});

// Default rate limiter for general use
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10s"),
  analytics: true,
  prefix: "ratelimit",
});

export const parserOfferRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1m"), // 2 requests per minute
  analytics: true,
  prefix: "ratelimit:job-parser",
});
