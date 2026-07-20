import { TRPCError } from "@trpc/server";

import type { Transaction } from "@deck-pack/db/transaction";
import { hasActiveSeat } from "@deck-pack/db/queries/activateOrganizationSeat";
import { isOrganizationMember } from "@deck-pack/db/queries/isOrganizationMember";

export async function assertActiveSeat(
  tx: Transaction,
  input: { organizationId: string; userId: string },
): Promise<void> {
  const isMember = await isOrganizationMember({
    tx,
    userId: input.userId,
    organizationId: input.organizationId,
  });

  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  const seated = await hasActiveSeat({
    tx,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  if (!seated) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "An active add-in seat is required for this operation",
    });
  }
}
