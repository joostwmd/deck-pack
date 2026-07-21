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
  insertsPerMonth: number | null;
};

export type PlanSummary = {
  id: string;
  name: string;
  slug: string;
  limits: PlanLimit[];
};

export type ActiveSubscription = {
  planId: string;
  quantity: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

export type EntitlementWindow = {
  start: Date;
  end: Date;
  label: string;
};

export type UsagePeriodContext = {
  now: Date;
  billingPeriodStart: Date | null;
  billingPeriodEnd: Date | null;
};

export type AssetTypeCount = {
  assetType: string;
  count: number;
};

export type InsertionSeriesPoint = {
  date: string;
  assetType: string;
  count: number;
};

export type SeatUsageRow = {
  seatId: string;
  userId: string | null;
  email: string;
  name: string | null;
  status: string;
  totalUsed: number;
  byAssetType: AssetTypeCount[];
};

export type QuotaItem = {
  assetType: PlanLimitAssetType;
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type UsageQuota = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  items: QuotaItem[];
};

export type UsageSeries = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  points: InsertionSeriesPoint[];
};

export type UsageBySeat = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  seats: SeatUsageRow[];
};

export type MemberUsage = {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  totalUsed: number;
  byAssetType: AssetTypeCount[];
  points: InsertionSeriesPoint[];
};

export type CountByAssetTypeInput = {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  userId?: string;
};

export type ListSeriesInput = CountByAssetTypeInput;

export type ListSeatUsageInput = {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
};
