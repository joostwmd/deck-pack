export const ORGANIZATION_TYPES = ["individual", "team"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  ownerEmail: string | null;
  type: OrganizationType | null;
};

export type OrganizationDetail = OrganizationSummary & {
  ownerName: string | null;
  memberCount: number;
};

export type OrganizationMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  ownerEmail: string;
  type?: OrganizationType;
};

export type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
  slug: string;
  type?: OrganizationType;
};

export type UserLookup =
  | { found: true; name: string; email: string; hasOrg: boolean }
  | { found: false };

export type CreateOrganizationResult = {
  organizationId: string;
  userId: string;
  isNewUser: boolean;
};
