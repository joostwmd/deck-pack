import { describe, expect, it } from "vitest";

import {
  GetIconDetails,
  IconNotFoundError,
  InMemoryIconIntegration,
  SearchIcons,
  type IconDetailsResponse,
} from "@deck-pack/icons";

function seedIcon(overrides?: Partial<IconDetailsResponse>): IconDetailsResponse {
  return {
    id: "1234",
    name: "Arrow",
    imageUrl: "https://example.com/arrow.png",
    variants: [
      {
        id: "1234",
        imageUrl: "https://example.com/arrow.png",
        name: "Line",
        insert: { type: "svg", svg: "<svg />" },
      },
    ],
    metadata: {
      TYPE: "icon",
      ICON_ID: "1234",
      ICON_NAME: "Arrow",
      ATTRIBUTION: "",
      PROVIDER: "noun-project",
    },
    ...overrides,
  };
}

describe("icons use-cases", () => {
  it("searches seeded icons by name", async () => {
    const integration = new InMemoryIconIntegration();
    integration.seed([
      seedIcon(),
      seedIcon({ id: "99", name: "Circle", imageUrl: "https://example.com/circle.png" }),
    ]);

    const result = await new SearchIcons(integration).execute({ query: "arrow" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      id: "1234",
      imageUrl: "https://example.com/arrow.png",
      name: "Arrow",
    });
  });

  it("returns icon details for a known identifier", async () => {
    const integration = new InMemoryIconIntegration();
    const seeded = seedIcon();
    integration.seed([seeded]);

    const result = await new GetIconDetails(integration).execute({ externalId: "1234" });

    expect(result).toEqual(seeded);
  });

  it("throws IconNotFoundError when details are missing", async () => {
    const integration = new InMemoryIconIntegration();

    await expect(
      new GetIconDetails(integration).execute({ externalId: "missing" }),
    ).rejects.toBeInstanceOf(IconNotFoundError);
  });
});
