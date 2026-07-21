import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../../trpc/procedures";

export const systemRoutes = {
  healthCheck: publicProcedure.output(z.literal("OK")).query(() => "OK" as const),

  privateData: protectedProcedure
    .output(
      z.object({
        message: z.string(),
        user: z.object({ id: z.string() }).passthrough(),
      }),
    )
    .query(({ ctx }) => ({
      message: "This is private",
      user: ctx.session!.user,
    })),
};
