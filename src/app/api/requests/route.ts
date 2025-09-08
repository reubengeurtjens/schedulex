import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

// ---- helpers (not exported) ----
function i(v: string | null, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

async function ensureGuestUserId() {
  // create a simple fallback user; adjust email/name as you like
  const email = "guest@local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Guest" },
    select: { id: true },
  });
  return user.id;
}

// GET /api/requests?take=20&skip=0&q=...&category=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const take = i(searchParams.get("take"), 20);
    const skip = i(searchParams.get("skip"), 0);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    const where: any = {};
    if (category) where.category = { contains: category, mode: "insensitive" };
    if (q) {
      where.OR = [
        { category: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.jobRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          category: true,
          description: true,
          location: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.jobRequest.count({ where }),
    ]);

    return NextResponse.json({ items, total, take, skip }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "list_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// POST /api/requests  { category, description, location }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const category = (body?.category ?? "").toString().trim();
    const description = (body?.description ?? "").toString().trim();
    const location = (body?.location ?? "").toString().trim();

    if (!category && !description) {
      return NextResponse.json(
        { error: "validation_error", detail: "category or description required" },
        { status: 400 }
      );
    }

    const userId = await ensureGuestUserId();

    const created = await prisma.jobRequest.create({
      data: { userId, category, description, location },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "create_failed", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
