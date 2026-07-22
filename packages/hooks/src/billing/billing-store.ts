export type PlanAssetType = "logo" | "flag" | "icon" | "harvey_ball" | "photo" | "slide" | "shape";

export type PlanLimit = {
  assetType: PlanAssetType;
  /** Null means unlimited. */
  insertsPerMonth: number | null;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  limits: PlanLimit[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlanInput = {
  name: string;
  slug: string;
  limits: PlanLimit[];
};

export type UpdatePlanInput = {
  planId: string;
  name: string;
  slug: string;
  limits: PlanLimit[];
};

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  planId: string;
  planName: string;
  planSlug: string;
  quantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrganizationSubscriptionInput = {
  organizationId: string;
  planId: string;
  quantity: number;
};

export type UpdateOrganizationSubscriptionInput = {
  subscriptionId: string;
  planId?: string;
  quantity?: number;
  status?: "active" | "canceled";
};

export interface BillingStore {
  listPlans: () => Promise<Plan[]>;
  getPlan: (planId: string) => Promise<Plan>;
  createPlan: (input: CreatePlanInput) => Promise<Plan>;
  updatePlan: (input: UpdatePlanInput) => Promise<Plan>;
  listOrganizationSubscriptions: () => Promise<OrganizationSubscription[]>;
  getOrganizationSubscription: (subscriptionId: string) => Promise<OrganizationSubscription>;
  createOrganizationSubscription: (
    input: CreateOrganizationSubscriptionInput,
  ) => Promise<OrganizationSubscription>;
  updateOrganizationSubscription: (
    input: UpdateOrganizationSubscriptionInput,
  ) => Promise<OrganizationSubscription>;
}

/** Duck-typed surface of `trpc.billing` (admin/ops plan + subscription management). */
export type BillingTrpcApi = {
  listPlans: { query: () => Promise<Plan[]> };
  getPlan: { query: (input: unknown) => Promise<Plan> };
  createPlan: { mutate: (input: unknown) => Promise<Plan> };
  updatePlan: { mutate: (input: unknown) => Promise<Plan> };
  listOrganizationSubscriptions: { query: () => Promise<OrganizationSubscription[]> };
  getOrganizationSubscription: { query: (input: unknown) => Promise<OrganizationSubscription> };
  createOrganizationSubscription: {
    mutate: (input: unknown) => Promise<OrganizationSubscription>;
  };
  updateOrganizationSubscription: {
    mutate: (input: unknown) => Promise<OrganizationSubscription>;
  };
};

export function createTrpcBillingStore(api: BillingTrpcApi): BillingStore {
  return {
    listPlans: () => api.listPlans.query(),
    getPlan: (planId) => api.getPlan.query({ planId }),
    createPlan: (input) => api.createPlan.mutate(input),
    updatePlan: (input) => api.updatePlan.mutate(input),
    listOrganizationSubscriptions: () => api.listOrganizationSubscriptions.query(),
    getOrganizationSubscription: (subscriptionId) =>
      api.getOrganizationSubscription.query({ subscriptionId }),
    createOrganizationSubscription: (input) => api.createOrganizationSubscription.mutate(input),
    updateOrganizationSubscription: (input) => api.updateOrganizationSubscription.mutate(input),
  };
}
