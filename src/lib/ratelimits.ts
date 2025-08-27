import type { NextRequest } from "next/server";

type Bucket = { tokens: number; updated: number };
const buckets = new Map<string, Bucket>();

/** token bucket ~30 req/min per (prefix+ip) */
export function rateLimit(req: NextRequest, prefix: string, capacity = 30) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    // @ts-ignore (Next adds ip in some runtimes)
    (req as any).ip ||
    "unknown";

  const key = `${prefix}:${ip}`;
  const now = Date.now();

  let b = buckets.get(key);
  if (!b) {
    b = { tokens: capacity, updated: now };
    buckets.set(key, b);
  }

  const refillPerMs = capacity / 60_000; // capacity per minute
  const elapsed = now - b.updated;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerMs);
  b.updated = now;

  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}
