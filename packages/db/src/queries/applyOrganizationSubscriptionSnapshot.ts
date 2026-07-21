import { eq } from "drizzle-orm";

import { calendarMonthEntitlementWindow } from "../usage-period";
import { organizationSubscriptions } from "../schema/billing";
import type { Transaction } from "../transaction";

export type OrganizationSubscriptionSnapshot = {
  organizationId: string;
  planId: string;
  quantity: number;
  status: string;
  provider?: string;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
};

export type ApplyOrganizationSubscriptionSnapshotResult =
  | {
      ok: true;
      id: string;
      organizationId: string;
      planId: string;
      quantity: number;
      status: string;
      provider: string;
      externalCustomerId: string | null;
      externalSubscriptionId: string | null;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }
  | {
      ok: false;
      reason: "not_found";
    };

function defaultPeriod(now = new Date()) {
  const window = calendarMonthEntitlementWindow(now);
  return {
    currentPeriodStart: window.start,
    currentPeriodEnd: window.end,
  };
}

export async function applyOrganizationSubscriptionSnapshot({
  tx,
  subscriptionId,
  snapshot,
}: {
  tx: Transaction;
  subscriptionId: string;
  snapshot: Partial<OrganizationSubscriptionSnapshot>;
}): Promise<ApplyOrganizationSubscriptionSnapshotResult> {
  const [row] = await tx
    .update(organizationSubscriptions)
    .set({
      ...(snapshot.planId !== undefined ? { planId: snapshot.planId } : {}),
      ...(snapshot.quantity !== undefined ? { quantity: snapshot.quantity } : {}),
      ...(snapshot.status !== undefined ? { status: snapshot.status } : {}),
      ...(snapshot.provider !== undefined ? { provider: snapshot.provider } : {}),
      ...(snapshot.externalCustomerId !== undefined
        ? { externalCustomerId: snapshot.externalCustomerId }
        : {}),
      ...(snapshot.externalSubscriptionId !== undefined
        ? { externalSubscriptionId: snapshot.externalSubscriptionId }
        : {}),
      ...(snapshot.currentPeriodStart !== undefined
        ? { currentPeriodStart: snapshot.currentPeriodStart }
        : {}),
      ...(snapshot.currentPeriodEnd !== undefined
        ? { currentPeriodEnd: snapshot.currentPeriodEnd }
        : {}),
    })
    .where(eq(organizationSubscriptions.id, subscriptionId))
    .returning({
      id: organizationSubscriptions.id,
      organizationId: organizationSubscriptions.organizationId,
      planId: organizationSubscriptions.planId,
      quantity: organizationSubscriptions.quantity,
      status: organizationSubscriptions.status,
      provider: organizationSubscriptions.provider,
      externalCustomerId: organizationSubscriptions.externalCustomerId,
      externalSubscriptionId: organizationSubscriptions.externalSubscriptionId,
      currentPeriodStart: organizationSubscriptions.currentPeriodStart,
      currentPeriodEnd: organizationSubscriptions.currentPeriodEnd,
      createdAt: organizationSubscriptions.createdAt,
      updatedAt: organizationSubscriptions.updatedAt,
    });

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, ...row };
}

export function getDefaultSubscriptionPeriod(now = new Date()) {
  return defaultPeriod(now);
}
