import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, context: any) {
  const id = Number(context?.params?.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const updated = await prisma.jobRequest.update({
      where: { id },
      data: { status: "CANCELLED" }, // matches your Prisma enum value
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
