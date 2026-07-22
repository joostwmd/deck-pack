import { TRPCError } from "@trpc/server";

import type { Context } from "../../context";
import { middleware } from "../../init";
import { resolveWorkspaceKind } from "./resolve-workspace-kind";

/** Requires the active organization to be a solo (individual) workspace. */
export const requireSoloWorkspace = middleware<Context>(async ({ ctx, next }) => {
  const workspace = await resolveWorkspaceKind(ctx);

  if (workspace !== "solo") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for solo workspaces",
    });
  }

  return next({ ctx });
});
