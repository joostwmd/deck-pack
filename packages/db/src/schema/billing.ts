import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";

/** Asset classes that can have per-plan monthly insert limits. */
export const PLAN_LIMIT_ASSET_TYPES = [
  "logo",
  "flag",
  "icon",
  "harvey_ball",
  "photo",
  "slide",
  "shape",
] as const;

export type PlanLimitAssetType = (typeof PLAN_LIMIT_ASSET_TYPES)[number];

export const plans = pgTable(
  "plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("plans_slug_uidx").on(table.slug)],
);

export const planLimits = pgTable(
  "plan_limits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    assetType: text("asset_type").notNull(),
    /** Null means unlimited inserts for this asset class. */
    insertsPerMonth: integer("inserts_per_month"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("plan_limits_planId_assetType_uidx").on(table.planId, table.assetType),
    index("plan_limits_planId_idx").on(table.planId),
  ],
);

/** One active org entitlement: plan × quantity (seats). */
export const organizationSubscriptions = pgTable(
  "organization_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_subscriptions_org_active_uidx")
      .on(table.organizationId)
      .where(sql`${table.status} = 'active'`),
    index("organization_subscriptions_organizationId_idx").on(table.organizationId),
    index("organization_subscriptions_planId_idx").on(table.planId),
  ],
);
