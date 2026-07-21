import { and, eq } from "drizzle-orm";

import { organizationSubscriptions } from "../schema/billing";
import type { Transaction } from "../transaction";

export type ActiveOrganizationSubscriptionRow = {
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
};

export async function getActiveOrganizationSubscriptionByOrgId({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<ActiveOrganizationSubscriptionRow | null> {
  const [row] = await tx
    .select({
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
    })
    .from(organizationSubscriptions)
    .where(
      and(
        eq(organizationSubscriptions.organizationId, organizationId),
        eq(organizationSubscriptions.status, "active"),
      ),
    )
    .limit(1);

  return row ?? null;
}
