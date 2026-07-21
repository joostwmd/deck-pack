import { z } from "zod";

import { platformAdminProcedure } from "../../api/procedures";
import { unwrapServiceResult } from "../../api/resilience/service-result";

import type { UsersService } from "./service";

const userListItemSchema = z.object({
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

export function createUsersRoutes(service: UsersService) {
  return {
    listUsers: platformAdminProcedure.output(z.array(userListItemSchema)).query(async ({ ctx }) => {
      return unwrapServiceResult(await service.listUsers(ctx.tx));
    }),

    deleteUser: platformAdminProcedure
      .input(z.object({ userId: z.string().trim().min(1) }))
      .output(z.object({ userId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.deleteUser(ctx.tx, {
            userId: input.userId,
            actorUserId: ctx.user!.id,
          }),
        );
      }),
  };
}
