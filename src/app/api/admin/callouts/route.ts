import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic"; // disable caching for this route

/** ---------- tiny helpers ---------- */
function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
function okNoStore(json: any, status = 200) {
  return Response.json(json, { status, headers: { "Cache-Control": "no-store" } });
}
function isAdmin(req: NextRequest) {
  const header = req.headers.get("x-admin-key") ?? "";
  const key = process.env.ADMIN_API_KEY ?? "";
  return header.length > 0 && key.length > 0 && header === key;
}

/** ---------- validation ---------- */
const CalloutCreateSchema = z.object({
  requestId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  startTime: z.union([z.string().datetime(), z.date()]).transform((v) => new Date(v)),
  endTime: z.union([z.string().datetime(), z.date()]).optional().transform((v) => (v ? new Date(v) : undefined)),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).default("PENDING"),
  notes: z.string().max(1000).optional(),
});

/** ---------- GET ----------
 * - If ?lists=1 or ?list=1 present → returns { providers, requests }
 * - Otherwise → returns { callouts }
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const sp = new URL(req.url).searchParams;
  const wantLists = sp.get("lists") ?? sp.get("list");
  const take = Math.min(Number(sp.get("take") ?? 20), 100);

  if (wantLists) {
    const [providers, requests] = await Promise.all([
      prisma.provider.findMany({ orderBy: { name: "asc" } }),
      prisma.jobRequest.findMany({
        orderBy: { createdAt: "desc" },
        take,
        select: { id: true, category: true, description: true, location: true, status: true, createdAt: true },
      }),
    ]);
    return okNoStore({ providers, requests });
  }

  const callouts = await prisma.callout.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      requestId: true,
      providerId: true,
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return okNoStore({ callouts });
}

/** ---------- POST ----------
 * Create a callout (admin only)
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return okNoStore({ error: "invalid_json" }, 400);

  const parsed = CalloutCreateSchema.safeParse(body);
  if (!parsed.success) return okNoStore({ error: "validation_error", issues: parsed.error.issues }, 400);

  const { requestId, providerId, startTime, endTime, status, notes } = parsed.data;

  // ensure FKs exist (nicer error than DB constraint)
  const [reqRow, provRow] = await Promise.all([
    prisma.jobRequest.findUnique({ where: { id: requestId }, select: { id: true } }),
    prisma.provider.findUnique({ where: { id: providerId }, select: { id: true } }),
  ]);
  if (!reqRow || !provRow) return okNoStore({ error: "not_found", detail: "Request or Provider not found" }, 404);

  const callout = await prisma.callout.create({
    data: { requestId, providerId, startTime, endTime, status, notes },
    select: {
      id: true,
      requestId: true,
      providerId: true,
      startTime: true,
      endTime: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return okNoStore({ callout }, 201);
}

