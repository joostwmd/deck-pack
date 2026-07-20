import { z } from "zod";

export const seatStatusSchema = z.enum(["pending", "active", "revoked"]);

export const organizationSeatSchema = z.object({
  seatId: z.string(),
  organizationId: z.string(),
  email: z.string(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  status: seatStatusSchema,
  assignedBy: z.string(),
  assignedAt: z.date(),
  activatedAt: z.date().nullable(),
  revokedAt: z.date().nullable(),
});

export const seatCapacitySchema = z.object({
  purchased: z.number().int(),
  used: z.number().int(),
  remaining: z.number().int(),
});

export const assignSeatInputSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const revokeSeatInputSchema = z.object({
  seatId: z.string().trim().min(1),
});
