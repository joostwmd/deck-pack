import type { Context as HonoContext } from "hono";
import type { Logger } from "@logtape/logtape";
import { tx } from "@deck-pack/db";

import type { AppEnv, SessionPayload } from "../types";

export type CreateContextOptions = {
  context: HonoContext<AppEnv>;
};

/** tRPC context — explicit shape avoids TS portability issues with `Headers` inference. */
export type Context = {
  session: SessionPayload | null;
  user: SessionPayload["user"] | null;
  requestId: string;
  logger: Logger;
  headers: Headers;
  tx: typeof tx;
};

export async function createContext({ context }: CreateContextOptions): Promise<Context> {
  return {
    session: context.get("session"),
    user: context.get("user"),
    requestId: context.get("requestId"),
    logger: context.get("logger"),
    headers: context.req.raw.headers,
    tx,
  };
}

/** Active organization id from the session, or null when unset (discovery/asset browse). */
export function activeOrganizationIdFromSession(ctx: Context): string | null {
  return ctx.session?.session?.activeOrganizationId ?? null;
}
