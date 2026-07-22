import { useQuery } from "@tanstack/react-query";

import type { UsagePeriodInput, UsageStore } from "./usage-store";
import { usageKeys } from "./query-keys";

export function useUsageMember(
  usage: UsageStore,
  period: UsagePeriodInput,
  userId: string | null | undefined,
) {
  return useQuery({
    queryKey: usageKeys.member(period, userId ?? ""),
    queryFn: () => usage.member({ ...period, userId: userId ?? "" }),
    enabled: Boolean(userId),
  });
}
