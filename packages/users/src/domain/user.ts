export type OrganizationType = "individual" | "team";

export type UserWithMembership = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean;
  createdAt: Date;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  organizationType: OrganizationType | null;
  memberRole: string | null;
};
