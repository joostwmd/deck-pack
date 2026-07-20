import { and, eq, ne } from "drizzle-orm";

import {
  ORGANIZATION_TYPES,
  parseOrganizationMetadata,
  serializeOrganizationMetadata,
  type OrganizationType,
} from "../org-metadata";
import { organization } from "../schema/auth";
import type { Transaction } from "../transaction";

export type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
  slug: string;
  type?: OrganizationType;
};

export type UpdateOrganizationResult =
  | {
      ok: true;
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      type: OrganizationType | null;
    }
  | { ok: false; reason: "not_found" | "slug_conflict" | "invalid_type" };

export async function updateOrganization({
  tx,
  input,
}: {
  tx: Transaction;
  input: UpdateOrganizationInput;
}): Promise<UpdateOrganizationResult> {
  const slug = input.slug.toLowerCase();

  const [existing] = await tx
    .select({ id: organization.id, metadata: organization.metadata })
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

  if (input.type !== undefined && !ORGANIZATION_TYPES.includes(input.type)) {
    return { ok: false as const, reason: "invalid_type" as const };
  }

  let metadataUpdate: string | undefined;
  if (input.type !== undefined) {
    const current = parseOrganizationMetadata(existing.metadata) ?? { type: "individual" as const };
    metadataUpdate = serializeOrganizationMetadata({ ...current, type: input.type });
  }

  const [updated] = await tx
    .update(organization)
    .set({
      name: input.name,
      slug,
      ...(metadataUpdate !== undefined ? { metadata: metadataUpdate } : {}),
    })
    .where(eq(organization.id, input.organizationId))
    .returning({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      metadata: organization.metadata,
    });

  if (!updated) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return {
    ok: true as const,
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    createdAt: updated.createdAt,
    type: parseOrganizationMetadata(updated.metadata)?.type ?? null,
  };
}
