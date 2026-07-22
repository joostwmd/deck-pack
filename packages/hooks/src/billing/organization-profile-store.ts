export type OrganizationProfilePlan = {
  id: string;
  name: string;
  slug: string;
  quantity: number;
};

export type OrganizationProfile = {
  type: "individual" | "team" | null;
  workspace: "solo" | "team" | null;
  plan: OrganizationProfilePlan | null;
};

export interface OrganizationProfileStore {
  getOrganizationProfile: () => Promise<OrganizationProfile>;
}

/**
 * Duck-typed surface satisfied by `trpc.members` (the org's own billing/plan profile is
 * currently served from the members router — see `apps/api/src/routers/members-router.ts`).
 */
export type OrganizationProfileTrpcApi = {
  getOrganizationProfile: { query: () => Promise<OrganizationProfile> };
};

export function createTrpcOrganizationProfileStore(
  api: OrganizationProfileTrpcApi,
): OrganizationProfileStore {
  return {
    getOrganizationProfile: () => api.getOrganizationProfile.query(),
  };
}
