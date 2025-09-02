import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma needs Node runtime (not Edge)
export const runtime = "nodejs";

export async function GET(_req: NextRequest, context: any) {
  const id = Number(context?.params?.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const item = await prisma.jobRequest.findUnique({
      where: { id },
      include: { callouts: true },
    });

    if (!item) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "detail_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
