export type PlatformUser = {
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
  organizationType: "individual" | "team" | null;
  memberRole: string | null;
};
