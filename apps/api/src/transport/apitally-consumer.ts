import { setConsumer } from "apitally/hono";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

/**
 * Labels Apitally traffic by consumer after session middleware.
 * Paths under `/api/machine` stay unlabeled here until a dedicated machine sub-app sets its own consumer.
 */
export const apitallySessionConsumerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.path.startsWith("/api/machine")) {
    await next();
    return;
  }

  const log = c.get("logger");

  try {
    const session = c.get("session");

    if (!session?.user) {
      setConsumer(c, null);
      await next();
      return;
    }

    const user = session.user;
    const role = "role" in user && typeof user.role === "string" ? user.role : undefined;

    if (role === "admin") {
      setConsumer(c, {
        identifier: user.id,
        group: "admin",
        name: user.name ?? user.email ?? user.id,
      });
    } else if (session.session?.activeOrganizationId) {
      const orgId = session.session.activeOrganizationId;
      setConsumer(c, {
        identifier: user.id,
        group: `operator:${orgId}`,
        name: user.name ?? user.email ?? user.id,
      });
    } else {
      setConsumer(c, {
        identifier: user.id,
        group: "user:no-org",
        name: user.name ?? user.email ?? user.id,
      });
    }
  } catch (e) {
    log?.warn("Apitally setConsumer failed", {
      message: e instanceof Error ? e.message : String(e),
    });
  }

  await next();
});
