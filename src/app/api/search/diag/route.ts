import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
// DIAG_STAMP: SEARCH_DIAG_20250921_145743
export async function GET() {
  return NextResponse.json({ ok: true, stamp: 'SEARCH_DIAG_20250921_145743' });
}
