import { z } from "zod";

export const ORGANIZATION_TYPES = ["individual", "team"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const OrganizationMetadataSchema = z.object({
  type: z.enum(ORGANIZATION_TYPES),
});

export type OrganizationMetadata = z.infer<typeof OrganizationMetadataSchema>;

export function parseOrganizationMetadata(
  raw: string | null | undefined,
): OrganizationMetadata | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = OrganizationMetadataSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializeOrganizationMetadata(metadata: OrganizationMetadata): string {
  return JSON.stringify(metadata);
}

export function getOrganizationType(raw: string | null | undefined): OrganizationType | null {
  return parseOrganizationMetadata(raw)?.type ?? null;
}

export function isTeamOrganization(raw: string | null | undefined): boolean {
  return getOrganizationType(raw) === "team";
}

export function isIndividualOrganization(raw: string | null | undefined): boolean {
  return getOrganizationType(raw) === "individual";
}
