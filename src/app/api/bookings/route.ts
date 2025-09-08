// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/bookings
// Body: { requestId: number, providerId: number, startTime?: string | Date, endTime?: string | Date, status?: "PENDING"|"CONFIRMED"|"CANCELLED"|"COMPLETED", notes?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestId = Number(body?.requestId);
    const providerId = Number(body?.providerId);
    const startTime = body?.startTime ? new Date(body.startTime) : undefined;
    const endTime = body?.endTime ? new Date(body.endTime) : undefined;
    const status = (body?.status as
      | "PENDING"
      | "CONFIRMED"
      | "CANCELLED"
      | "COMPLETED") ?? "CONFIRMED";
    const notes = body?.notes?.toString();

    if (!Number.isFinite(requestId) || !Number.isFinite(providerId)) {
      return NextResponse.json(
        { error: "validation_error", detail: "requestId and providerId are required" },
        { status: 400 }
      );
    }

    const created = await prisma.callout.create({
      data: { requestId, providerId, startTime, endTime, status, notes },
      select: { id: true, status: true, startTime: true, endTime: true },
    });

    return NextResponse.json({ callout: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "create_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
