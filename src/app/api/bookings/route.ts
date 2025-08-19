import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'


export async function POST(req: Request) {
  try {
    const { userId, providerId, slotId } = await req.json();

    if (!userId || !providerId || !slotId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        providerId,
        slotId
      }
    });

    await prisma.slot.update({
      where: { id: slotId },
      data: { booked: true }
    });

    return NextResponse.json({ booking });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
