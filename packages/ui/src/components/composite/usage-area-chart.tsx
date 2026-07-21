"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@deck-pack/ui/components/system/chart";
import { cn } from "@deck-pack/ui/lib/utils";

export type UsageSeriesPoint = {
  date: string;
  assetType: string;
  count: number;
};

export type UsageAreaChartProps = {
  points: UsageSeriesPoint[];
  periodLabel?: string;
  className?: string;
  assetLabels?: Record<string, string>;
  /** Shorter chart height for narrow panels (e.g. Office add-in). */
  compact?: boolean;
};

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
];

function pivotSeries(points: UsageSeriesPoint[]) {
  const dates = [...new Set(points.map((point) => point.date))].sort();
  const assetTypes = [...new Set(points.map((point) => point.assetType))];

  const rows = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const assetType of assetTypes) {
      const match = points.find((point) => point.date === date && point.assetType === assetType);
      row[assetType] = match?.count ?? 0;
    }
    return row;
  });

  return { rows, assetTypes };
}

export function UsageAreaChart({
  points,
  periodLabel,
  className,
  assetLabels = {},
  compact = false,
}: UsageAreaChartProps) {
  const { rows, assetTypes } = React.useMemo(() => pivotSeries(points), [points]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    assetTypes.forEach((assetType, index) => {
      config[assetType] = {
        label: assetLabels[assetType] ?? assetType,
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      };
    });
    return config;
  }, [assetLabels, assetTypes]);

  if (rows.length === 0 || assetTypes.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 text-sm text-muted-foreground",
          compact ? "min-h-[160px]" : "min-h-[220px] p-6",
          className,
        )}
      >
        No insertions in {periodLabel ?? "this period"}.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {periodLabel ? (
        <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {periodLabel}
        </p>
      ) : null}
      <ChartContainer
        config={chartConfig}
        className={cn("aspect-auto w-full", compact ? "h-[200px]" : "h-[280px]")}
      >
        <AreaChart data={rows} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          {assetTypes.map((assetType) => (
            <Area
              key={assetType}
              dataKey={assetType}
              type="monotone"
              fill={`var(--color-${assetType})`}
              stroke={`var(--color-${assetType})`}
              stackId="usage"
              fillOpacity={0.35}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
