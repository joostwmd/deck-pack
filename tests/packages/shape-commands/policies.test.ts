import { describe, expect, it } from "vitest";

import {
  composePolicies,
  exactShapes,
  minShapes,
  onlyLines,
  supportsBoundsMutation,
  supportsResize,
} from "@deck-pack/presentation-formatting/policies";
import { createShape, selectionOf } from "@deck-pack/presentation-formatting/test-utils/selection";

describe("policies", () => {
  it("explains why swap is unavailable for three shapes", () => {
    expect(
      exactShapes(2)(
        selectionOf([
          createShape("a", { left: 0, top: 0, width: 10, height: 10 }),
          createShape("b", { left: 20, top: 0, width: 10, height: 10 }),
          createShape("c", { left: 40, top: 0, width: 10, height: 10 }),
        ]),
      ),
    ).toEqual({
      applicable: false,
      code: "exact-shape-count",
      reason: "Select exactly 2 objects",
    });
  });

  it("requires a minimum number of shapes", () => {
    expect(
      minShapes(2)(selectionOf([createShape("a", { left: 0, top: 0, width: 10, height: 10 })])),
    ).toEqual({
      applicable: false,
      code: "min-shape-count",
      reason: "Select at least 2 objects",
    });
  });

  it("short-circuits composed policies in order", () => {
    const policy = composePolicies(minShapes(2), exactShapes(2), supportsBoundsMutation);
    expect(
      policy(selectionOf([createShape("a", { left: 0, top: 0, width: 10, height: 10 })])),
    ).toEqual({
      applicable: false,
      code: "min-shape-count",
      reason: "Select at least 2 objects",
    });
  });

  it("rejects unsupported resize targets", () => {
    const line = createShape(
      "line",
      { left: 0, top: 0, width: 100, height: 0 },
      { isLine: true, supportsResize: false },
    );
    expect(supportsResize(selectionOf([line]))).toEqual({
      applicable: false,
      code: "unsupported-resize",
      reason: "One or more selected objects cannot be resized",
    });
  });

  it("requires line-only selections for line tools", () => {
    const line = createShape("line", { left: 0, top: 0, width: 100, height: 0 }, { isLine: true });
    const box = createShape("box", { left: 0, top: 0, width: 10, height: 10 });
    expect(onlyLines(selectionOf([line, box]))).toEqual({
      applicable: false,
      code: "requires-line-shapes",
      reason: "Select one or more line objects",
    });
  });
});
