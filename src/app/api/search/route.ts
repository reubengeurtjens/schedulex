import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get('q') ?? '').trim();
  const take = Math.min(Math.max(Number(searchParams.get('take') ?? '20'), 1), 100);
  const page = Math.max(Number(searchParams.get('page') ?? '1'), 1);
  const skip = (page - 1) * take;

  const where =
    q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
          ],
        }
      : {};

  try {
    const [items, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        orderBy: { id: 'desc' },
        take,
        skip,
        select: { id: true, name: true, phone: true }, // <-- SAFE fields only
      }),
      prisma.provider.count({ where }),
    ]);

    return NextResponse.json({ ok: true, items, total, take, skip });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'search_failed', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
