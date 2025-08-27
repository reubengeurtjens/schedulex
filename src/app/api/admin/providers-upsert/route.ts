import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

// helpers
function ok(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}
function err(status: number, msg: string, extra?: any) {
  return NextResponse.json({ error: msg, ...extra }, { status });
}
function adminOk(req: Request) {
  const header = (req.headers.get("x-admin-key") ?? "").trim();
  const expected = (process.env.ADMIN_API_KEY ?? "").trim();
  return !!expected && header === expected;
}

const UpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "name is required"),
  email: z
    .string()
    .email("invalid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  notes: z.string().optional(),
});

// GET  /api/admin/providers-upsert
// Supports: ?q=search&take=50  (and ?debug=1 for a no-auth sanity ping)
export async function GET(req: Request) {
  const url = new URL(req.url);

  // no-auth sanity check
  if (url.searchParams.get("debug") === "1") {
    return ok({
      ok: true,
      route: "/api/admin/providers-upsert",
      note: "POST requires x-admin-key header == ADMIN_API_KEY",
    });
  }

  // list/search (if your middleware enforces admin, it will run before we get here)
  const q = (url.searchParams.get("q") ?? "").trim();
  const takeParam = Number(url.searchParams.get("take"));
  const take =
    Number.isFinite(takeParam) && takeParam > 0
      ? Math.min(Math.max(takeParam, 1), 200)
      : 50;

  const where: Prisma.ProviderWhereInput =
    q === ""
      ? {}
      : {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        };

  try {
    const providers = await prisma.provider.findMany({
      where,
      orderBy: { id: "desc" },
      take,
    });
    return ok({ providers });
  } catch (e) {
    console.error("GET providers-upsert failed:", e);
    return err(500, "failed to list providers");
  }
}

// POST /api/admin/providers-upsert  (create/update)
export async function POST(req: Request) {
  if (!adminOk(req)) return err(401, "unauthorized");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, "invalid JSON body");
  }

  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return err(400, "invalid input", { issues: parsed.error.flatten() });
  }
  const data = parsed.data;

  const payload: Prisma.ProviderUncheckedCreateInput = {
    name: data.name,
    ...(data.email ? { email: data.email } : {}),
    ...(data.phone ? { phone: data.phone } : {}),
    ...(data.city ? { city: data.city } : {}),
    ...(data.timezone ? { timezone: data.timezone } : {}),
    ...(data.notes ? { notes: data.notes } : {}),
  };

  try {
    let provider;
    if (data.id) {
      provider = await prisma.provider.update({
        where: { id: data.id },
        data: payload,
      });
    } else if (data.email) {
      provider = await prisma.provider.upsert({
        where: { email: data.email }, // email must be @unique in your schema
        update: payload,
        create: payload,
      });
    } else {
      provider = await prisma.provider.create({ data: payload });
    }

    return ok({ provider }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002" && e?.meta?.target?.includes("email")) {
      return err(409, "email already exists");
    }
    console.error("POST providers-upsert failed:", e);
    return err(500, "failed to upsert provider", { detail: String(e?.message ?? e) });
  }
}
