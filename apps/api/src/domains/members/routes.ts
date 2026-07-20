import { z } from "zod";

import { organizationMemberProcedure } from "../../api/procedures";
import { requirePermission } from "../../api/guards/authorization";
import { requireActiveOrganizationId } from "../../api/guards/org-context";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import {
  addMemberInputSchema,
  cancelInvitationInputSchema,
  memberListEntrySchema,
  removeMemberInputSchema,
  updateMemberRoleInputSchema,
} from "./schemas";
import type { MembersService } from "./service";

export const listMembersProcedure = organizationMemberProcedure.use(
  requirePermission({ member: ["update"] }),
);

export const addMemberProcedure = organizationMemberProcedure.use(
  requirePermission({ member: ["create"] }),
);

export const updateMemberRoleProcedure = organizationMemberProcedure.use(
  requirePermission({ member: ["update"] }),
);

export const removeMemberProcedure = organizationMemberProcedure.use(
  requirePermission({ member: ["delete"] }),
);

export const cancelInvitationProcedure = organizationMemberProcedure.use(
  requirePermission({ invitation: ["cancel"] }),
);

export function createMembersRoutes(service: MembersService) {
  return {
    list: listMembersProcedure
      .output(z.array(memberListEntrySchema))
      .query(async ({ ctx }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(await service.list(ctx.tx, organizationId));
      }),

    add: addMemberProcedure
      .input(addMemberInputSchema)
      .output(
        z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("member"), memberId: z.string() }),
          z.object({ kind: z.literal("invitation"), invitationId: z.string() }),
        ]),
      )
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.add(ctx.tx, {
            organizationId,
            email: input.email,
            role: input.role,
            assignSeat: input.assignSeat,
            inviterId: ctx.session!.user.id,
          }),
        );
      }),

    updateRole: updateMemberRoleProcedure
      .input(updateMemberRoleInputSchema)
      .output(z.object({ memberId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.updateRole(ctx.tx, {
            organizationId,
            memberId: input.memberId,
            role: input.role,
          }),
        );
      }),

    remove: removeMemberProcedure
      .input(removeMemberInputSchema)
      .output(z.object({ memberId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.remove(ctx.tx, {
            organizationId,
            memberId: input.memberId,
          }),
        );
      }),

    cancelInvitation: cancelInvitationProcedure
      .input(cancelInvitationInputSchema)
      .output(z.object({ invitationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const organizationId = requireActiveOrganizationId(ctx);
        return unwrapServiceResult(
          await service.cancelInvitation(ctx.tx, {
            organizationId,
            invitationId: input.invitationId,
          }),
        );
      }),
  };
}
