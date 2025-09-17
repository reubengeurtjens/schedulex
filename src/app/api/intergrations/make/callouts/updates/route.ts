import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function auth(req: NextRequest) {
  const k = req.headers.get("x-admin-key");
  return k && k === process.env.ADMIN_API_KEY;
}

/**
 * POST /api/integrations/make/callouts/update
 * Body: { calloutId: number, status?: string, recordingUrl?: string, transcript?: string }
 */
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { calloutId, status, recordingUrl, transcript } = body ?? {};

  const idNum = Number(calloutId);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "calloutId required" }, { status: 400 });
  }

  const exists = await prisma.callout.findUnique({ where: { id: idNum } });
  if (!exists) return NextResponse.json({ error: "Callout not found" }, { status: 404 });

  const data: any = {};
  if (typeof status === "string") data.status = status;
  if (typeof recordingUrl === "string") data.recordingUrl = recordingUrl;
  if (typeof transcript === "string") data.transcript = transcript;

  const updated = await prisma.callout.update({ where: { id: idNum }, data });
  return NextResponse.json({ ok: true, callout: { id: updated.id, status: updated.status } });
}
