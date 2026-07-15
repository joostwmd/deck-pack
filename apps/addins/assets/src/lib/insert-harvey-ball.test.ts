import { beforeEach, describe, expect, it, vi } from "vitest";

const { insertSvgWithMetadata, insertImageWithMetadata, mutate } = vi.hoisted(() => ({
  insertSvgWithMetadata: vi.fn(),
  insertImageWithMetadata: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@deck-pack/office-js", () => ({
  officeClient: {
    insertSvgWithMetadata,
    insertImageWithMetadata,
  },
}));

vi.mock("@/lib/url-to-base64", () => ({
  urlToBase64: vi.fn().mockResolvedValue("base64-image"),
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
import { HARVEY_BALL_EXTERNAL_ID } from "./insert-harvey-ball";
import {
  createCanvasStrategy,
  officeInsertionStrategy,
  type InsertionItem,
} from "./insertion-strategy";

function createHarveyBallItem(percentage = 75): InsertionItem {
  return {
    variantId: `harvey-ball-${percentage}`,
    name: `Harvey ball ${percentage}%`,
    imageUrl: "",
    insert: {
      type: "svg",
      svg: `<svg data-percentage="${percentage}"></svg>`,
    },
    metadata: {
      TYPE: "HARVEY_BALL",
      PERCENTAGE: String(percentage),
      FILL_COLOR: DEFAULT_HARVEY_BALL_CONFIG.fillColor,
      BACKGROUND_COLOR: DEFAULT_HARVEY_BALL_CONFIG.backgroundColor,
      OUTLINE_COLOR: DEFAULT_HARVEY_BALL_CONFIG.outlineColor,
      OUTLINE_WIDTH: String(DEFAULT_HARVEY_BALL_CONFIG.outlineWidth),
    },
    assetType: "harvey_ball",
    externalId: HARVEY_BALL_EXTERNAL_ID,
  };
}

describe("insertion strategy", () => {
  beforeEach(() => {
    insertSvgWithMetadata.mockReset();
    insertImageWithMetadata.mockReset();
    mutate.mockReset();
    insertSvgWithMetadata.mockResolvedValue("shape-1");
    mutate.mockResolvedValue({ id: "event-1" });
  });

  it("inserts SVG with metadata via office strategy", async () => {
    const item = createHarveyBallItem(75);

    await officeInsertionStrategy.insert(item);

    expect(insertSvgWithMetadata).toHaveBeenCalledTimes(1);
    expect(insertSvgWithMetadata).toHaveBeenCalledWith(item.insert.svg, item.metadata);

    expect(mutate).toHaveBeenCalledWith({
      assetType: "harvey_ball",
      externalId: HARVEY_BALL_EXTERNAL_ID,
      client: "office",
      metadata: item.metadata,
    });
  });

  it("adds items to the web canvas via canvas strategy", async () => {
    const addToCanvas = vi.fn();
    const strategy = createCanvasStrategy({
      items: [],
      addToCanvas,
      updateItemPosition: vi.fn(),
      removeItem: vi.fn(),
      clearCanvas: vi.fn(),
    });

    const item = createHarveyBallItem(25);
    await strategy.insert(item);

    expect(addToCanvas).toHaveBeenCalledWith({
      variantId: item.variantId,
      name: item.name,
      imageUrl: item.imageUrl,
      insert: item.insert,
      metadata: item.metadata,
    });

    expect(mutate).toHaveBeenCalledWith({
      assetType: "harvey_ball",
      externalId: HARVEY_BALL_EXTERNAL_ID,
      client: "web",
      metadata: item.metadata,
    });
  });
});
