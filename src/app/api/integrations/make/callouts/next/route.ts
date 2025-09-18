import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function auth(req: NextRequest) {
  const k = req.headers.get("x-admin-key");
  return !!k && k === process.env.ADMIN_API_KEY;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const n = Number(searchParams.get("limit") || 5);
  const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 20) : 5;

  try {
    // Minimal, stable shape
    const callouts = await prisma.callout.findMany({
      select: { id: true, providerId: true, requestId: true, status: true },
      orderBy: { id: "asc" },
      take: limit,
    });
    return NextResponse.json({ callouts });
  } catch (e: any) {
    console.error("NEXT route error:", e);
    return NextResponse.json({ error: "Server error", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
