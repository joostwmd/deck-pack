import { and, eq, ne } from "drizzle-orm";

import { organization } from "../schema/auth";
import type { Transaction } from "../transaction";

export type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
  slug: string;
};

export type UpdateOrganizationResult =
  | {
      ok: true;
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
    }
  | { ok: false; reason: "not_found" | "slug_conflict" };

export async function updateOrganization({
  tx,
  input,
}: {
  tx: Transaction;
  input: UpdateOrganizationInput;
}): Promise<UpdateOrganizationResult> {
  const slug = input.slug.toLowerCase();

  const [existing] = await tx
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, input.organizationId))
    .limit(1);

  if (!existing) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const [slugConflict] = await tx
    .select({ id: organization.id })
    .from(organization)
    .where(and(eq(organization.slug, slug), ne(organization.id, input.organizationId)))
    .limit(1);

  if (slugConflict) {
    return { ok: false as const, reason: "slug_conflict" as const };
  }

  const [updated] = await tx
    .update(organization)
    .set({
      name: input.name,
      slug,
    })
    .where(eq(organization.id, input.organizationId))
    .returning({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
    });

  if (!updated) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, ...updated };
}
