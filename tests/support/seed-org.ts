import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DrizzleBillingRepository } from "../../packages/billing/src/repositories/billing-repository";
import { createDb } from "../../packages/db/src/client";
import { serializeOrganizationMetadata } from "../../packages/db/src/org-metadata";
import { member, organization, user } from "../../packages/db/src/schema/auth";
import { UnitOfWork } from "../../packages/db/src/transaction";
import { DrizzleOrganizationRepository } from "../../packages/organization/src/repositories/organization-repository";

const supportDir = path.dirname(fileURLToPath(import.meta.url));
const requireFromDb = createRequire(path.join(supportDir, "../../packages/db/package.json"));
const { eq } = requireFromDb("drizzle-orm") as typeof import("drizzle-orm");

export type SeededOrg = {
  organizationId: string;
  ownerUserId: string;
  slug: string;
  name: string;
};

/**
 * Creates a team organization with an owner membership and an active free-plan
 * subscription (via domain repositories — not legacy db/queries).
 */
export async function seedTeamOrganization(input: {
  ownerUserId: string;
  name?: string;
  slug?: string;
}): Promise<SeededOrg> {
  const db = createDb();
  const uow = new UnitOfWork(db);
  const billing = new DrizzleBillingRepository(uow);

  const [owner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, input.ownerUserId))
    .limit(1);

  if (!owner) {
    throw new Error(`seedTeamOrganization: owner ${input.ownerUserId} not found`);
  }

  const organizationId = crypto.randomUUID();
  const now = new Date();
  const name = input.name ?? "Acme";
  const slug = input.slug ?? `acme-${organizationId.slice(0, 8)}`;

  await db.insert(organization).values({
    id: organizationId,
    name,
    slug,
    createdAt: now,
    metadata: serializeOrganizationMetadata({ type: "team" }),
    logo: null,
  });

  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId,
    userId: input.ownerUserId,
    role: "organizationOwner",
    createdAt: now,
  });

  const freePlan = await billing.ensureFreePlan();
  if (!freePlan.ok) {
    throw new Error(`ensureFreePlan failed: ${freePlan.reason}`);
  }

  const sub = await billing.createOrganizationSubscription({
    organizationId,
    planId: freePlan.planId,
    quantity: 5,
  });
  if (!sub.ok) {
    throw new Error(`createOrganizationSubscription failed: ${sub.reason}`);
  }

  return { organizationId, ownerUserId: input.ownerUserId, slug, name };
}

/**
 * Bootstraps a personal (solo) organization for an existing user via the
 * organization repository, returning the organization id.
 */
export async function seedPersonalOrganization(input: {
  userId: string;
  name?: string;
  email: string;
}): Promise<{ organizationId: string }> {
  const db = createDb();
  const uow = new UnitOfWork(db);
  const billing = new DrizzleBillingRepository(uow);
  const orgs = new DrizzleOrganizationRepository(uow, billing);

  const result = await orgs.bootstrapPersonalOrganization({
    userId: input.userId,
    email: input.email,
    name: input.name,
  });

  if (!result.ok) {
    throw new Error(`bootstrapPersonalOrganization failed: ${result.reason}`);
  }

  return { organizationId: result.organizationId };
}
