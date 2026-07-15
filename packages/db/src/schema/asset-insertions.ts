import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const assetInsertions = pgTable(
  "asset_insertions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assetType: text("asset_type").notNull(),
    externalId: text("external_id").notNull(),
    client: text("client").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("asset_insertions_userId_idx").on(table.userId),
    index("asset_insertions_assetType_idx").on(table.assetType),
    index("asset_insertions_externalId_idx").on(table.externalId),
    index("asset_insertions_client_idx").on(table.client),
    index("asset_insertions_createdAt_idx").on(table.createdAt),
  ],
);
