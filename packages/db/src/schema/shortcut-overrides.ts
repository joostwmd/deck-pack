import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const shortcutOverrides = pgTable(
  "shortcut_overrides",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    shortcutId: text("shortcut_id").notNull(),
    hotkey: text("hotkey").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("shortcut_overrides_userId_shortcutId_schemaVersion_uidx").on(
      table.userId,
      table.shortcutId,
      table.schemaVersion,
    ),
    index("shortcut_overrides_userId_schemaVersion_idx").on(
      table.userId,
      table.schemaVersion,
    ),
  ],
);
