"use client";

import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@deck-pack/ui/components/system/select";

export const USAGE_PERIOD_PRESETS = [
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "billing_period",
  "this_quarter",
] as const;

export type UsagePeriodPreset = (typeof USAGE_PERIOD_PRESETS)[number];

export const USAGE_PERIOD_PRESET_LABELS: Record<UsagePeriodPreset, string> = {
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  billing_period: "Current billing period",
  this_quarter: "This quarter",
};

export type UsagePeriodValue =
  | { kind: "preset"; preset: UsagePeriodPreset }
  | { kind: "custom"; from: string; to: string };

export type UsagePeriodPickerProps = {
  value: UsagePeriodValue;
  onChange: (value: UsagePeriodValue) => void;
  className?: string;
  /** Stack controls full-width for narrow panels (e.g. Office add-in). */
  compact?: boolean;
};

export function usagePeriodToInput(value: UsagePeriodValue) {
  if (value.kind === "preset") {
    return { preset: value.preset };
  }

  return {
    from: new Date(value.from),
    to: new Date(value.to),
  };
}

export const DEFAULT_USAGE_PERIOD: UsagePeriodValue = {
  kind: "preset",
  preset: "this_month",
};

export function UsagePeriodPicker({
  value,
  onChange,
  className,
  compact = false,
}: UsagePeriodPickerProps) {
  const selectValue = value.kind === "preset" ? value.preset : "custom";

  return (
    <div className={className}>
      <div className={compact ? "flex flex-col gap-2" : "flex flex-wrap items-end gap-3"}>
        <div className={compact ? "w-full space-y-1.5" : "min-w-[220px] space-y-1.5"}>
          <Label htmlFor="usage-period-preset">Time range</Label>
          <Select
            value={selectValue}
            onValueChange={(next) => {
              if (next === "custom") {
                const today = new Date().toISOString().slice(0, 10);
                onChange({ kind: "custom", from: today, to: today });
                return;
              }

              onChange({ kind: "preset", preset: next as UsagePeriodPreset });
            }}
          >
            <SelectTrigger id="usage-period-preset" className="w-full">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {USAGE_PERIOD_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {USAGE_PERIOD_PRESET_LABELS[preset]}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {value.kind === "custom" ? (
          <div className={compact ? "grid w-full grid-cols-2 gap-2" : "contents"}>
            <div className="space-y-1.5">
              <Label htmlFor="usage-period-from">From</Label>
              <Input
                id="usage-period-from"
                type="date"
                value={value.from}
                onChange={(event) =>
                  onChange({ kind: "custom", from: event.target.value, to: value.to })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usage-period-to">To</Label>
              <Input
                id="usage-period-to"
                type="date"
                value={value.to}
                onChange={(event) =>
                  onChange({ kind: "custom", from: value.from, to: event.target.value })
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
