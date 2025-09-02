import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const updated = await prisma.jobRequest.update({
      where: { id },
      data: { status: "CANCELLED" }, // RequestStatus.CANCELLED if you prefer the enum
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
