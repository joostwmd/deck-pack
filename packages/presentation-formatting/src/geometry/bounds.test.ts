import { describe, expect, it } from "vitest";

import {
  getVisualBounds,
  getVisualCenter,
  moveVisualCenterTo,
  normalizeRotation,
  setVisualHeight,
  setVisualLeft,
  setVisualTop,
  setVisualWidth,
} from "./bounds";

describe("geometry bounds", () => {
  it("computes visual bounds for a shape rotated 90 degrees", () => {
    const result = getVisualBounds({ left: 10, top: 20, width: 100, height: 40, rotation: 90 });
    expect(result.left).toBeCloseTo(40, 2);
    expect(result.top).toBeCloseTo(-10, 2);
    expect(result.width).toBeCloseTo(40, 2);
    expect(result.height).toBeCloseTo(100, 2);
  });

  it("normalizes negative and oversized rotations", () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });

  it("preserves axis-aligned bounds at 0 and 180 degrees", () => {
    expect(getVisualBounds({ left: 5, top: 6, width: 20, height: 10, rotation: 0 })).toEqual({
      left: 5,
      top: 6,
      width: 20,
      height: 10,
    });
    expect(getVisualBounds({ left: 5, top: 6, width: 20, height: 10, rotation: 180 })).toEqual({
      left: 5,
      top: 6,
      width: 20,
      height: 10,
    });
  });

  it("sets visual left and top using offset semantics", () => {
    const raw = { left: 10, top: 20, width: 30, height: 40, rotation: 0 };
    expect(setVisualLeft(raw, 15)).toEqual({ ...raw, left: 15 });
    expect(setVisualTop(raw, 25)).toEqual({ ...raw, top: 25 });
  });

  it("sets visual width and height for rotated shapes", () => {
    const raw = { left: 10, top: 20, width: 100, height: 40, rotation: 90 };
    expect(setVisualWidth(raw, 50).height).toBeCloseTo(50, 2);
    expect(setVisualHeight(raw, 80).width).toBeCloseTo(80, 2);
  });

  it("moves the visual center without changing size", () => {
    const raw = { left: 0, top: 0, width: 20, height: 10, rotation: 0 };
    const moved = moveVisualCenterTo(raw, 30, 40);
    expect(getVisualCenter(moved)).toEqual({ x: 30, y: 40 });
  });
});
