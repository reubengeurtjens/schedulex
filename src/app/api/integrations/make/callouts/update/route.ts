import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function auth(req: NextRequest) {
  const k = req.headers.get("x-admin-key");
  return !!k && k === process.env.ADMIN_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.calloutId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "calloutId required" }, { status: 400 });

  const status       = typeof b.status === "string" ? b.status : null;
  const recordingUrl = typeof b.recordingUrl === "string" ? b.recordingUrl : null;
  const transcript   = typeof b.transcript === "string" ? b.transcript : null;

  try {
    // Update using raw SQL to avoid client/schema mismatch
    const updatedCount = await prisma.$executeRaw`
      UPDATE "Callout"
      SET
        "status"       = COALESCE(${status}::"CalloutStatus", "status"),
        "recordingUrl" = COALESCE(${recordingUrl}, "recordingUrl"),
        "transcript"   = COALESCE(${transcript}, "transcript"),
        "updatedAt"    = NOW()
      WHERE "id" = ${id};
    `;

    if (updatedCount === 0) {
      return NextResponse.json({ error: "Callout not found", id }, { status: 404 });
    }

    const row = await prisma.$queryRaw<{ id: number; status: string | null }[]>`
      SELECT "id","status" FROM "Callout" WHERE "id" = ${id} LIMIT 1;
    `;
    return NextResponse.json({ ok: true, callout: row[0] ?? { id } });
  } catch (e: any) {
    return NextResponse.json(
      { error: "DB error (update)", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
