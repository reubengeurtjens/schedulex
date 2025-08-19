// src/app/api/search/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const limitParam = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 20, 1), 100);

    // Minimal, schema-agnostic search: name only
    const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};

    const rows = await prisma.provider.findMany({
      where,
      select: { id: true, name: true }, // add more fields later as your schema grows
      orderBy: q ? { name: 'asc' } : undefined,
      take: limit,
    });

    // TypeScript-friendly map: infer the element type from `rows`
    const results = rows.map((r: typeof rows[number]) => ({
      id: r.id,
      name: r.name,
      services: null as string | null, // placeholders to keep UI/AI contract stable
      address: null as string | null,
    }));

    return NextResponse.json({ count: results.length, results });
  } catch (err) {
    console.error('search error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
