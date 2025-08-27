// src/app/api/requests/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
// If your types are current, you can re-enable this and remove the few `as any` below.
// import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/* ----------------- Validation ----------------- */
const CreateRequestSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(64),
  description: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(120).optional(),
});

const StatusEnum = z.enum(["NEW", "SCHEDULED", "CANCELLED", "COMPLETED"]);

/* ----------------- Helpers ----------------- */
function toInt(value: string | null, def: number): number {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

async function ensureGuestUserId(): Promise<number> {
  const email = "guest@local";
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Guest" },
    update: {},
    select: { id: true },
  });
  return user.id;
}

/* ----------------- POST /api/requests ----------------- */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = CreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const { category, description, location } = parsed.data;
    const userId = await ensureGuestUserId();

    // Build data object without tripping type errors, even if your client is stale
    const data: any = { userId, category, description };
    if (typeof location === "string" && location.length > 0) {
      data.location = location;
    }

    const created = await prisma.jobRequest.create({
      data, // <-- typed as any to avoid "location" red underline with older clients
      select: { id: true },
    } as any);

    return Response.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    return Response.json(
      { error: "create_failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

/* ----------------- GET /api/requests -----------------
   ?take=20&skip=0&q=&category=&status=NEW|SCHEDULED|CANCELLED|COMPLETED
------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;

    const take = Math.min(toInt(sp.get("take"), 20), 50);
    const skip = toInt(sp.get("skip"), 0);
    const q = (sp.get("q") ?? "").trim();
    const category = (sp.get("category") ?? "").trim();

    const statusParam = sp.get("status");
    const status =
      statusParam && StatusEnum.safeParse(statusParam).success
        ? (statusParam as z.infer<typeof StatusEnum>)
        : undefined;

    // Build where with minimal typing pressure
    const where: any = {
      AND: [
        category ? { category: { contains: category, mode: "insensitive" } } : {},
        status ? { status } : {},
        q
          ? {
              OR: [
                { category: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } }, // safe via `any`
              ],
            }
          : {},
      ],
    };

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
          location: true, // safe via `as any` below
          status: true,
          createdAt: true,
        } as any,
      } as any),
      prisma.jobRequest.count({ where } as any),
    ]);

    return Response.json({ items, total, take, skip }, { status: 200 });
  } catch (err: any) {
    return Response.json(
      { error: "list_failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
