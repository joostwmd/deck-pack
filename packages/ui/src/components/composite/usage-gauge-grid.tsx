"use client";

import {
  Gauge,
  GaugeIndicator,
  GaugeLabel,
  GaugeRange,
  GaugeTrack,
  GaugeValueText,
} from "@deck-pack/ui/components/system/gauge";
import { cn } from "@deck-pack/ui/lib/utils";

export type UsageGaugeItem = {
  assetType: string;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type UsageGaugeGridProps = {
  items: UsageGaugeItem[];
  periodLabel?: string;
  className?: string;
  size?: number;
  /** `grid` for dashboards; `list` for narrow panels (e.g. Office add-in taskpane). */
  layout?: "grid" | "list";
};

function formatGaugeText(used: number, limit: number | null) {
  if (limit === null) {
    return `${used}`;
  }

  return `${used}/${limit}`;
}

function UsageGaugeListItem({ item }: { item: UsageGaugeItem }) {
  const unlimited = item.limit === null;
  const usedPercent =
    !unlimited && item.limit > 0 ? Math.min(100, (item.used / item.limit) * 100) : 0;

  return (
    <div className="rounded-md border border-border/70 bg-muted/10 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium leading-tight">{item.label}</p>
        <p className="shrink-0 text-xs font-medium tabular-nums text-foreground">
          {formatGaugeText(item.used, item.limit)}
        </p>
      </div>

      {unlimited ? (
        <p className="text-muted-foreground mt-1.5 text-xs">{item.used} used · Unlimited</p>
      ) : (
        <>
          <div
            className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={item.limit ?? 0}
            aria-valuenow={item.used}
            aria-valuetext={formatGaugeText(item.used, item.limit)}
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{item.remaining ?? 0} remaining</p>
        </>
      )}
    </div>
  );
}

export function UsageGaugeGrid({
  items,
  periodLabel,
  className,
  size = 96,
  layout = "grid",
}: UsageGaugeGridProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {periodLabel ? (
        <p
          className={cn(
            "text-muted-foreground",
            layout === "list" ? "text-xs leading-snug" : "text-sm",
          )}
        >
          Quota window: {periodLabel}
        </p>
      ) : null}

      {layout === "list" ? (
        <div className="space-y-2">
          {items.map((item) => (
            <UsageGaugeListItem key={item.assetType} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const unlimited = item.limit === null;
            const value = unlimited ? null : item.used;
            const max = item.limit ?? 100;

            return (
              <div
                key={item.assetType}
                className="flex flex-col items-center gap-2 rounded-lg border border-border/80 bg-muted/10 p-4"
              >
                <Gauge
                  value={value}
                  max={max}
                  size={size}
                  getValueText={() => formatGaugeText(item.used, item.limit)}
                  className="flex flex-col items-center"
                >
                  <GaugeIndicator>
                    <GaugeTrack className="text-muted" />
                    <GaugeRange className="text-primary" />
                  </GaugeIndicator>
                  <GaugeValueText />
                  <GaugeLabel>{item.label}</GaugeLabel>
                </Gauge>
                <p className="text-muted-foreground text-center text-xs">
                  {unlimited ? `${item.used} used · Unlimited` : `${item.remaining ?? 0} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
