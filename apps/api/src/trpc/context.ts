import type { Context as HonoContext } from "hono";
import type { Logger } from "@logtape/logtape";
import type { OrganizationRepository } from "@deck-pack/organization";
import type { SeatsRepository } from "@deck-pack/seats";
import type { UsersRepository } from "@deck-pack/users";

import type { AppContainer } from "../container";
import type { AppEnv, SessionPayload } from "../types";

export type CreateContextOptions = {
  context: HonoContext<AppEnv>;
  container: AppContainer;
};

/** tRPC context — explicit shape avoids TS portability issues with `Headers` inference. */
export type Context = {
  session: SessionPayload | null;
  user: SessionPayload["user"] | null;
  requestId: string;
  logger: Logger;
  headers: Headers;
  organization: OrganizationRepository;
  seats: SeatsRepository;
  users: UsersRepository;
};

export async function createContext({
  context,
  container,
}: CreateContextOptions): Promise<Context> {
  return {
    session: context.get("session"),
    user: context.get("user"),
    requestId: context.get("requestId"),
    logger: context.get("logger"),
    headers: context.req.raw.headers,
    organization: container.organizationRepository,
    seats: container.seatsRepository,
    users: container.usersRepository,
  };
}

/** Active organization id from the session, or null when unset (discovery/asset browse). */
export function activeOrganizationIdFromSession(ctx: Context): string | null {
  return ctx.session?.session?.activeOrganizationId ?? null;
}
