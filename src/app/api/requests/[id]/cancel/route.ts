export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

interface Params { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  // auth
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'missing token' }, { status: 401 });

  let userId: number;
  try { ({ userId } = verifyToken<{ userId: number }>(token)); }
  catch { return NextResponse.json({ error: 'invalid token' }, { status: 401 }); }

  const requestId = Number(params.id);
  if (!Number.isFinite(requestId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  let reason: string | null = null;
  try {
    const body = await req.json();
    reason = (String(body?.reason ?? '').trim()) || null;
  } catch { /* ignore */ }

  try {
    await prisma.$transaction(async (tx: Tx) => {
      const reqRow = await tx.jobRequest.findUnique({ where: { id: requestId } });
      if (!reqRow || reqRow.userId !== userId) throw new Error('forbidden');

      await tx.callout.updateMany({
        where: { requestId, status: 'scheduled' },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          notes: reason ? `cancelled: ${reason}` : undefined,
        },
      });

      await tx.jobRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled' },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (String(e?.message) === 'forbidden') {
      return NextResponse.json({ error: 'not your request' }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
