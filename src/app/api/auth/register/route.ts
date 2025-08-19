export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

type Body = { email?: string; password?: string; name?: string };

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password, name }: Body = await req.json();
    const email = (rawEmail ?? '').trim().toLowerCase();
    const cleanName = name?.trim() || null;

    if (!email || !password) {
      return NextResponse.json({ error: 'email & password required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'email already in use' }, { status: 409 });

    const hashed = hashPassword(password); // bcryptjs sync
    const user = await prisma.user.create({
      data: { email, password: hashed, name: cleanName },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') return NextResponse.json({ error: 'email already in use' }, { status: 409 });
    console.error('register error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
