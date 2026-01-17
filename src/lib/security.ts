import crypto from "crypto";

const APP_URL = process.env.APP_URL;

if (!APP_URL) {
  throw new Error("APP_URL environment variable is not set");
}

// Only allow requests originating from your own site
const allowedOrigins = new Set<string>([APP_URL]);

export function assertAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // If Origin header exists, it must match
  if (origin && !allowedOrigins.has(origin)) {
    throw new Error("ORIGIN_NOT_ALLOWED");
  }

  // If Referer exists, it must start with your domain
  if (referer && !referer.startsWith(APP_URL)) {
    throw new Error("REFERER_NOT_ALLOWED");
  }
}

export function assertAppToken(req: Request) {
  const token = req.headers.get("x-app-token");
  if (!token) {
    throw new Error("MISSING_APP_TOKEN");
  }

  const secret = process.env.API_SHARED_SECRET;
  if (!secret) {
    throw new Error("API_SHARED_SECRET not configured");
  }

  const a = Buffer.from(token);
  const b = Buffer.from(secret);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("INVALID_APP_TOKEN");
  }
}
