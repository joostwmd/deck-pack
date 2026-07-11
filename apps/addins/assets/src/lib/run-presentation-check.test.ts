import { describe, expect, it } from "vitest";

import { DEFAULT_BRAND_PROFILE_CONFIGURATION } from "@deck-pack/presentation-check";

import { filterFindings, getSafeFixableFindings, getUniversalProfile } from "./run-presentation-check";

const sampleResult = {
  findings: [
    {
      id: "1",
      ruleId: "text.duplicate-word",
      category: "Text",
      severity: "warning" as const,
      message: "Duplicate word",
      actual: "word word",
      expected: "word",
      location: { slideId: "s1", slideIndex: 0 },
      fixMode: "automatic" as const,
      suggestedFix: { type: "replace-text-range", safe: true, payload: {} },
    },
    {
      id: "2",
      ruleId: "geometry.off-slide",
      category: "Layout",
      severity: "error" as const,
      message: "Off slide",
      actual: "outside",
      expected: "inside",
      location: { slideId: "s1", slideIndex: 0 },
      fixMode: "none" as const,
    },
  ],
  summary: {
    errors: 1,
    warnings: 1,
    suggestions: 0,
    slidesScanned: 1,
    shapesScanned: 2,
    unsupportedRules: [],
  },
};

describe("run-presentation-check helpers", () => {
  it("filters ignored and searched findings", () => {
    const ignored = new Set(["1"]);
    const filtered = filterFindings(sampleResult, ignored, undefined, "off slide");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.ruleId).toBe("geometry.off-slide");
  });

  it("returns only safe fixable findings", () => {
    const safe = getSafeFixableFindings(sampleResult.findings);
    expect(safe).toHaveLength(1);
    expect(safe[0]?.id).toBe("1");
  });

  it("creates a reduced universal profile", () => {
    const profile = getUniversalProfile();
    expect(profile.rules["text.duplicate-word"]?.enabled).toBe(true);
    expect(profile.rules["typography.unapproved-font"]?.enabled).toBe(false);
    expect(DEFAULT_BRAND_PROFILE_CONFIGURATION.rules["typography.unapproved-font"]?.enabled).toBe(
      true,
    );
  });
});
