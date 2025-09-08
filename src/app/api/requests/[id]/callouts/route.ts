import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const callouts = await prisma.callout.findMany({
    where: { requestId: idNum },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ requestId: idNum, callouts });
}
