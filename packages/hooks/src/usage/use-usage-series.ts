import { useQuery } from "@tanstack/react-query";

import type { UsagePeriodInput, UsageStore } from "./usage-store";
import { usageKeys } from "./query-keys";

export function useUsageSeries(usage: UsageStore, period: UsagePeriodInput) {
  return useQuery({
    queryKey: usageKeys.series(period),
    queryFn: () => usage.series(period),
  });
}
