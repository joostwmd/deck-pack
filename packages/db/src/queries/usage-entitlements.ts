import { resolveEntitlementWindow, type UsagePeriodContext } from "../usage-period";
import { getActiveOrganizationSubscriptionByOrgId } from "./getActiveOrganizationSubscriptionByOrgId";
import { getPlan } from "./getPlan";
import { countInsertionsForOrgPeriod } from "./countInsertionsForOrgPeriod";
import type { Transaction } from "../transaction";

export type EntitlementWindow = {
  start: Date;
  end: Date;
  label: string;
};

export async function getEntitlementWindow({
  tx,
  organizationId,
  now = new Date(),
}: {
  tx: Transaction;
  organizationId: string;
  now?: Date;
}): Promise<EntitlementWindow> {
  const subscription = await getActiveOrganizationSubscriptionByOrgId({
    tx,
    organizationId,
  });

  const ctx: UsagePeriodContext = {
    now,
    billingPeriodStart: subscription?.currentPeriodStart ?? null,
    billingPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };

  return resolveEntitlementWindow(ctx);
}

export type AssertInsertAllowedResult =
  | { ok: true }
  | { ok: false; reason: "no_subscription" | "quota_exceeded"; assetType: string };

export async function assertInsertAllowed({
  tx,
  organizationId,
  assetType,
  now = new Date(),
}: {
  tx: Transaction;
  organizationId: string;
  assetType: string;
  now?: Date;
}): Promise<AssertInsertAllowedResult> {
  const subscription = await getActiveOrganizationSubscriptionByOrgId({
    tx,
    organizationId,
  });

  if (!subscription) {
    return { ok: false, reason: "no_subscription", assetType };
  }

  const plan = await getPlan({ tx, planId: subscription.planId });
  if (!plan) {
    return { ok: false, reason: "no_subscription", assetType };
  }

  const limitRow = plan.limits.find((limit) => limit.assetType === assetType);
  const limit = limitRow?.insertsPerMonth ?? null;

  if (limit === null) {
    return { ok: true };
  }

  const window = await getEntitlementWindow({ tx, organizationId, now });
  const used = await countInsertionsForOrgPeriod({
    tx,
    input: {
      organizationId,
      assetType,
      periodStart: window.start,
      periodEnd: window.end,
    },
  });

  if (used >= limit) {
    return { ok: false, reason: "quota_exceeded", assetType };
  }

  return { ok: true };
}

export async function getUsagePeriodContext({
  tx,
  organizationId,
  now = new Date(),
}: {
  tx: Transaction;
  organizationId: string;
  now?: Date;
}): Promise<UsagePeriodContext> {
  const subscription = await getActiveOrganizationSubscriptionByOrgId({
    tx,
    organizationId,
  });

  return {
    now,
    billingPeriodStart: subscription?.currentPeriodStart ?? null,
    billingPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}
