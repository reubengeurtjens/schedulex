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
    const rows = await prisma.$queryRaw<
      { id: number; providerId: number | null; requestId: number | null; status: string | null }[]
    >`SELECT "id","providerId","requestId","status" FROM "Callout" ORDER BY "id" ASC LIMIT ${limit}`;
    return NextResponse.json({ callouts: rows });
  } catch (e: any) {
    return NextResponse.json({ error: "DB error (next)", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
