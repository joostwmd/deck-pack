import { TRPCError } from "@trpc/server";

import type { Context } from "../../context";
import { middleware } from "../../init";
import { resolveWorkspaceKind } from "./resolve-workspace-kind";

/** Requires the active organization to be a team workspace. */
export const requireTeamWorkspace = middleware<Context>(async ({ ctx, next }) => {
  const workspace = await resolveWorkspaceKind(ctx);

  if (workspace !== "team") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for team workspaces",
    });
  }

  return next({ ctx });
});
