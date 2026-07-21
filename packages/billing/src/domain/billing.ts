export const PLAN_LIMIT_ASSET_TYPES = [
  "logo",
  "flag",
  "icon",
  "harvey_ball",
  "photo",
  "slide",
  "shape",
] as const;

export type PlanLimitAssetType = (typeof PLAN_LIMIT_ASSET_TYPES)[number];

export type PlanLimit = {
  assetType: PlanLimitAssetType;
  /** Null means unlimited inserts for this asset class. */
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

export type CreatePlanResult =
  | ({ ok: true } & Plan)
  | { ok: false; reason: "slug_conflict" | "invalid_limits" };

export type UpdatePlanResult =
  | ({ ok: true } & Plan)
  | { ok: false; reason: "not_found" | "slug_conflict" | "invalid_limits" };

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

export type SubscriptionMutationResult = {
  id: string;
  organizationId: string;
  planId: string;
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

export type CreateOrganizationSubscriptionResult =
  | ({ ok: true } & SubscriptionMutationResult)
  | {
      ok: false;
      reason: "organization_not_found" | "plan_not_found" | "already_subscribed";
    };

export type UpdateOrganizationSubscriptionInput = {
  subscriptionId: string;
  planId?: string;
  quantity?: number;
  status?: "active" | "canceled";
};

export type UpdateOrganizationSubscriptionResult =
  | ({ ok: true } & SubscriptionMutationResult)
  | {
      ok: false;
      reason: "not_found" | "plan_not_found" | "already_subscribed";
    };
