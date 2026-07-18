import { eq } from "drizzle-orm";

import { organization, session } from "../schema/auth";
import type { Transaction } from "../transaction";

export type DeleteOrganizationResult =
  | { ok: true; organizationId: string }
  | { ok: false; reason: "not_found" };

/**
 * Hard-deletes an organization. Members and invitations cascade via FK.
 * Clears `activeOrganizationId` on any sessions still pointing at it.
 */
export async function deleteOrganization({
  tx,
  organizationId,
}: {
  tx: Transaction;
  organizationId: string;
}): Promise<DeleteOrganizationResult> {
  const [existing] = await tx
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!existing) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await tx
    .update(session)
    .set({ activeOrganizationId: null })
    .where(eq(session.activeOrganizationId, organizationId));

  await tx.delete(organization).where(eq(organization.id, organizationId));

  return { ok: true as const, organizationId };
}
