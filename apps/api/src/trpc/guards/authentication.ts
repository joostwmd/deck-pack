import { TRPCError } from "@trpc/server";
import type { SessionPayload } from "../../types";

import type { Context } from "../context";
import { middleware } from "../setup";

/** Session shape after {@link requireAuthenticatedSession} succeeds. */
export type AuthenticatedSession = SessionPayload & {
  user: NonNullable<SessionPayload["user"]>;
};

/** Throws UNLESS the payload includes a signed-in user (Better Auth/Hono middleware context). */
export function requireAuthenticatedSession(session: SessionPayload | null): AuthenticatedSession {
  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return session as AuthenticatedSession;
}

/**
 * Asserts a signed-in session. Does not call Better Auth again — uses Hono-populated context.
 */
export const isAuthenticated = middleware<Context>(({ ctx, next }) => {
  const session = requireAuthenticatedSession(ctx.session);

  return next({ ctx: { ...ctx, session } });
});
