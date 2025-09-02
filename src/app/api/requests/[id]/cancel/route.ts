// src/app/api/requests/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Make sure we're on Node.js runtime (Prisma doesn't work on edge)
export const runtime = "nodejs"; // optional but safe

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const updated = await prisma.jobRequest.update({
      where: { id },
      data: { status: "CANCELLED" }, // or RequestStatus.CANCELLED if you import the enum
      select: { id: true, status: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "cancel_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
