import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_USAGE_PERIOD,
  usagePeriodToInput,
  type UsagePeriodValue,
} from "@deck-pack/ui/components/composite/usage-period-picker";
import { UsageAreaChart } from "@deck-pack/ui/components/composite/usage-area-chart";
import { UsageGaugeGrid } from "@deck-pack/ui/components/composite/usage-gauge-grid";
import { UsagePeriodPicker } from "@deck-pack/ui/components/composite/usage-period-picker";

import { getTrpcClient } from "@/utils/trpc";

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logos",
  flag: "Flags",
  icon: "Icons",
  harvey_ball: "Harvey balls",
  photo: "Photos",
  slide: "Slides",
  shape: "Shapes",
};

function assetTypeLabel(assetType: string): string {
  return ASSET_TYPE_LABELS[assetType] ?? assetType;
}

type UsageQuotaResponse = Awaited<
  ReturnType<ReturnType<typeof getTrpcClient>["usage"]["quota"]["query"]>
>;
type UsageSeriesResponse = Awaited<
  ReturnType<ReturnType<typeof getTrpcClient>["usage"]["series"]["query"]>
>;

export function UsageStatsSection({ title = "Usage" }: { title?: string }) {
  const [period, setPeriod] = useState<UsagePeriodValue>(DEFAULT_USAGE_PERIOD);
  const periodInput = useMemo(() => usagePeriodToInput(period), [period]);

  const [quota, setQuota] = useState<UsageQuotaResponse | null>(null);
  const [series, setSeries] = useState<UsageSeriesResponse | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [quotaError, setQuotaError] = useState(false);
  const [seriesError, setSeriesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const api = getTrpcClient();

    setQuotaLoading(true);
    setQuotaError(false);

    void api.usage.quota
      .query()
      .then((data) => {
        if (!cancelled) {
          setQuota(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuotaError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setQuotaLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const api = getTrpcClient();

    setSeriesLoading(true);
    setSeriesError(false);

    void api.usage.series
      .query(periodInput)
      .then((data) => {
        if (!cancelled) {
          setSeries(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeriesError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSeriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [periodInput]);

  const gaugeItems =
    quota?.items.map((item) => ({
      assetType: item.assetType,
      label: assetTypeLabel(item.assetType),
      used: item.used,
      limit: item.limit,
      remaining: item.remaining,
    })) ?? [];

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Quotas follow your billing window. The chart uses the range below.
          </p>
        </div>
        <UsagePeriodPicker compact value={period} onChange={setPeriod} className="w-full" />
      </div>

      {quotaLoading ? (
        <p className="text-muted-foreground text-sm">Loading quotas…</p>
      ) : quotaError ? (
        <p className="text-destructive text-sm">Could not load usage quotas.</p>
      ) : (
        <UsageGaugeGrid layout="list" items={gaugeItems} periodLabel={quota?.periodLabel} />
      )}

      {seriesLoading ? (
        <p className="text-muted-foreground text-sm">Loading chart…</p>
      ) : seriesError ? (
        <p className="text-destructive text-sm">Could not load usage chart.</p>
      ) : (
        <UsageAreaChart
          compact
          points={series?.points ?? []}
          periodLabel={series?.periodLabel}
          assetLabels={Object.fromEntries(
            (series?.points ?? []).map((point) => [
              point.assetType,
              assetTypeLabel(point.assetType),
            ]),
          )}
        />
      )}
    </section>
  );
}
