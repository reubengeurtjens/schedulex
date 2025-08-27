import { z } from "zod";

export const RequestCreateSchema = z.object({
  category: z.string().trim().min(1).max(64),
  description: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(120).optional(),
});

export const CalloutCreateSchema = z.object({
  requestId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  startTime: z.union([z.string().datetime(), z.date()]).transform(v => new Date(v)),
  endTime: z.union([z.string().datetime(), z.date()]).optional().transform(v => (v ? new Date(v) : undefined)),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).default("PENDING"),
  notes: z.string().max(1000).optional(),
});
