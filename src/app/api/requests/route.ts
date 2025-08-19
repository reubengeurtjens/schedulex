export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'missing token' }, { status: 401 });

  let userId: number;
  try { ({ userId } = verifyToken<{ userId: number }>(token)); }
  catch { return NextResponse.json({ error: 'invalid token' }, { status: 401 }); }

  const body = await req.json();
  const category = String(body?.category ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const address = String(body?.address ?? '').trim();
  const latitude = body?.latitude ?? null;
  const longitude = body?.longitude ?? null;
  const photosJson = body?.photos ?? null;
  const expiresInMinutes = Number(body?.expiresInMinutes ?? 60);

  if (!category || !description || !address)
    return NextResponse.json({ error: 'category, description, address required' }, { status: 400 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(15, expiresInMinutes) * 60 * 1000);

  const requestRow = await prisma.jobRequest.create({
    data: { userId, category, description, address, latitude, longitude, photosJson, expiresAt },
    select: { id: true, category: true, description: true, address: true, createdAt: true, expiresAt: true, status: true }
  });

  return NextResponse.json({ request: requestRow }, { status: 201 });
}
