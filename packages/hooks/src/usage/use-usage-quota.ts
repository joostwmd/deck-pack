import { useQuery } from "@tanstack/react-query";

import type { UsageStore } from "./usage-store";
import { usageKeys } from "./query-keys";

export function useUsageQuota(usage: UsageStore) {
  return useQuery({
    queryKey: usageKeys.quota(),
    queryFn: () => usage.quota(),
  });
}
