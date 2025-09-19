import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;

    const regCallout = await prisma.$queryRaw<{ regclass: string | null }[]>
      `SELECT to_regclass('"Callout"') as regclass`;
    const regJob     = await prisma.$queryRaw<{ regclass: string | null }[]>
      `SELECT to_regclass('"JobRequest"') as regclass`;
    const regProv    = await prisma.$queryRaw<{ regclass: string | null }[]>
      `SELECT to_regclass('"Provider"') as regclass`;

    let calloutCount: any, jobCount: any, providerCount: any;
    try { calloutCount = Number((await prisma.$queryRaw<{ count: bigint }[]>
           `SELECT COUNT(*)::bigint as count FROM "Callout"`)[0]?.count ?? 0); }
    catch (e: any) { calloutCount = String(e?.message ?? e); }
    try { jobCount = Number((await prisma.$queryRaw<{ count: bigint }[]>
           `SELECT COUNT(*)::bigint as count FROM "JobRequest"`)[0]?.count ?? 0); }
    catch (e: any) { jobCount = String(e?.message ?? e); }
    try { providerCount = Number((await prisma.$queryRaw<{ count: bigint }[]>
           `SELECT COUNT(*)::bigint as count FROM "Provider"`)[0]?.count ?? 0); }
    catch (e: any) { providerCount = String(e?.message ?? e); }

    return NextResponse.json({
      ok: true,
      now: now[0]?.now,
      present: {
        Callout: regCallout[0]?.regclass,
        JobRequest: regJob[0]?.regclass,
        Provider: regProv[0]?.regclass,
      },
      counts: { Callout: calloutCount, JobRequest: jobCount, Provider: providerCount },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
