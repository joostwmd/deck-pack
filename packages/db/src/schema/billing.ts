import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

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

export const SUBSCRIPTION_PROVIDERS = ["manual", "polar"] as const;
export type SubscriptionProvider = (typeof SUBSCRIPTION_PROVIDERS)[number];

export const SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const plans = pgTable(
  "plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    externalProductId: text("external_product_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("plans_slug_uidx").on(table.slug),
    uniqueIndex("plans_externalProductId_uidx")
      .on(table.externalProductId)
      .where(sql`${table.externalProductId} IS NOT NULL`),
  ],
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
    provider: text("provider").notNull().default("manual"),
    externalCustomerId: text("external_customer_id"),
    externalSubscriptionId: text("external_subscription_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
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
    uniqueIndex("organization_subscriptions_externalSubscriptionId_uidx")
      .on(table.externalSubscriptionId)
      .where(sql`${table.externalSubscriptionId} IS NOT NULL`),
    index("organization_subscriptions_organizationId_idx").on(table.organizationId),
    index("organization_subscriptions_planId_idx").on(table.planId),
  ],
);

export const ORGANIZATION_SEAT_STATUSES = ["pending", "active", "revoked"] as const;
export type OrganizationSeatStatus = (typeof ORGANIZATION_SEAT_STATUSES)[number];

/** Named add-in license assignment for an organization. */
export const organizationSeats = pgTable(
  "organization_seats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"),
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_seats_org_email_active_uidx")
      .on(table.organizationId, table.email)
      .where(sql`${table.status} IN ('pending', 'active')`),
    index("organization_seats_organizationId_status_idx").on(table.organizationId, table.status),
    index("organization_seats_email_idx").on(table.email),
    index("organization_seats_userId_idx").on(table.userId),
  ],
);
