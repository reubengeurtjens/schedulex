// src/app/api/requests/[id]/callouts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In Next.js 15, params is a Promise and must be awaited
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const requestId = Number(id);

  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const rows = await prisma.callout.findMany({
      where: { requestId },
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
    });

    // Optional: alias `startTime` → `scheduledAt` for any UI that expects that name
    const callouts = rows.map((row: any) => ({
      ...row,
      scheduledAt: row.startTime ?? null,
    }));

    return NextResponse.json({ callouts }, { status: 200 });
  } catch (err: any) {
    const detail = err?.message ?? String(err);
    return NextResponse.json(
      { error: "failed to fetch callouts", detail },
      { status: 500 }
    );
  }
}
