import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_USAGE_PERIOD,
  usagePeriodToInput,
  type UsagePeriodValue,
} from "@deck-pack/ui/components/composite/usage-period-picker";
import { UsageAreaChart } from "@deck-pack/ui/components/composite/usage-area-chart";
import { UsageGaugeGrid } from "@deck-pack/ui/components/composite/usage-gauge-grid";
import { UsagePeriodPicker } from "@deck-pack/ui/components/composite/usage-period-picker";

import { assetTypeLabel } from "@/features/usage/asset-labels";
import { trpc } from "@/utils/trpc";

export function UsageStatsSection({ title = "Usage" }: { title?: string }) {
  const [period, setPeriod] = useState<UsagePeriodValue>(DEFAULT_USAGE_PERIOD);
  const periodInput = useMemo(() => usagePeriodToInput(period), [period]);

  const quotaQuery = useQuery(trpc.usage.quota.queryOptions());
  const seriesQuery = useQuery(trpc.usage.series.queryOptions(periodInput));

  const gaugeItems =
    quotaQuery.data?.items.map((item) => ({
      assetType: item.assetType,
      label: assetTypeLabel(item.assetType),
      used: item.used,
      limit: item.limit,
      remaining: item.remaining,
    })) ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Insert quotas use your billing window. Charts follow the selected range.
          </p>
        </div>
        <UsagePeriodPicker value={period} onChange={setPeriod} />
      </div>

      {quotaQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading quotas…</p>
      ) : quotaQuery.isError ? (
        <p className="text-destructive text-sm">Could not load usage quotas.</p>
      ) : (
        <UsageGaugeGrid items={gaugeItems} periodLabel={quotaQuery.data?.periodLabel} />
      )}

      {seriesQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading chart…</p>
      ) : seriesQuery.isError ? (
        <p className="text-destructive text-sm">Could not load usage chart.</p>
      ) : (
        <UsageAreaChart
          points={seriesQuery.data?.points ?? []}
          periodLabel={seriesQuery.data?.periodLabel}
          assetLabels={Object.fromEntries(
            (seriesQuery.data?.points ?? []).map((point) => [
              point.assetType,
              assetTypeLabel(point.assetType),
            ]),
          )}
        />
      )}
    </section>
  );
}
