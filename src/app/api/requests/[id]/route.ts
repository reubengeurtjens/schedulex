import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const request = await prisma.jobRequest.findUnique({
    where: { id },
    include: { callouts: true },
  });
  if (!request) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ request });
}
