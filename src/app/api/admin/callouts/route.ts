export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient /*, CalloutStatus */ } from '@prisma/client';

// Robust tx type: a Prisma client without the lifecycle methods
type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

function isAdmin(req: Request) {
  const key = req.headers.get('x-admin-key') ?? '';
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

// What we return
type CalloutPublic = {
  id: number;
  requestId: number;
  providerId: number;
  startTime: Date;
  endTime: Date | null;
  status: string;                // if you use enums, this will still match
  notes: string | null;
  confirmedBy: string | null;
  confirmationRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));

  const requestId  = typeof body?.requestId  === 'string' ? Number(body.requestId)  : body?.requestId;
  const providerId = typeof body?.providerId === 'string' ? Number(body.providerId) : body?.providerId;
  const startTime  = body?.startTime ? new Date(body.startTime) : null;
  const endTime    = body?.endTime   ? new Date(body.endTime)   : null;
  const notes       = body?.notes ? String(body.notes) : null;
  const confirmedBy = body?.confirmedBy ? String(body.confirmedBy) : 'phone';
  const confirmationRef = body?.confirmationRef ? String(body.confirmationRef) : null;

  if (!Number.isFinite(requestId) || !Number.isFinite(providerId) || !startTime) {
    return NextResponse.json({ error: 'requestId, providerId, startTime required' }, { status: 400 });
  }
  if (endTime && !(startTime < endTime)) {
    return NextResponse.json({ error: 'endTime must be after startTime' }, { status: 400 });
  }

  const reqRow = await prisma.jobRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, expiresAt: true },
  });
  if (!reqRow || reqRow.status !== 'open' || (reqRow.expiresAt && reqRow.expiresAt < new Date())) {
    return NextResponse.json({ error: 'request not open/expired' }, { status: 409 });
  }

  const prov = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true },
  });
  if (!prov) {
    return NextResponse.json({ error: 'provider not found' }, { status: 404 });
  }

  // Optional: only one scheduled callout per request
  const existing = await prisma.callout.findFirst({
    where: { requestId, status: 'scheduled' /* or CalloutStatus.scheduled */ },
    select: { id: true, startTime: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'already_scheduled', calloutId: existing.id, startTime: existing.startTime },
      { status: 409 }
    );
  }

  // Create & update atomically
  const callout = await prisma.$transaction(async (tx: Tx): Promise<CalloutPublic> => {
    const co = await tx.callout.create({
      data: {
        requestId,
        providerId,
        startTime,
        endTime,
        notes,
        confirmedBy,
        confirmationRef,
        status: 'scheduled' as const, // or CalloutStatus.scheduled if using enums
      },
      select: {
        id: true,
        requestId: true,
        providerId: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        confirmedBy: true,
        confirmationRef: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.jobRequest.update({
      where: { id: requestId },
      data: { status: 'scheduled' as const }, // or JobRequestStatus.scheduled
    });

    return co as CalloutPublic;
  });

  return NextResponse.json({ callout }, { status: 201 });
}
