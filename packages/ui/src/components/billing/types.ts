import type { PlanAssetType } from "./asset-types";

export type PlanLimit = {
  assetType: PlanAssetType | string;
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

export type OrganizationOption = { id: string; name: string; slug: string };
export type PlanOption = { id: string; name: string; slug: string };
