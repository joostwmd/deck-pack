import { z } from "zod";

import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";

export const portalMemberRoleSchema = z.enum([
  ORGANIZATION_ROLES.admin,
  ORGANIZATION_ROLES.member,
  ORGANIZATION_ROLES.addinUser,
  ORGANIZATION_ROLES.libraryManager,
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

export const currentMembershipImpactSchema = z
  .object({
    organizationId: z.string(),
    organizationName: z.string(),
    organizationType: z.enum(["individual", "team"]).nullable(),
    willDeleteOnVacate: z.boolean(),
    blockedSoleOwner: z.boolean(),
  })
  .nullable();

export const invitationPreviewSchema = z.object({
  invitationId: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  expiresAt: z.date(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationType: z.enum(["individual", "team"]).nullable(),
  status: z.string(),
  currentMembership: currentMembershipImpactSchema,
});

export const acceptInvitationInputSchema = z.object({
  invitationId: z.string().trim().min(1),
  /** Required when the user already belongs to another organization. */
  confirmReplace: z.boolean().default(false),
});

export const pendingJoinSchema = z
  .object({
    kind: z.enum(["invitation", "seat"]),
    invitationId: z.string().optional(),
    seatId: z.string().optional(),
    organizationId: z.string(),
    organizationName: z.string(),
    role: z.string().nullable().optional(),
    currentMembership: currentMembershipImpactSchema,
  })
  .nullable();

export const acceptPendingSeatInputSchema = z.object({
  confirmReplace: z.boolean().default(false),
});

export const joinResultSchema = z.object({
  organizationId: z.string(),
  workspace: z.enum(["solo", "team"]).nullable(),
  vacatedAction: z.enum(["deleted", "left"]).nullable(),
});
