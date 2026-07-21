export const USAGE_PERIOD_PRESETS = [
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "billing_period",
  "this_quarter",
] as const;

export type UsagePeriodPreset = (typeof USAGE_PERIOD_PRESETS)[number];

export type UsagePeriodInput = { preset: UsagePeriodPreset } | { from: Date; to: Date };

export type ResolvedUsagePeriod = {
  start: Date;
  end: Date;
  label: string;
};

export type UsagePeriodContext = {
  now: Date;
  billingPeriodStart?: Date | null;
  billingPeriodEnd?: Date | null;
};

const MAX_CUSTOM_SPAN_MS = 366 * 24 * 60 * 60 * 1000;

export const USAGE_PERIOD_PRESET_LABELS: Record<UsagePeriodPreset, string> = {
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  billing_period: "Current billing period",
  this_quarter: "This quarter",
};

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function startOfUtcQuarter(date: Date): Date {
  const quarterMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterMonth, 1));
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

export function calendarMonthEntitlementWindow(now: Date): ResolvedUsagePeriod {
  const start = startOfUtcMonth(now);
  const end = endOfUtcMonth(now);
  return {
    start,
    end,
    label: "This month",
  };
}

export function resolveEntitlementWindow(ctx: UsagePeriodContext): ResolvedUsagePeriod {
  if (ctx.billingPeriodStart && ctx.billingPeriodEnd) {
    return {
      start: ctx.billingPeriodStart,
      end: ctx.billingPeriodEnd,
      label: "Billing period",
    };
  }

  return calendarMonthEntitlementWindow(ctx.now);
}

export function resolveUsagePeriod(
  input: UsagePeriodInput,
  ctx: UsagePeriodContext,
): ResolvedUsagePeriod {
  const now = ctx.now;

  if ("from" in input) {
    const start = new Date(input.from);
    const end = new Date(input.to);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Invalid custom usage period dates");
    }

    if (start > end) {
      throw new Error("Usage period start must be before end");
    }

    if (end.getTime() - start.getTime() > MAX_CUSTOM_SPAN_MS) {
      throw new Error("Custom usage period cannot exceed 366 days");
    }

    return {
      start,
      end,
      label: "Custom range",
    };
  }

  switch (input.preset) {
    case "last_7_days":
      return {
        start: subtractDays(now, 7),
        end: now,
        label: USAGE_PERIOD_PRESET_LABELS.last_7_days,
      };
    case "last_30_days":
      return {
        start: subtractDays(now, 30),
        end: now,
        label: USAGE_PERIOD_PRESET_LABELS.last_30_days,
      };
    case "this_month":
      return {
        start: startOfUtcMonth(now),
        end: now,
        label: USAGE_PERIOD_PRESET_LABELS.this_month,
      };
    case "last_month": {
      const thisMonthStart = startOfUtcMonth(now);
      const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      return {
        start: lastMonthStart,
        end: thisMonthStart,
        label: USAGE_PERIOD_PRESET_LABELS.last_month,
      };
    }
    case "billing_period": {
      if (!ctx.billingPeriodStart) {
        return calendarMonthEntitlementWindow(now);
      }

      const end = ctx.billingPeriodEnd && ctx.billingPeriodEnd < now ? ctx.billingPeriodEnd : now;

      return {
        start: ctx.billingPeriodStart,
        end,
        label: USAGE_PERIOD_PRESET_LABELS.billing_period,
      };
    }
    case "this_quarter":
      return {
        start: startOfUtcQuarter(now),
        end: now,
        label: USAGE_PERIOD_PRESET_LABELS.this_quarter,
      };
    default: {
      const exhaustive: never = input.preset;
      throw new Error(`Unknown usage period preset: ${exhaustive}`);
    }
  }
}
