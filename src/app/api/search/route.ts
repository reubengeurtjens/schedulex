import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';
// BUILD_STAMP: SEARCH_DIAG_20250921_145743

type SearchKind = 'providers' | 'requests';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = ((searchParams.get('kind') ?? 'providers') as SearchKind);
  const q = (searchParams.get('q') ?? '').trim();

  const take = Math.min(Math.max(parseInt(searchParams.get('take') ?? '20', 10), 1), 100);
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
  const skip = (page - 1) * take;

  try {
    if (kind === 'requests') {
      const where = q
        ? {
            OR: [
              { category: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
              { location: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [items, total] = await Promise.all([
        prisma.jobRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          select: { id: true, category: true, description: true, location: true, status: true, createdAt: true },
        }),
        prisma.jobRequest.count({ where }),
      ]);

      return NextResponse.json({ ok: true, kind, items, total, take, skip });
    }

    // default: providers
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        orderBy: { id: 'desc' },
        take,
        skip,
        select: { id: true, name: true, phone: true },
      }),
      prisma.provider.count({ where }),
    ]);

    return NextResponse.json({ ok: true, kind: 'providers', items, total, take, skip });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'search_failed', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
