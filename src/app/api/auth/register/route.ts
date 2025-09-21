import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    ok: true,
    message: 'Registration endpoint disabled in this build.',
    received: body,
  });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
