export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const providerId = Number(params.id); // cast if your model uses Int

    const slots = await prisma.slot.findMany({
      where: {
        providerId,
        booked: false,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
