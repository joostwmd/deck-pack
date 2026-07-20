import {
  getOrganizationType,
  type OrganizationType,
} from "@deck-pack/db/org-metadata";

export const WORKSPACE_KINDS = ["solo", "team"] as const;
export type WorkspaceKind = (typeof WORKSPACE_KINDS)[number];

export function workspaceFromOrganizationType(
  type: OrganizationType | null | undefined,
): WorkspaceKind | null {
  if (type === "individual") return "solo";
  if (type === "team") return "team";
  return null;
}

export function workspaceFromOrganizationMetadata(
  raw: string | null | undefined,
): WorkspaceKind | null {
  return workspaceFromOrganizationType(getOrganizationType(raw));
}

export function isWorkspaceKind(value: unknown): value is WorkspaceKind {
  return value === "solo" || value === "team";
}
