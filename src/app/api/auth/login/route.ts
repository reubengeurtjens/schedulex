import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyPassword, cleanEmail } from "@/lib/crypto";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid_json" }, { status: 400 });

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const email = cleanEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, , name: true, passwordHash: true, createdAt: true },
  });

  if (!user || !user.passwordHash) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return Response.json({ error: "invalid_credentials" }, { status: 401 });

  // If you want JWT/cookies later, add them here.
  const { passwordHash, ...publicUser } = user;
  return Response.json({ user: publicUser }, { status: 200 });
}

