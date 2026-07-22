import { z } from "zod";

export const userListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  emailVerified: z.boolean(),
  banned: z.boolean(),
  createdAt: z.date(),
  organizationId: z.string().nullable(),
  organizationName: z.string().nullable(),
  organizationSlug: z.string().nullable(),
  organizationType: z.enum(["individual", "team"]).nullable(),
  memberRole: z.string().nullable(),
});
