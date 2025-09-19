import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// TEMP ONLY — delete after debugging
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    const present = await prisma.$queryRaw<{ callout: string | null }[]>
      `SELECT to_regclass('"Callout"') as callout`;
    let count: number | string = 0;
    try {
      const r = await prisma.$queryRaw<{ c: bigint }[]>
        `SELECT COUNT(*)::bigint as c FROM "Callout"`;
      count = Number(r[0]?.c ?? 0);
    } catch (e: any) {
      count = String(e?.message ?? e);
    }
    return NextResponse.json({ ok: true, now: now[0]?.now, present: present[0]?.callout, count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
