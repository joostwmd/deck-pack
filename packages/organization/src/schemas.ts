import { z } from "zod";

import { ORGANIZATION_TYPES } from "./domain/organization";

export const organizationEmailSchema = z.string().trim().email();

export const organizationSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens");

export const organizationIdSchema = z.string().trim().min(1);

export const organizationTypeSchema = z.enum(ORGANIZATION_TYPES);

export const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(1).max(256),
  slug: organizationSlugSchema,
  ownerEmail: organizationEmailSchema,
  type: organizationTypeSchema.optional(),
});

export const updateOrganizationInputSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().trim().min(1).max(256),
  slug: organizationSlugSchema,
  type: organizationTypeSchema.optional(),
});

export const organizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  ownerEmail: z.string().nullable(),
  type: organizationTypeSchema.nullable(),
});

export const organizationDetailSchema = organizationSummarySchema.extend({
  ownerName: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
});

export const organizationMemberSchema = z.object({
  memberId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  createdAt: z.date(),
});
