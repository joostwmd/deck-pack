import type { UsagePeriodInput } from "./usage-store";

function periodKeyPart(period: UsagePeriodInput): string {
  if ("preset" in period) return `preset:${period.preset}`;
  return `range:${period.from.toISOString()}:${period.to.toISOString()}`;
}

export const usageKeys = {
  quota: () => ["usage", "quota"] as const,
  series: (period: UsagePeriodInput) => ["usage", "series", periodKeyPart(period)] as const,
  bySeat: (period: UsagePeriodInput) => ["usage", "bySeat", periodKeyPart(period)] as const,
  member: (period: UsagePeriodInput, userId: string) =>
    ["usage", "member", periodKeyPart(period), userId] as const,
};
