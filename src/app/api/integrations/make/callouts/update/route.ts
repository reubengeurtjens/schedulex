import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

  const data: any = {};
  if (typeof b.status === "string") data.status = b.status;
  if (typeof b.recordingUrl === "string") data.recordingUrl = b.recordingUrl;
  if (typeof b.transcript === "string") data.transcript = b.transcript;

  try {
    const updated = await prisma.callout.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      callout: { id: updated.id, status: (updated as any).status ?? null },
    });
  } catch (e: any) {
    // P2025 = record not found (bad id) → return 404 instead of 500
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Callout not found", id }, { status: 404 });
    }
    console.error("UPDATE route error:", e);
    return NextResponse.json({ error: "Server error", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
