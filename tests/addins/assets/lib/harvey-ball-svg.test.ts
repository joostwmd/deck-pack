import { describe, expect, it } from "vitest";

import {
  DEFAULT_HARVEY_BALL_CONFIG,
  HARVEY_BALL_PRESETS,
  createHarveyBallGeometry,
  normalizeHarveyBallConfig,
  serializeHarveyBallSvg,
  validateHarveyBallConfig,
} from "@/utils/harvey-ball-svg";

describe("harvey-ball-svg", () => {
  it("exposes the expected preset values", () => {
    expect(HARVEY_BALL_PRESETS).toEqual([0, 25, 50, 75, 100]);
  });

  it("normalizes percentage into the 0-100 range", () => {
    expect(normalizeHarveyBallConfig({ percentage: -5 }).percentage).toBe(0);
    expect(normalizeHarveyBallConfig({ percentage: 150 }).percentage).toBe(100);
    expect(normalizeHarveyBallConfig({ percentage: 37.8 }).percentage).toBe(38);
  });

  it("validates outline width and color values", () => {
    expect(validateHarveyBallConfig(DEFAULT_HARVEY_BALL_CONFIG)).toEqual({ valid: true });
    expect(validateHarveyBallConfig({ ...DEFAULT_HARVEY_BALL_CONFIG, outlineWidth: -1 })).toEqual({
      valid: false,
      message: "Outline width must be zero or greater.",
    });
    expect(
      validateHarveyBallConfig({ ...DEFAULT_HARVEY_BALL_CONFIG, fillColor: "not-a-color" }),
    ).toEqual({
      valid: false,
      message: "Fill color must be a valid hex color.",
    });
  });

  it("creates no fill path at 0%", () => {
    const geometry = createHarveyBallGeometry(
      normalizeHarveyBallConfig({ ...DEFAULT_HARVEY_BALL_CONFIG, percentage: 0 }),
    );

    expect(geometry.fillPath).toBeNull();
    expect(geometry.fillMode).toBe("none");
  });

  it("creates a full-circle fill at 100%", () => {
    const geometry = createHarveyBallGeometry(
      normalizeHarveyBallConfig({ ...DEFAULT_HARVEY_BALL_CONFIG, percentage: 100 }),
    );

    expect(geometry.fillMode).toBe("full");
    expect(geometry.fillPath).toContain("A");
  });

  it.each([25, 50, 75])("creates a sector path for %s%", (percentage) => {
    const geometry = createHarveyBallGeometry(
      normalizeHarveyBallConfig({ ...DEFAULT_HARVEY_BALL_CONFIG, percentage }),
    );

    expect(geometry.fillMode).toBe("sector");
    expect(geometry.fillPath).toMatch(/^M /);
    expect(geometry.fillPath).toContain("A");
    expect(geometry.fillPath).not.toContain("NaN");
    expect(geometry.fillPath).not.toContain("Infinity");
  });

  it("serializes a standalone SVG with viewBox and escaped attributes", () => {
    const config = normalizeHarveyBallConfig({
      ...DEFAULT_HARVEY_BALL_CONFIG,
      percentage: 75,
      fillColor: "#111111",
      backgroundColor: "#ffffff",
      outlineColor: "#222222",
      outlineWidth: 2,
    });

    const svg = serializeHarveyBallSvg(config);

    expect(svg).toMatch(/^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('viewBox="0 0 100 100"');
    expect(svg).toContain('fill="#111111"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('stroke="#222222"');
    expect(svg).toContain('stroke-width="2"');
    expect(svg).not.toContain("NaN");
  });

  it("uses the same geometry for intermediate percentages", () => {
    const config = normalizeHarveyBallConfig({
      ...DEFAULT_HARVEY_BALL_CONFIG,
      percentage: 33,
    });
    const geometry = createHarveyBallGeometry(config);
    const svg = serializeHarveyBallSvg(config);

    expect(geometry.fillPath).toBeTruthy();
    expect(svg).toContain(geometry.fillPath ?? "");
  });
});
