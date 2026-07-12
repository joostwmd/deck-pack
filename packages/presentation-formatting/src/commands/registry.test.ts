import { describe, expect, it } from "vitest";

import { alignLeftCommand } from "./align";
import { distributeHorizontalCommand } from "./distribute";
import { gapExactHorizontalCommand, gapIncreaseHorizontalCommand } from "./gap";
import { matchWidthCommand } from "./match-size";
import { formattingCommandRegistry, getUniqueFormattingCommandIds } from "./registry";
import { rectifyLinesCommand } from "./rectify-lines";
import { setBoundsCommand } from "./set-bounds";
import { stackVerticalCommand } from "./stack";
import { swapPositionsCommand } from "./swap";
import { createShape, selectionFromBounds } from "../test-utils/selection";

describe("align commands", () => {
  it("aligns shapes to the selection left edge regardless of input order", () => {
    const selection = selectionFromBounds([
      { id: "b", left: 80, top: 10, width: 20, height: 20 },
      { id: "a", left: 20, top: 0, width: 30, height: 30 },
    ]);

    const plan = alignLeftCommand.createPlan(selection, undefined);
    expect(plan).toEqual([{ shapeId: "b", left: 20 }]);
  });

  it("returns no mutations when already aligned", () => {
    const selection = selectionFromBounds([
      { id: "a", left: 10, top: 0, width: 20, height: 20 },
      { id: "b", left: 10, top: 40, width: 30, height: 10 },
    ]);

    expect(alignLeftCommand.createPlan(selection, undefined)).toEqual([]);
  });
});

describe("distribute commands", () => {
  it("preserves outer edges and equalizes horizontal gaps", () => {
    const selection = selectionFromBounds([
      { id: "c", left: 90, top: 0, width: 10, height: 10 },
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
      { id: "b", left: 40, top: 0, width: 10, height: 10 },
    ]);

    const plan = distributeHorizontalCommand.createPlan(selection, undefined);
    expect(plan.find((mutation) => mutation.shapeId === "b")?.left).toBeCloseTo(45, 1);
  });
});

describe("match size commands", () => {
  it("matches width to the first selected shape", () => {
    const selection = selectionFromBounds([
      { id: "ref", left: 0, top: 0, width: 50, height: 20 },
      { id: "other", left: 80, top: 0, width: 10, height: 10 },
    ]);

    expect(matchWidthCommand.createPlan(selection, undefined)).toEqual([{ shapeId: "other", width: 50 }]);
  });
});

describe("stack commands", () => {
  it("stacks shapes vertically with zero gap", () => {
    const selection = selectionFromBounds([
      { id: "b", left: 0, top: 30, width: 10, height: 10 },
      { id: "a", left: 0, top: 0, width: 10, height: 20 },
    ]);

    expect(stackVerticalCommand.createPlan(selection, undefined)).toEqual([{ shapeId: "b", top: 20 }]);
  });
});

describe("gap commands", () => {
  it("applies an exact horizontal gap from the leftmost shape", () => {
    const selection = selectionFromBounds([
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
      { id: "b", left: 50, top: 0, width: 10, height: 10 },
    ]);

    const plan = gapExactHorizontalCommand.createPlan(selection, {
      mode: "exact",
      direction: "horizontal",
      value: 12,
    });

    expect(plan.find((mutation) => mutation.shapeId === "b")?.left).toBe(22);
  });

  it("uses baked-in defaults when gap params are omitted", () => {
    const selection = selectionFromBounds([
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
      { id: "b", left: 50, top: 0, width: 10, height: 10 },
    ]);

    expect(gapIncreaseHorizontalCommand.evaluate(selection, undefined)).toEqual({ applicable: true });

    const plan = gapIncreaseHorizontalCommand.createPlan(selection, undefined);
    expect(plan.find((mutation) => mutation.shapeId === "b")?.left).toBe(62);
  });
});

describe("swap command", () => {
  it("swaps visual centers for exactly two shapes", () => {
    const selection = selectionFromBounds([
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
      { id: "b", left: 40, top: 0, width: 10, height: 10 },
    ]);

    const plan = swapPositionsCommand.createPlan(selection, undefined);
    expect(plan).toHaveLength(2);
    expect(plan.some((mutation) => mutation.shapeId === "a")).toBe(true);
    expect(plan.some((mutation) => mutation.shapeId === "b")).toBe(true);
  });
});

describe("rectify lines command", () => {
  it("sets the minor dimension to zero", () => {
    const selection = selectionFromBounds([
      { id: "line", left: 0, top: 0, width: 100, height: 2 },
    ]);
    selection.shapes[0] = createShape("line", { left: 0, top: 0, width: 100, height: 2 }, { isLine: true });

    expect(rectifyLinesCommand.createPlan(selection, undefined)).toEqual([{ shapeId: "line", height: 0 }]);
  });
});

describe("set bounds command", () => {
  it("applies only supplied finite values", () => {
    const selection = selectionFromBounds([
      { id: "a", left: 0, top: 0, width: 10, height: 10 },
      { id: "b", left: 20, top: 20, width: 10, height: 10 },
    ]);

    const plan = setBoundsCommand.createPlan(selection, { left: 5, width: 30 });
    expect(plan).toEqual([
      { shapeId: "a", left: 5, width: 30 },
      { shapeId: "b", left: 5, width: 30 },
    ]);
  });
});

describe("registry", () => {
  it("contains unique MVP command ids", () => {
    const ids = getUniqueFormattingCommandIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("align-left");
    expect(ids).toContain("swap-positions");
    expect(formattingCommandRegistry.length).toBeGreaterThan(20);
  });
});
