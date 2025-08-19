export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const callouts = await prisma.callout.findMany({
    where: { requestId: id },
    orderBy: { startTime: 'asc' },
    select: {
      id: true,
      provider: { select: { id: true, name: true, phone: true, address: true, category: true } },
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
      confirmationRef: true,
      createdAt: true
    }
  });

  return NextResponse.json({ count: callouts.length, callouts });
}
