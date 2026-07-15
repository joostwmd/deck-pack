import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  listShortcutsOutputSchema,
  resetAllShortcutsOutputSchema,
  resetShortcutOverrideInputSchema,
  resetShortcutOutputSchema,
  setShortcutOverrideInputSchema,
  shortcutOverrideSchema,
} from "@deck-pack/shortcuts";

import { protectedProcedure } from "../../api/procedures";

import {
  loadCurrentShortcutOverrides,
  resetAllShortcutOverridesForUser,
  resetShortcutOverrideForUser,
  setShortcutOverrideForUser,
} from "./service";

const setShortcutOverrideOutputSchema = shortcutOverrideSchema.extend({
  isCustomized: z.boolean(),
});

export const shortcutRoutes = {
  list: protectedProcedure.output(listShortcutsOutputSchema).query(async ({ ctx }) => {
    const overrides = await loadCurrentShortcutOverrides({
      tx: ctx.tx,
      userId: ctx.session!.user.id,
    });

    return {
      schemaVersion: 1,
      overrides,
    };
  }),

  setOverride: protectedProcedure
    .input(setShortcutOverrideInputSchema)
    .output(setShortcutOverrideOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await setShortcutOverrideForUser({
        tx: ctx.tx,
        userId: ctx.session!.user.id,
        shortcutId: input.shortcutId,
        hotkey: input.hotkey,
      });

      if (!result.ok) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Shortcut already assigned to "${result.conflict.description}"`,
          cause: result.conflict,
        });
      }

      return result.override;
    }),

  resetOverride: protectedProcedure
    .input(resetShortcutOverrideInputSchema)
    .output(resetShortcutOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return resetShortcutOverrideForUser({
        tx: ctx.tx,
        userId: ctx.session!.user.id,
        shortcutId: input.shortcutId,
      });
    }),

  resetAll: protectedProcedure
    .output(resetAllShortcutsOutputSchema)
    .mutation(async ({ ctx }) => {
      return resetAllShortcutOverridesForUser({
        tx: ctx.tx,
        userId: ctx.session!.user.id,
      });
    }),
};
