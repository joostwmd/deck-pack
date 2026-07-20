import { z } from "zod";

import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";

export const portalMemberRoleSchema = z.enum([
  ORGANIZATION_ROLES.admin,
  ORGANIZATION_ROLES.member,
  ORGANIZATION_ROLES.addinUser,
]);

export const memberListEntrySchema = z.object({
  kind: z.enum(["member", "invitation"]),
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.string(),
  status: z.enum(["active", "invited"]),
  createdAt: z.date(),
});

export const addMemberInputSchema = z.object({
  email: z.string().trim().email().max(320),
  role: portalMemberRoleSchema,
  assignSeat: z.boolean().default(false),
});

export const updateMemberRoleInputSchema = z.object({
  memberId: z.string().trim().min(1),
  role: portalMemberRoleSchema,
});

export const removeMemberInputSchema = z.object({
  memberId: z.string().trim().min(1),
});

export const cancelInvitationInputSchema = z.object({
  invitationId: z.string().trim().min(1),
});
