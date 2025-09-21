import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
export const dynamic = 'force-dynamic';
// STAMP: FIX_20250921_150205

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String((body.email ?? '')).toLowerCase().trim();
    const name = String(body.name ?? '').trim() || email.split('@')[0];
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'register_failed', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
