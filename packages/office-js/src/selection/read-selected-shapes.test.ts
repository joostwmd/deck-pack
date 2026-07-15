import { describe, expect, it } from "vitest";

import { mapOfficeSelection } from "./read-selected-shapes";

describe("readSelectedShapes mapping", () => {
  it("maps office shapes into domain selection objects", () => {
    const selection = mapOfficeSelection("slide-1", [
      {
        id: "a",
        name: "Box A",
        type: "rectangle",
        left: 10,
        top: 20,
        width: 30,
        height: 40,
        rotation: 0,
      },
    ]);

    expect(selection.slideId).toBe("slide-1");
    expect(selection.shapes).toHaveLength(1);
    expect(selection.shapes[0]?.capabilities.supportsBoundsMutation).toBe(true);
    expect(selection.shapes[0]?.visualBounds).toEqual({
      left: 10,
      top: 20,
      width: 30,
      height: 40,
    });
  });

  it("marks line shapes correctly", () => {
    const selection = mapOfficeSelection("slide-1", [
      {
        id: "line",
        name: "Line",
        type: "line",
        left: 0,
        top: 0,
        width: 100,
        height: 0,
        rotation: 0,
      },
    ]);

    expect(selection.shapes[0]?.capabilities.isLine).toBe(true);
    expect(selection.shapes[0]?.capabilities.supportsResize).toBe(false);
  });
});
