export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkAdmin(req: Request) {
  const k = req.headers.get('x-admin-key') ?? '';
  if (!process.env.ADMIN_API_KEY || k !== process.env.ADMIN_API_KEY) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body?.name ?? '').trim();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const website = body?.website ? String(body.website).trim() : null;
  const address = body?.address ? String(body.address).trim() : null;
  const category = body?.category ? String(body.category).trim() : null;
  const services = body?.services ? String(body.services).trim() : null;

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  // simple dedupe heuristic: match by (name + phone) first, else (name + website)
  const existing = await prisma.provider.findFirst({
    where: {
      OR: [
        { AND: [{ name }, { phone }] },
        { AND: [{ name }, { website }] }
      ]
    },
    select: { id: true }
  });

  const provider = existing
    ? await prisma.provider.update({
        where: { id: existing.id },
        data: { phone, website, address, category, services, name }
      })
    : await prisma.provider.create({
        data: { name, phone, website, address, category, services }
      });

  return NextResponse.json({ provider }, { status: 201 });
}
