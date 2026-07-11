import { beforeEach, describe, expect, it, vi } from "vitest";

const { insertSvgWithMetadata, mutate } = vi.hoisted(() => ({
  insertSvgWithMetadata: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@deck-pack/office-js", () => ({
  officeClient: {
    insertSvgWithMetadata,
  },
}));

vi.mock("@/utils/trpc", () => ({
  trpcClient: {
    addin: {
      insertions: {
        track: {
          mutate,
        },
      },
    },
  },
}));

import { DEFAULT_HARVEY_BALL_CONFIG } from "./harvey-ball-svg";
import { HARVEY_BALL_EXTERNAL_ID, insertHarveyBall } from "./insert-harvey-ball";

describe("insertHarveyBall", () => {
  beforeEach(() => {
    insertSvgWithMetadata.mockReset();
    mutate.mockReset();
    insertSvgWithMetadata.mockResolvedValue("shape-1");
    mutate.mockResolvedValue({ id: "event-1" });
  });

  it("inserts SVG with metadata in office mode", async () => {
    await insertHarveyBall({
      mode: "office",
      config: { ...DEFAULT_HARVEY_BALL_CONFIG, percentage: 75 },
    });

    expect(insertSvgWithMetadata).toHaveBeenCalledTimes(1);

    const [svg, metadata] = insertSvgWithMetadata.mock.calls[0] ?? [];

    expect(svg).toContain("<svg");
    expect(metadata).toEqual({
      TYPE: "HARVEY_BALL",
      PERCENTAGE: "75",
      FILL_COLOR: DEFAULT_HARVEY_BALL_CONFIG.fillColor,
      BACKGROUND_COLOR: DEFAULT_HARVEY_BALL_CONFIG.backgroundColor,
      OUTLINE_COLOR: DEFAULT_HARVEY_BALL_CONFIG.outlineColor,
      OUTLINE_WIDTH: String(DEFAULT_HARVEY_BALL_CONFIG.outlineWidth),
    });

    expect(mutate).toHaveBeenCalledWith({
      assetType: "harvey_ball",
      externalId: HARVEY_BALL_EXTERNAL_ID,
      client: "office",
      metadata,
    });
  });

  it("adds the SVG to the web canvas in web mode", async () => {
    const addToCanvas = vi.fn();

    await insertHarveyBall({
      mode: "web",
      config: { ...DEFAULT_HARVEY_BALL_CONFIG, percentage: 25 },
      webCanvas: { addToCanvas },
    });

    expect(addToCanvas).toHaveBeenCalledWith({
      variantId: "harvey-ball-25",
      name: "Harvey ball 25%",
      imageUrl: "",
      insert: {
        type: "svg",
        svg: expect.stringContaining("<svg"),
      },
      metadata: expect.objectContaining({
        TYPE: "HARVEY_BALL",
        PERCENTAGE: "25",
      }),
    });

    expect(mutate).toHaveBeenCalledWith({
      assetType: "harvey_ball",
      externalId: HARVEY_BALL_EXTERNAL_ID,
      client: "web",
      metadata: expect.objectContaining({
        TYPE: "HARVEY_BALL",
        PERCENTAGE: "25",
      }),
    });
  });

  it("throws when web canvas is unavailable in web mode", async () => {
    await expect(
      insertHarveyBall({
        mode: "web",
        config: DEFAULT_HARVEY_BALL_CONFIG,
        webCanvas: null,
      }),
    ).rejects.toThrow("Canvas not available");
  });
});
