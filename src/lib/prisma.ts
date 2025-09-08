// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
declare global {
  // avoid creating multiple instances in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
