import { describe, expect, it } from "vitest";

import { runPresentationCheck } from "@deck-pack/presentation-check/engine";
import { DEFAULT_BRAND_PROFILE_CONFIGURATION } from "@deck-pack/presentation-check/profile";
import type { PresentationSnapshot } from "@deck-pack/presentation-check/types";

const snapshot: PresentationSnapshot = {
  title: "Test deck",
  slideWidth: 960,
  slideHeight: 540,
  apiSets: { baseline: "1.5", supported: ["1.4", "1.5", "1.10"] },
  slides: [
    {
      id: "slide-1",
      index: 0,
      layoutId: null,
      layoutName: null,
      shapes: [
        {
          id: "shape-1",
          name: "Title 1",
          type: "Placeholder",
          left: 40,
          top: 40,
          width: 400,
          height: 80,
          visible: true,
          placeholderType: "Title",
          tags: {},
          text: "Revenue revenue growth",
          textRanges: [
            {
              start: 0,
              length: 22,
              text: "Revenue revenue growth",
              fontName: "Comic Sans MS",
              fontSize: 32,
              fontColor: "#FF0000",
              bold: true,
              italic: null,
            },
          ],
          fillColor: null,
          fillType: null,
          outlineColor: null,
          outlineVisible: null,
          altTextDescription: null,
          altTextTitle: null,
          isDecorative: null,
        },
        {
          id: "shape-2",
          name: "Picture 1",
          type: "Image",
          left: 1000,
          top: 20,
          width: 120,
          height: 80,
          visible: true,
          tags: {},
          text: null,
          textRanges: [],
          fillColor: null,
          fillType: null,
          outlineColor: null,
          outlineVisible: null,
          altTextDescription: "",
          altTextTitle: null,
          isDecorative: false,
        },
      ],
    },
  ],
};

describe("runPresentationCheck", () => {
  it("detects typography, text, color, layout and accessibility issues", () => {
    const result = runPresentationCheck(snapshot, DEFAULT_BRAND_PROFILE_CONFIGURATION);

    expect(result.findings.some((finding) => finding.ruleId === "typography.unapproved-font")).toBe(
      true,
    );
    expect(result.findings.some((finding) => finding.ruleId === "text.duplicate-word")).toBe(true);
    expect(result.findings.some((finding) => finding.ruleId === "color.unapproved-text")).toBe(true);
    expect(result.findings.some((finding) => finding.ruleId === "geometry.off-slide")).toBe(true);
    expect(
      result.findings.some((finding) => finding.ruleId === "accessibility.missing-alt-text"),
    ).toBe(true);
    expect(result.summary.errors).toBeGreaterThan(0);
  });
});
