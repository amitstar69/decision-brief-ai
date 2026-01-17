interface RateLimitRecord {
    count: number;
    resetTime: number;
  }

  const rateLimitMap = new Map<string, RateLimitRecord>();

  // Cleanup old entries every hour
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 3600000);

  export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const DAILY_LIMIT = 10;
    const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

    const record = rateLimitMap.get(identifier);

    // No record or expired - create new
    if (!record || now > record.resetTime) {
      const resetTime = now + WINDOW_MS;
      rateLimitMap.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: DAILY_LIMIT - 1, resetTime };
    }

    // Check limit
    if (record.count >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Increment count
    record.count++;
    return { allowed: true, remaining: DAILY_LIMIT - record.count, resetTime: record.resetTime };
  }
