import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv();

/**
 * Hash identifiers so we never store raw IPs.
 */
function hash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Derive a stable client identifier.
 * Prefer Vercel-provided headers. Fall back to forwarded headers.
 */
function getClientId(req: Request): string {
  const forwarded =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // x-forwarded-for can be CSV
  const ip = forwarded.split(",")[0].trim();
  return hash(ip);
}

/**
 * Sliding-window rate limiter using a Redis sorted set.
 */
export async function rateLimitOrThrow(opts: {
  req: Request;
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}) {
  const { req, keyPrefix, limit, windowSeconds } = opts;
  const clientId = getClientId(req);

  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: String(now) });
  pipeline.zcard(key);
  pipeline.expire(key, windowSeconds);

  const [, , count] = (await pipeline.exec()) as unknown as [
    unknown,
    unknown,
    number
  ];

  if (count > limit) {
    const err = new Error("RATE_LIMITED");
    (err as any).status = 429;
    throw err;
  }
}
