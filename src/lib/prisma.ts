import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance in dev to avoid hot-reload leaks
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Named export (so you can `import { prisma } from "@/lib/prisma"`)
export const prisma =
  globalThis.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
