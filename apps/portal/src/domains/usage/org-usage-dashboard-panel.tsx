import { useMemo, useState } from "react";

import {
  useUsageBySeat,
  useUsageMember,
  useUsageQuota,
  useUsageSeries,
} from "@deck-pack/hooks/usage";
import {
  DEFAULT_USAGE_PERIOD,
  usagePeriodToInput,
  type UsagePeriodValue,
} from "@deck-pack/ui/components/composite/usage-period-picker";
import { MemberUsageDrawer } from "@deck-pack/ui/components/composite/member-usage-drawer";
import {
  SeatUsageTable,
  type SeatUsageTableRow,
} from "@deck-pack/ui/components/composite/seat-usage-table";
import { UsageAreaChart } from "@deck-pack/ui/components/composite/usage-area-chart";
import { UsageGaugeGrid } from "@deck-pack/ui/components/composite/usage-gauge-grid";
import { UsagePeriodPicker } from "@deck-pack/ui/components/composite/usage-period-picker";
import { assetTypeLabel } from "@deck-pack/ui/components/usage/asset-labels";

import { useServices } from "@/services/services-context";

export function OrgUsageDashboardPanel() {
  const { usage } = useServices();
  const [period, setPeriod] = useState<UsagePeriodValue>(DEFAULT_USAGE_PERIOD);
  const [selectedSeat, setSelectedSeat] = useState<SeatUsageTableRow | null>(null);
  const periodInput = useMemo(() => usagePeriodToInput(period), [period]);

  const quotaQuery = useUsageQuota(usage);
  const seriesQuery = useUsageSeries(usage, periodInput);
  const bySeatQuery = useUsageBySeat(usage, periodInput);
  const memberQuery = useUsageMember(usage, periodInput, selectedSeat?.userId);

  const gaugeItems =
    quotaQuery.data?.items.map((item) => ({
      assetType: item.assetType,
      label: assetTypeLabel(item.assetType),
      used: item.used,
      limit: item.limit,
      remaining: item.remaining,
    })) ?? [];

  const seatRows: SeatUsageTableRow[] =
    bySeatQuery.data?.seats.map((seat) => ({
      seatId: seat.seatId,
      userId: seat.userId,
      email: seat.email,
      name: seat.name,
      status: seat.status,
      totalUsed: seat.totalUsed,
    })) ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Organization usage</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Workspace quotas and activity for the selected period.
            </p>
          </div>
          <UsagePeriodPicker value={period} onChange={setPeriod} />
        </div>

        {quotaQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading quotas…</p>
        ) : (
          <UsageGaugeGrid items={gaugeItems} periodLabel={quotaQuery.data?.periodLabel} />
        )}

        {seriesQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading chart…</p>
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

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Seat usage</h3>
          <p className="text-muted-foreground text-sm">
            Click a seat to view personal stats for the same period.
          </p>
        </div>
        {bySeatQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading seats…</p>
        ) : (
          <SeatUsageTable
            rows={seatRows}
            onSelectSeat={(row) => {
              if (row.userId) {
                setSelectedSeat(row);
              }
            }}
          />
        )}
      </section>

      <MemberUsageDrawer
        open={Boolean(selectedSeat)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSeat(null);
          }
        }}
        title={selectedSeat?.name?.trim() || selectedSeat?.email || "Seat usage"}
        description={memberQuery.data?.periodLabel ?? seriesQuery.data?.periodLabel}
      >
        {memberQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading member usage…</p>
        ) : memberQuery.data ? (
          <>
            <p className="text-muted-foreground text-sm">
              {memberQuery.data.totalUsed} insertions in this period
            </p>
            <UsageGaugeGrid
              items={memberQuery.data.byAssetType.map((item) => ({
                assetType: item.assetType,
                label: assetTypeLabel(item.assetType),
                used: item.count,
                limit: null,
                remaining: null,
              }))}
              size={80}
            />
            <UsageAreaChart
              points={memberQuery.data.points}
              periodLabel={memberQuery.data.periodLabel}
              assetLabels={Object.fromEntries(
                memberQuery.data.points.map((point) => [
                  point.assetType,
                  assetTypeLabel(point.assetType),
                ]),
              )}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">No usage data for this seat.</p>
        )}
      </MemberUsageDrawer>
    </div>
  );
}
