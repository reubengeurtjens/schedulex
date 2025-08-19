export const runtime = 'nodejs';


import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'


export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    const user = await prisma.user.create({ data: { email, name } });
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
