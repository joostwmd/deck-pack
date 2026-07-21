import { eq } from "drizzle-orm";

import { getOrganizationType } from "../org-metadata";
import { organization, session } from "../schema/auth";
import type { Transaction } from "../transaction";

/**
 * Points the user's sessions at a new active organization and workspace kind.
 */
export async function setSessionActiveOrganization({
  tx,
  userId,
  organizationId,
  sessionId,
}: {
  tx: Transaction;
  userId: string;
  organizationId: string;
  /** When provided, updates this session first (current request). */
  sessionId?: string;
}): Promise<{ workspace: "solo" | "team" | null }> {
  const [org] = await tx
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  const type = getOrganizationType(org?.metadata);
  const workspace = type === "individual" ? "solo" : type === "team" ? "team" : null;

  if (sessionId) {
    await tx
      .update(session)
      .set({
        activeOrganizationId: organizationId,
        ...(workspace ? { workspace } : {}),
      })
      .where(eq(session.id, sessionId));
  }

  // Keep other sessions for this user in sync so portal/add-in stay consistent.
  await tx
    .update(session)
    .set({
      activeOrganizationId: organizationId,
      ...(workspace ? { workspace } : {}),
    })
    .where(eq(session.userId, userId));

  return { workspace };
}
