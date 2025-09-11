import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function cancelById(id: number) {
  await prisma.callout.deleteMany({ where: { requestId: id } });
  try {
    await prisma.jobRequest.update({ where: { id }, data: { /* status: "CANCELLED" as any */ } });
  } catch { /* ignore if no status field */ }
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rid = Number(id);
  if (!Number.isFinite(rid)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

  try {
    const existing = await prisma.jobRequest.findUnique({ where: { id: rid } });
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    await cancelById(rid);
    return NextResponse.json({ ok: true, id: rid });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return POST(_req, ctx);
}
