import { auth } from "@deck-pack/auth/server";
import type { Logger } from "@logtape/logtape";

type ApiSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** Session from Better Auth + org plugin fields stored on the `session` row (see `packages/db/schema/auth.ts`). */
export type SessionPayload = Omit<ApiSession, "session"> & {
  session: ApiSession["session"] & {
    activeOrganizationId?: string | null;
    role?: string | null;
  };
};

export type AppEnv = {
  Variables: {
    requestId: string;
    user: SessionPayload["user"] | null;
    /** Full Better Auth session payload (user + session record), or null when signed out */
    session: SessionPayload | null;
    logger: Logger;
  };
};
