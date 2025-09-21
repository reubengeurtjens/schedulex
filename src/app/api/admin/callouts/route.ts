import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ ok: true, note: 'stubbed to unblock build' });
}