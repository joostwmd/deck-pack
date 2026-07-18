import { asc, eq } from "drizzle-orm";

import { organization } from "../schema/auth";
import { organizationSubscriptions, plans } from "../schema/billing";
import type { Transaction } from "../transaction";

export async function listOrganizationSubscriptions({ tx }: { tx: Transaction }) {
  return tx
    .select({
      id: organizationSubscriptions.id,
      organizationId: organizationSubscriptions.organizationId,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      planId: organizationSubscriptions.planId,
      planName: plans.name,
      planSlug: plans.slug,
      quantity: organizationSubscriptions.quantity,
      status: organizationSubscriptions.status,
      createdAt: organizationSubscriptions.createdAt,
      updatedAt: organizationSubscriptions.updatedAt,
    })
    .from(organizationSubscriptions)
    .innerJoin(organization, eq(organization.id, organizationSubscriptions.organizationId))
    .innerJoin(plans, eq(plans.id, organizationSubscriptions.planId))
    .orderBy(asc(organization.name));
}
