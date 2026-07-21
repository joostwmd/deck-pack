import { z } from "zod";
import {
  listShortcutsOutputSchema,
  resetAllShortcutsOutputSchema,
  resetShortcutOverrideInputSchema,
  resetShortcutOutputSchema,
  setShortcutOverrideInputSchema,
  shortcutOverrideSchema,
} from "@deck-pack/shortcuts";

import { protectedProcedure } from "../../trpc/procedures";
import { unwrapServiceResult } from "../../trpc/service-result";

import type { ShortcutService } from "./service";

const setShortcutOverrideOutputSchema = shortcutOverrideSchema.extend({
  isCustomized: z.boolean(),
});

export function createShortcutRoutes(service: ShortcutService) {
  return {
    list: protectedProcedure.output(listShortcutsOutputSchema).query(async ({ ctx }) => {
      return unwrapServiceResult(await service.list(ctx.tx, { userId: ctx.session!.user.id }));
    }),

    setOverride: protectedProcedure
      .input(setShortcutOverrideInputSchema)
      .output(setShortcutOverrideOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.setOverride(ctx.tx, {
            userId: ctx.session!.user.id,
            shortcutId: input.shortcutId,
            hotkey: input.hotkey,
          }),
        );
      }),

    resetOverride: protectedProcedure
      .input(resetShortcutOverrideInputSchema)
      .output(resetShortcutOutputSchema)
      .mutation(async ({ ctx, input }) => {
        return unwrapServiceResult(
          await service.resetOverride(ctx.tx, {
            userId: ctx.session!.user.id,
            shortcutId: input.shortcutId,
          }),
        );
      }),

    resetAll: protectedProcedure.output(resetAllShortcutsOutputSchema).mutation(async ({ ctx }) => {
      return unwrapServiceResult(await service.resetAll(ctx.tx, { userId: ctx.session!.user.id }));
    }),
  };
}
