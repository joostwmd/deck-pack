import { describe, expect, it } from "vitest";

import {
  calendarMonthEntitlementWindow,
  resolveEntitlementWindow,
  resolveUsagePeriod,
} from "@deck-pack/db/usage-period";

describe("resolveUsagePeriod", () => {
  const now = new Date("2026-07-21T12:00:00.000Z");
  const billingStart = new Date("2026-07-01T00:00:00.000Z");
  const billingEnd = new Date("2026-08-01T00:00:00.000Z");

  it("resolves last 7 days", () => {
    const period = resolveUsagePeriod({ preset: "last_7_days" }, { now });
    expect(period.end).toEqual(now);
    expect(period.start.toISOString()).toBe("2026-07-14T12:00:00.000Z");
  });

  it("resolves this month to month start through now", () => {
    const period = resolveUsagePeriod({ preset: "this_month" }, { now });
    expect(period.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(period.end).toEqual(now);
  });

  it("resolves last month", () => {
    const period = resolveUsagePeriod({ preset: "last_month" }, { now });
    expect(period.start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("resolves billing period from subscription window", () => {
    const period = resolveUsagePeriod(
      { preset: "billing_period" },
      { now, billingPeriodStart: billingStart, billingPeriodEnd: billingEnd },
    );
    expect(period.start).toEqual(billingStart);
    expect(period.end).toEqual(now);
  });

  it("resolves this quarter", () => {
    const period = resolveUsagePeriod({ preset: "this_quarter" }, { now });
    expect(period.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(period.end).toEqual(now);
  });

  it("rejects custom ranges longer than 366 days", () => {
    expect(() =>
      resolveUsagePeriod(
        {
          from: new Date("2024-01-01T00:00:00.000Z"),
          to: new Date("2026-07-21T00:00:00.000Z"),
        },
        { now },
      ),
    ).toThrow(/366 days/);
  });
});

describe("resolveEntitlementWindow", () => {
  it("falls back to calendar month when billing period is missing", () => {
    const now = new Date("2026-07-21T12:00:00.000Z");
    const window = resolveEntitlementWindow({ now });
    expect(window).toEqual(calendarMonthEntitlementWindow(now));
  });
});
