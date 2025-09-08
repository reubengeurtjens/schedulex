// src/app/api/providers/search/route.ts
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request): Promise<Response> {
  try {
    const url = new URL(_req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const take = Math.min(Number(url.searchParams.get("take") ?? "50"), 100);
    const skip = Math.max(Number(url.searchParams.get("skip") ?? "0"), 0);

    const where: Prisma.ProviderWhereInput = q
      ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { city:  { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        orderBy: { id: "desc" },
        take,
        skip,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
        },
      }),
      prisma.provider.count({ where }),
    ]);

    return NextResponse.json({ items, total, take, skip });
  } catch (err: any) {
    return NextResponse.json(
      { error: "search_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
