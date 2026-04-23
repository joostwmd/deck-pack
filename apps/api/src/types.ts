import { auth } from "@deck-pack/auth/server";
import type { Logger } from "@logtape/logtape";

export type SessionPayload = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AppEnv = {
  Variables: {
    requestId: string;
    user: SessionPayload["user"] | null;
    /** Full Better Auth session payload (user + session record), or null when signed out */
    session: SessionPayload | null;
    logger: Logger;
  };
};
