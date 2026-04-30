import { type Transaction } from "../transaction";
import { member as memberTable } from "../schema/auth";
import { eq } from "drizzle-orm";

export async function isOrganizationMember({
  tx,
  userId,
  organizationId,
}: {
  tx: Transaction;
  userId: string;
  organizationId: string;
}): Promise<boolean> {
  const member = await tx.select().from(memberTable).where(eq(memberTable.userId, userId)).limit(1);
  return member?.[0]?.organizationId === organizationId;
}
