import crypto from "crypto";

/**
 * HARD-CODED APP URL (launch-safe)
 * No trailing slash
 */
const APP_URL = "https://decision-brief-ai.vercel.app";

/**
 * Allow only requests coming from your own site
 */
export function assertAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // If Origin header exists, it must match exactly
  if (origin && origin !== APP_URL) {
    throw new Error("ORIGIN_NOT_ALLOWED");
  }

  // If Referer header exists, it must start with your domain
  if (referer && !referer.startsWith(APP_URL)) {
    throw new Error("REFERER_NOT_ALLOWED");
  }
}

/**
 * Lightweight API token gate to prevent public quota abuse
 * Client must send: x-app-token
 */
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
