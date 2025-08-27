import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  try {
    const updated = await prisma.jobRequest.update({
      where: { id },
      data: {
        status: "CANCELLED" as any, // if your enum uses "CANCELED", change this
      },
    });
    return NextResponse.json({ request: updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "cancel failed", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
