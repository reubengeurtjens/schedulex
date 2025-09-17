import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function auth(req: NextRequest) {
  const k = req.headers.get("x-admin-key");
  return k && k === process.env.ADMIN_API_KEY;
}

/**
 * GET /api/integrations/make/callouts/next?limit=5
 * Returns QUEUED callouts with basic provider + request info for Make.com to call.
 * No assumptions about relations or extra columns.
 */
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit") || 5);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 5;

  // Only depend on fields that surely exist: id, providerId, requestId, status
  const callouts = await prisma.callout.findMany({
    where: { status: "QUEUED" as any },
    orderBy: { id: "asc" },
    take: limit,
    // no include — we’ll fetch provider/request separately to avoid relation-name mismatches
  });

  // N+1 is fine for tiny batches; keeps this resilient to schema differences
  const rows = await Promise.all(
    callouts.map(async (c) => {
      const provider = c.providerId
        ? await prisma.provider.findUnique({
            where: { id: c.providerId as any },
            select: { id: true, name: true, phone: true },
          })
        : null;

      const job = c.requestId
        ? await prisma.jobRequest.findUnique({
            where: { id: c.requestId as any },
            select: { id: true, category: true, description: true, location: true },
          })
        : null;

      return {
        calloutId: c.id,
        provider: {
          id: provider?.id ?? null,
          name: provider?.name ?? null,
          phone: provider?.phone ?? null,
        },
        request: {
          id: job?.id ?? null,
          category: job?.category ?? null,
          description: job?.description ?? null,
          location: job?.location ?? null,
        },
        // keep a placeholder so your Make scenario can accept it if you add scheduling later
        scheduledAt: null,
      };
    })
  );

  return NextResponse.json({ callouts: rows });
}
