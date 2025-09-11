import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  const slots = Array.from({ length: 5 }).map((_, i) => {
    const start = new Date(base.getTime() + (i + 9) * 60 * 60 * 1000); // 09:00Z + i
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  });

  return NextResponse.json({ providerId: id, slots });
}
