import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rid = Number(id);
  if (!Number.isFinite(rid)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

  try {
    const request = await prisma.jobRequest.findUnique({ where: { id: rid }, include: { callouts: true } });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json(request);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
