import { eq } from "drizzle-orm";

import { getOrganizationType, type OrganizationType } from "../org-metadata";
import { invitation, organization } from "../schema/auth";
import type { Transaction } from "../transaction";

export type InvitationDetails = {
  invitationId: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
};

export async function getInvitationById({
  tx,
  invitationId,
}: {
  tx: Transaction;
  invitationId: string;
}): Promise<InvitationDetails | null> {
  const [row] = await tx
    .select({
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationId: invitation.organizationId,
      organizationName: organization.name,
      metadata: organization.metadata,
    })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .where(eq(invitation.id, invitationId))
    .limit(1);

  if (!row) return null;

  return {
    invitationId: row.invitationId,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: row.expiresAt,
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    organizationType: getOrganizationType(row.metadata),
  };
}
