import { eq, sql } from "drizzle-orm";

import { member, user } from "../schema/auth";
import type { Transaction } from "../transaction";

export async function findUserByEmail({
  tx,
  email,
}: {
  tx: Transaction;
  email: string;
}) {
  const normalizedEmail = email.toLowerCase();

  const [row] = await tx
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`)
    .limit(1);

  if (!row) {
    return null;
  }

  const memberships = await tx
    .select({ id: member.id })
    .from(member)
    .where(eq(member.userId, row.id))
    .limit(1);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    hasOrg: memberships.length > 0,
  };
}
