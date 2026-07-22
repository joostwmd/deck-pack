import { useQuery } from "@tanstack/react-query";

import type { UsagePeriodInput, UsageStore } from "./usage-store";
import { usageKeys } from "./query-keys";

export function useUsageBySeat(usage: UsageStore, period: UsagePeriodInput) {
  return useQuery({
    queryKey: usageKeys.bySeat(period),
    queryFn: () => usage.bySeat(period),
  });
}
