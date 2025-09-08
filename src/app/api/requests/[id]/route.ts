import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  // 👇 params is a Promise in Next 15 – you must await it
  const { id } = await ctx.params;

  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const item = await prisma.jobRequest.findUnique({
    where: { id: idNum },
    include: { callouts: true },
  });

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
