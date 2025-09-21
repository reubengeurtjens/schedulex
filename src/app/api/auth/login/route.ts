import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
export const dynamic = 'force-dynamic';
// STAMP: FIX_20250921_150205

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String((body.email ?? '')).toLowerCase().trim();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'missing_credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, createdAt: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'login_failed', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
