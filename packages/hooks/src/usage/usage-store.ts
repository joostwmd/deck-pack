export type UsagePeriodInput = { preset: string } | { from: Date; to: Date };

export type UsageQuotaItem = {
  assetType: string;
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type UsageQuota = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  items: UsageQuotaItem[];
};

export type UsageSeriesPoint = {
  date: string;
  assetType: string;
  count: number;
};

export type UsageSeries = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  points: UsageSeriesPoint[];
};

export type UsageAssetTypeCount = {
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
  byAssetType: UsageAssetTypeCount[];
};

export type UsageBySeat = {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  seats: SeatUsageRow[];
};

export type UsageMember = {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  totalUsed: number;
  byAssetType: UsageAssetTypeCount[];
  points: UsageSeriesPoint[];
};

export interface UsageStore {
  quota: () => Promise<UsageQuota>;
  series: (period: UsagePeriodInput) => Promise<UsageSeries>;
  bySeat: (period: UsagePeriodInput) => Promise<UsageBySeat>;
  member: (input: UsagePeriodInput & { userId: string }) => Promise<UsageMember>;
}

/** Duck-typed surface of `trpc.usage`. */
export type UsageTrpcApi = {
  quota: { query: () => Promise<UsageQuota> };
  series: { query: (input: unknown) => Promise<UsageSeries> };
  bySeat: { query: (input: unknown) => Promise<UsageBySeat> };
  member: { query: (input: unknown) => Promise<UsageMember> };
};

export function createTrpcUsageStore(api: UsageTrpcApi): UsageStore {
  return {
    quota: () => api.quota.query(),
    series: (period) => api.series.query(period),
    bySeat: (period) => api.bySeat.query(period),
    member: (input) => api.member.query(input),
  };
}
