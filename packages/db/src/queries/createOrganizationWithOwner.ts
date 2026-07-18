import { eq, sql } from "drizzle-orm";

import { member, organization, user } from "../schema/auth";
import { withTransaction } from "../transaction";
import type { Transaction } from "../transaction";

const OWNER_ROLE = "organizationOwner" as const;

export type CreateOrganizationWithOwnerInput = {
  name: string;
  slug: string;
  ownerEmail: string;
};

export type CreateOrganizationWithOwnerResult =
  | {
      ok: true;
      organizationId: string;
      userId: string;
      isNewUser: boolean;
    }
  | { ok: false; reason: "slug_conflict" | "user_has_org" };

export async function createOrganizationWithOwner({
  tx,
  input,
}: {
  tx: Transaction;
  input: CreateOrganizationWithOwnerInput;
}): Promise<CreateOrganizationWithOwnerResult> {
  const normalizedEmail = input.ownerEmail.toLowerCase();
  const slug = input.slug.toLowerCase();

  return withTransaction(async () => {
    const [slugConflict] = await tx
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    if (slugConflict) {
      return { ok: false as const, reason: "slug_conflict" as const };
    }

    const [existingUser] = await tx
      .select({
        id: user.id,
        email: user.email,
      })
      .from(user)
      .where(sql`lower(${user.email}) = ${normalizedEmail}`)
      .limit(1);

    if (existingUser) {
      const existingMembership = await tx
        .select({ id: member.id })
        .from(member)
        .where(eq(member.userId, existingUser.id))
        .limit(1);

      if (existingMembership.length > 0) {
        return { ok: false as const, reason: "user_has_org" as const };
      }
    }

    const isNewUser = !existingUser;
    let ownerUserId: string;

    if (existingUser) {
      ownerUserId = existingUser.id;
    } else {
      const newId = crypto.randomUUID();
      const displayName =
        normalizedEmail
          .split("@")[0]
          ?.replace(/[._-]+/g, " ")
          .trim() || "User";

      await tx.insert(user).values({
        id: newId,
        name: displayName,
        email: normalizedEmail,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: null,
      });

      ownerUserId = newId;
    }

    const organizationId = crypto.randomUUID();
    const now = new Date();

    await tx.insert(organization).values({
      id: organizationId,
      name: input.name,
      slug,
      createdAt: now,
      metadata: null,
      logo: null,
    });

    await tx.insert(member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: ownerUserId,
      role: OWNER_ROLE,
      createdAt: now,
    });

    return {
      ok: true as const,
      organizationId,
      userId: ownerUserId,
      isNewUser,
    };
  });
}
