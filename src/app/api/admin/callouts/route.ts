// src/app/api/admin/callouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function auth(req: NextRequest) {
  const k = req.headers.get('x-admin-key');
  return k && k === process.env.ADMIN_API_KEY;
}

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return json({ error: 'unauthorized' }, 401);

  const { searchParams } = new URL(req.url);
  const take = Number(searchParams.get('take') ?? '20');

  const [providers, requests] = await Promise.all([
    prisma.provider.findMany({
      orderBy: { name: 'asc' },
      // SAFE: no email/city here
      select: { id: true, name: true, phone: true },
    }),
    prisma.jobRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(take) ? take : 20,
      select: {
        id: true,
        category: true,
        description: true,
        location: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return json({ ok: true, providers, requests });
}

type PostBody = {
  requestId: number;
  providerId: number;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
  notes?: string | null;
};

export async function POST(req: NextRequest) {
  if (!auth(req)) return json({ error: 'unauthorized' }, 401);

  const body = (await req.json()) as PostBody;

  const requestId = Number(body.requestId);
  const providerId = Number(body.providerId);
  if (!Number.isFinite(requestId) || !Number.isFinite(providerId)) {
    return json({ error: 'invalid', detail: 'requestId/providerId required' }, 400);
  }

  // Ensure FKs exist (nicer error than DB constraint)
  const [reqRow, provRow] = await Promise.all([
    prisma.jobRequest.findUnique({ where: { id: requestId }, select: { id: true } }),
    prisma.provider.findUnique({ where: { id: providerId }, select: { id: true } }),
  ]);
  if (!reqRow || !provRow) {
    return json({ error: 'not_found', detail: 'Request or Provider not found' }, 404);
  }

  const startTime = body.startTime ? new Date(body.startTime) : null;
  const endTime = body.endTime ? new Date(body.endTime) : null;

  const callout = await prisma.callout.create({
    data: {
      requestId,
      providerId,
      startTime: startTime ?? undefined,
      endTime: endTime ?? undefined,
      status: (body.status as any) ?? 'QUEUED',
      notes: body.notes ?? null,
    },
    select: {
      id: true,
      requestId: true,
      providerId: true,
      status: true,
      startTime: true,
      endTime: true,
      createdAt: true,
    },
  });

  return json({ ok: true, callout });
}

// Optional: respond cleanly to CORS preflight if you call this from browser-based tools
export async function OPTIONS() {
  return json({ ok: true }, 200);
}
