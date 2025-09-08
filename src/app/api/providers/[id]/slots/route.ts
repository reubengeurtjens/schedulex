import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const now = new Date();
  const ONE_HOUR = 60 * 60 * 1000;

  const slots = Array.from({ length: 4 }).map((_, i) => {
    const start = new Date(now.getTime() + i * ONE_HOUR);
    const end = new Date(start.getTime() + ONE_HOUR);
    return {
      id: `${id}-${i + 1}`,
      providerId: id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  });

  return NextResponse.json({ providerId: id, slots });
}
