import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").notNull().default(false),
    activeVersionId: text("active_version_id"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("brand_profiles_userId_idx").on(table.userId),
    uniqueIndex("brand_profiles_userId_name_uidx").on(table.userId, table.name),
  ],
);

export const brandProfileVersions = pgTable(
  "brand_profile_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => brandProfiles.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("brand_profile_versions_profileId_idx").on(table.profileId),
    uniqueIndex("brand_profile_versions_profileId_version_uidx").on(
      table.profileId,
      table.version,
    ),
  ],
);

export const brandProfilesRelations = relations(brandProfiles, ({ one, many }) => ({
  user: one(user, { fields: [brandProfiles.userId], references: [user.id] }),
  versions: many(brandProfileVersions),
  activeVersion: one(brandProfileVersions, {
    fields: [brandProfiles.activeVersionId],
    references: [brandProfileVersions.id],
  }),
}));

export const brandProfileVersionsRelations = relations(brandProfileVersions, ({ one }) => ({
  profile: one(brandProfiles, {
    fields: [brandProfileVersions.profileId],
    references: [brandProfiles.id],
  }),
  createdBy: one(user, {
    fields: [brandProfileVersions.createdByUserId],
    references: [user.id],
  }),
}));
