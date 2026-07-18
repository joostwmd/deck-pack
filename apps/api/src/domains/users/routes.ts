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
  memberRole: z.string().nullable(),
});

export function createUsersRoutes(service: UsersService) {
  return {
    listUsers: platformAdminProcedure.output(z.array(userListItemSchema)).query(async ({ ctx }) => {
      return unwrapServiceResult(await service.listUsers(ctx.tx));
    }),
  };
}
