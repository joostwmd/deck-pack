import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { unitOfWork } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx } from "@deck-pack/db/transaction";
import {
  DrizzleGalleryRepository,
  GetReadyFlagDetails,
  SearchReadyFlags,
  SearchReadyShapes,
  SearchReadySlides,
} from "@deck-pack/gallery";
import { createMemoryObjectStorage } from "@deck-pack/storage";

import {
  seedPendingShape,
  seedReadyFlag,
  seedReadyShape,
  seedReadySlide,
} from "../test-utils/seed-ready-gallery-fixture";

describe("assets discovery use-cases (integration)", () => {
  beforeAll(async () => {
    await ensureMigrationsApplied();
  }, 60_000);

  beforeEach(async () => {
    await tx.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, gallery_item_names, gallery_items, files RESTART IDENTITY CASCADE`,
      ),
    );
  });

  it("shape search returns signed svg urls for ready items only", async () => {
    const storage = createMemoryObjectStorage();
    const repo = new DrizzleGalleryRepository(unitOfWork);

    await seedReadyShape(tx, storage, {
      displayName: "Chevron",
      category: "Arrows",
    });
    await seedPendingShape(tx, { displayName: "Draft", category: "Arrows" });

    const response = await new SearchReadyShapes(repo, storage).execute({});

    expect(response.total).toBe(1);
    expect(response.results[0]?.name).toBe("Chevron");
    expect(response.results[0]?.thumbnailUrl).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(response.results[0]?.svgUrl).toBe(response.results[0]?.thumbnailUrl);
    expect(response.facets.categories).toContain("Arrows");
  });

  it("slide search maps aliases to tags and applies filters", async () => {
    const storage = createMemoryObjectStorage();
    const repo = new DrizzleGalleryRepository(unitOfWork);

    await seedReadySlide(tx, storage, {
      displayName: "Title Hero",
      category: "Intro",
      aspectRatio: "16:9",
      aliases: ["title", "hero"],
    });
    await seedReadySlide(tx, storage, {
      displayName: "Closing CTA",
      category: "Closing",
      aspectRatio: "16:9",
      aliases: ["closing"],
    });

    const all = await new SearchReadySlides(repo, storage).execute({ sort: "relevance" });
    expect(all.total).toBe(2);
    expect(all.facets.tags).toEqual(["closing", "hero", "title"]);

    const filtered = await new SearchReadySlides(repo, storage).execute({
      query: "hero",
      sort: "relevance",
    });
    expect(filtered.total).toBe(1);
    expect(filtered.results[0]?.tags).toEqual(expect.arrayContaining(["title", "hero"]));
    expect(filtered.results[0]?.thumbnailUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("flag search and getDetails return signed variant urls", async () => {
    const storage = createMemoryObjectStorage();
    const repo = new DrizzleGalleryRepository(unitOfWork);

    const seeded = await seedReadyFlag(tx, storage, {
      displayName: "United States",
      code: "US",
      aliases: ["USA"],
    });

    const search = await new SearchReadyFlags(repo, storage).execute({ query: "usa" });
    expect(search.results).toHaveLength(1);
    expect(search.results[0]?.imageUrl.startsWith("data:image/png;base64,")).toBe(true);

    const details = await new GetReadyFlagDetails(repo, storage).execute({ id: seeded.id });
    expect(details.variants).toHaveLength(3);
    expect(details.metadata.FLAG_CODE).toBe("US");
    expect(details.variants.every((v) => v.imageUrl.startsWith("data:image/png;base64,"))).toBe(
      true,
    );
  });
});
