export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  ownerEmail: string | null;
  type: "individual" | "team" | null;
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

export type LookupUserResult =
  | { found: true; name: string; email: string; hasOrg: boolean }
  | { found: false };

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  ownerEmail: string;
};

export type CreateOrganizationResult = {
  organizationId: string;
  userId: string;
  isNewUser: boolean;
};

export type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
  slug: string;
  type?: "individual" | "team";
};

export type UpdateOrganizationResult = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  type: "individual" | "team" | null;
};

export interface OrganizationStore {
  lookupUser: (email: string) => Promise<LookupUserResult>;
  listOrganizations: () => Promise<OrganizationSummary[]>;
  getOrganization: (organizationId: string) => Promise<OrganizationDetail>;
  listMembers: (organizationId: string) => Promise<OrganizationMember[]>;
  createOrganization: (input: CreateOrganizationInput) => Promise<CreateOrganizationResult>;
  updateOrganization: (input: UpdateOrganizationInput) => Promise<UpdateOrganizationResult>;
  deleteOrganization: (organizationId: string) => Promise<{ organizationId: string }>;
}

/**
 * Duck-typed surface of `trpc.organization`. Inputs/outputs are intentionally loose
 * so Zod-inferred tRPC clients assign.
 */
export type OrganizationTrpcApi = {
  lookupUser: { query: (input: unknown) => Promise<LookupUserResult> };
  listOrganizations: { query: () => Promise<OrganizationSummary[]> };
  getOrganization: { query: (input: unknown) => Promise<OrganizationDetail> };
  listMembers: { query: (input: unknown) => Promise<OrganizationMember[]> };
  createOrganization: { mutate: (input: unknown) => Promise<CreateOrganizationResult> };
  updateOrganization: { mutate: (input: unknown) => Promise<UpdateOrganizationResult> };
  deleteOrganization: { mutate: (input: unknown) => Promise<{ organizationId: string }> };
};

export function createTrpcOrganizationStore(api: OrganizationTrpcApi): OrganizationStore {
  return {
    lookupUser: (email) => api.lookupUser.query({ email }),
    listOrganizations: () => api.listOrganizations.query(),
    getOrganization: (organizationId) => api.getOrganization.query({ organizationId }),
    listMembers: (organizationId) => api.listMembers.query({ organizationId }),
    createOrganization: (input) => api.createOrganization.mutate(input),
    updateOrganization: (input) => api.updateOrganization.mutate(input),
    deleteOrganization: (organizationId) => api.deleteOrganization.mutate({ organizationId }),
  };
}
