import { describe, expect, it } from "vitest";

import { sortShapesHorizontally, sortShapesVertically } from "@deck-pack/presentation-formatting/geometry/sort";
import { createShape } from "@deck-pack/presentation-formatting/test-utils/selection";

describe("geometry sort", () => {
  it("sorts horizontally by visual left with selection index tie-breaker", () => {
    const shapes = [
      createShape("c", { left: 40, top: 0, width: 10, height: 10 }, { selectionIndex: 2 }),
      createShape("a", { left: 0, top: 0, width: 10, height: 10 }, { selectionIndex: 0 }),
      createShape("b", { left: 20, top: 0, width: 10, height: 10 }, { selectionIndex: 1 }),
    ];

    expect(sortShapesHorizontally(shapes).map((shape) => shape.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const shapes = [
      createShape("b", { left: 20, top: 0, width: 10, height: 10 }),
      createShape("a", { left: 0, top: 0, width: 10, height: 10 }),
    ];
    const original = [...shapes];
    sortShapesVertically(shapes);
    expect(shapes).toEqual(original);
  });
});
