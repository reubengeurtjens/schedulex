// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function pickAllowedOrigin(origin: string | null) {
  const list = (process.env.ALLOWED_ORIGINS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return "*";
  if (origin && list.includes(origin)) return origin;
  return list[0];
}

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();
  const allow = pickAllowedOrigin(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization, x-admin-key",
        Vary: "Origin",
      },
    });
  }
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", allow);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization, x-admin-key");
  res.headers.set("Vary", "Origin");
  return res;
}
export const config = { matcher: ["/api/:path*"] };
