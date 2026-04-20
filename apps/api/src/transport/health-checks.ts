import { sql } from "drizzle-orm";
import { db } from "@deck-pack/db";
import type { Hono } from "hono";

import type { AppEnv } from "../types";

export function registerHealthRoutes(app: Hono<AppEnv>) {
  app.get("/healthz", (c) => c.json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()) }));

  app.get("/readyz", async (c) => {
    try {
      await db.execute(sql`SELECT 1`);
      return c.json({ status: "ready" });
    } catch {
      return c.json({ status: "not_ready" }, 503);
    }
  });
}
