import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

async function cancelById(ctx: Ctx) {
  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  // If your FK is jobRequestId instead of requestId, change it below
  const { count } = await prisma.callout.deleteMany({
    where: { requestId: idNum },
  });

  return NextResponse.json({ ok: true, deleted: count });
}

export async function POST(_req: NextRequest, ctx: Ctx)   { return cancelById(ctx); }
export async function DELETE(_req: NextRequest, ctx: Ctx) { return cancelById(ctx); }
export async function OPTIONS() { return new Response(null, { status: 204 }); }
