import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  const payload: any = { ok: true, ts: new Date().toISOString() };

  if (debug) {
    try {
      const present = await prisma.$queryRaw<
        { callout: string | null; job: string | null; prov: string | null }[]
      >`SELECT to_regclass('"Callout"') as callout,
               to_regclass('"JobRequest"') as job,
               to_regclass('"Provider"')  as prov`;

      const c1 = await prisma.$queryRaw<{ count: bigint }[]>
        `SELECT COUNT(*)::bigint AS count FROM "Callout"`;
      const c2 = await prisma.$queryRaw<{ count: bigint }[]>
        `SELECT COUNT(*)::bigint AS count FROM "JobRequest"`;
      const c3 = await prisma.$queryRaw<{ count: bigint }[]>
        `SELECT COUNT(*)::bigint AS count FROM "Provider"`;

      payload.db = {
        present: present[0],
        counts: {
          Callout: Number(c1[0]?.count ?? 0),
          JobRequest: Number(c2[0]?.count ?? 0),
          Provider: Number(c3[0]?.count ?? 0),
        },
      };
    } catch (e: any) {
      payload.error = String(e?.message ?? e);
    }
  }

  return NextResponse.json(payload);
}
  