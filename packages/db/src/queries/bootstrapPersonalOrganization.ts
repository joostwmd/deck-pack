import { eq } from "drizzle-orm";

import {
  serializeOrganizationMetadata,
  type OrganizationMetadata,
} from "../org-metadata";
import { member, organization, user } from "../schema/auth";
import type { Transaction } from "../transaction";

import { assignOrganizationSeat } from "./assignOrganizationSeat";
import { createOrganizationSubscription } from "./createOrganizationSubscription";
import { ensureFreePlan } from "./ensureFreePlan";

const OWNER_ROLE = "organizationOwner" as const;

export type BootstrapPersonalOrganizationInput = {
  userId: string;
  email: string;
  name?: string;
};

export type BootstrapPersonalOrganizationResult =
  | {
      ok: true;
      organizationId: string;
      created: boolean;
    }
  | {
      ok: false;
      reason: "user_not_found" | "free_plan_failed" | "subscription_failed" | "seat_failed";
    };

function personalOrgSlug(userId: string): string {
  return `personal-${userId.replace(/-/g, "").slice(0, 12).toLowerCase()}`;
}

function personalOrgName(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? `${trimmed}'s workspace` : "Personal workspace";
}

export async function bootstrapPersonalOrganization({
  tx,
  input,
}: {
  tx: Transaction;
  input: BootstrapPersonalOrganizationInput;
}): Promise<BootstrapPersonalOrganizationResult> {
  const [existingMembership] = await tx
    .select({
      organizationId: member.organizationId,
    })
    .from(member)
    .where(eq(member.userId, input.userId))
    .limit(1);

  if (existingMembership) {
    return {
      ok: true,
      organizationId: existingMembership.organizationId,
      created: false,
    };
  }

  const [userRecord] = await tx
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);

  if (!userRecord) {
    return { ok: false, reason: "user_not_found" };
  }

  const metadata: OrganizationMetadata = { type: "individual" };
  const organizationId = crypto.randomUUID();
  const now = new Date();
  const slug = personalOrgSlug(input.userId);
  const orgName = personalOrgName(input.name ?? userRecord.name);

  await tx.insert(organization).values({
    id: organizationId,
    name: orgName,
    slug,
    createdAt: now,
    metadata: serializeOrganizationMetadata(metadata),
    logo: null,
  });

  await tx.insert(member).values({
    id: crypto.randomUUID(),
    organizationId,
    userId: input.userId,
    role: OWNER_ROLE,
    createdAt: now,
  });

  const freePlan = await ensureFreePlan({ tx });
  if (!freePlan.ok) {
    return { ok: false, reason: "free_plan_failed" };
  }

  const subscription = await createOrganizationSubscription({
    tx,
    input: {
      organizationId,
      planId: freePlan.planId,
      quantity: 1,
    },
  });

  if (!subscription.ok) {
    return { ok: false, reason: "subscription_failed" };
  }

  const seat = await assignOrganizationSeat({
    tx,
    input: {
      organizationId,
      email: input.email.toLowerCase(),
      assignedBy: input.userId,
      userId: input.userId,
      status: "active",
    },
  });

  if (!seat.ok) {
    return { ok: false, reason: "seat_failed" };
  }

  return { ok: true, organizationId, created: true };
}
