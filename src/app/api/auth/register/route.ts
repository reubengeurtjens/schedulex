import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword, cleanEmail, cleanName } from "@/lib/crypto";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid_json" }, { status: 400 });

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const email = cleanEmail(parsed.data.email);
  const name = cleanName(parsed.data.name);
  const hashed = await hashPassword(parsed.data.password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashed, // <-- correct field
        // role defaults to USER via schema
      },
      select: { id: true, , name: true, createdAt: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (e: any) {
    // unique email
    if (e?.code === "P2002") {
      return Response.json({ error: "email_exists" }, { status: 409 });
    }
    return Response.json({ error: "register_failed", detail: String(e?.message ?? e) }, { status: 500 });
  }
}

