import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  const payload: any = { ok: true, ts: new Date().toISOString() };

  if (debug) {
    try {
      const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;

      const present = await prisma.$queryRaw<
        { callout: string | null; job: string | null; prov: string | null }[]
      >`SELECT to_regclass('"Callout"') as callout,
               to_regclass('"JobRequest"') as job,
               to_regclass('"Provider"')  as prov`;

      let calloutCount = 0, jobCount = 0, providerCount = 0;
      try {
        const r1 = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Callout"`;
        calloutCount = Number(r1[0]?.count ?? 0);
      } catch {}
      try {
        const r2 = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "JobRequest"`;
        jobCount = Number(r2[0]?.count ?? 0);
      } catch {}
      try {
        const r3 = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Provider"`;
        providerCount = Number(r3[0]?.count ?? 0);
      } catch {}

      payload.db = {
        now: now[0]?.now,
        present: present[0],
        counts: { Callout: calloutCount, JobRequest: jobCount, Provider: providerCount },
      };
    } catch (e: any) {
      payload.error = String(e?.message ?? e);
    }
  }

  return NextResponse.json(payload);
}
