import { z } from "zod";

import { DeleteOwnAccount, DeleteUser, ListUsers } from "@deck-pack/users";
import { userListItemSchema } from "@deck-pack/users/schemas";

import type { AppContainer } from "../container";
import { platformAdminProcedure, protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

export function usersRouter(container: AppContainer) {
  return router({
    listUsers: platformAdminProcedure
      .output(z.array(userListItemSchema))
      .query(() => new ListUsers(container.usersRepository).execute()),

    deleteUser: platformAdminProcedure
      .input(z.object({ userId: z.string().trim().min(1) }))
      .output(z.object({ userId: z.string() }))
      .mutation(({ ctx, input }) =>
        new DeleteUser(container.usersRepository).execute({
          userId: input.userId,
          actorUserId: ctx.user!.id,
        }),
      ),

    deleteOwnAccount: protectedProcedure
      .output(z.object({ userId: z.string() }))
      .mutation(({ ctx }) =>
        new DeleteOwnAccount(container.usersRepository, (organizationId) =>
          container.organizationRepository.delete(organizationId),
        ).execute({ userId: ctx.user!.id }),
      ),
  });
}
