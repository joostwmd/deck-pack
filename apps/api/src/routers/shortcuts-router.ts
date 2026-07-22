import { z } from "zod";
import {
  ListShortcutOverrides,
  ResetAllShortcutOverrides,
  ResetShortcutOverride,
  SetShortcutOverride,
} from "@deck-pack/shortcut-overrides";
import {
  listShortcutsOutputSchema,
  resetAllShortcutsOutputSchema,
  resetShortcutOverrideInputSchema,
  resetShortcutOutputSchema,
  setShortcutOverrideInputSchema,
  shortcutOverrideSchema,
} from "@deck-pack/shortcuts";

import type { AppContainer } from "../container";
import { protectedProcedure } from "../trpc/procedures";
import { router } from "../trpc/init";

const setShortcutOverrideOutputSchema = shortcutOverrideSchema.extend({
  isCustomized: z.boolean(),
});

export function shortcutsRouter(container: AppContainer) {
  return router({
    list: protectedProcedure.output(listShortcutsOutputSchema).query(({ ctx }) => {
      return new ListShortcutOverrides(container.shortcutOverridesRepository).execute({
        userId: ctx.session!.user.id,
      });
    }),

    setOverride: protectedProcedure
      .input(setShortcutOverrideInputSchema)
      .output(setShortcutOverrideOutputSchema)
      .mutation(({ ctx, input }) => {
        return new SetShortcutOverride(container.shortcutOverridesRepository).execute({
          userId: ctx.session!.user.id,
          shortcutId: input.shortcutId,
          hotkey: input.hotkey,
        });
      }),

    resetOverride: protectedProcedure
      .input(resetShortcutOverrideInputSchema)
      .output(resetShortcutOutputSchema)
      .mutation(({ ctx, input }) => {
        return new ResetShortcutOverride(container.shortcutOverridesRepository).execute({
          userId: ctx.session!.user.id,
          shortcutId: input.shortcutId,
        });
      }),

    resetAll: protectedProcedure.output(resetAllShortcutsOutputSchema).mutation(({ ctx }) => {
      return new ResetAllShortcutOverrides(container.shortcutOverridesRepository).execute({
        userId: ctx.session!.user.id,
      });
    }),
  });
}
