import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL ??= "postgresql://postgres:password@127.0.0.1:5432/deck-pack";
  process.env.BETTER_AUTH_SECRET ??= "test-integration-secret-placeholder-32-characters-min";
  process.env.BETTER_AUTH_URL ??= "http://127.0.0.1:3000";
  process.env.CORS_ORIGINS ??= "http://127.0.0.1:5173";
  process.env.OPS_ORIGINS ??= "http://127.0.0.1:5173";
  process.env.OPS_SIGNUP_EMAIL_DOMAIN ??= "code.berlin";
  process.env.EMAIL_API_KEY ??= "test-integration-key";
  process.env.EMAIL_FROM ??= "integration@test.local";
  process.env.PORTAL_APP_URL ??= "http://127.0.0.1:5174";
  process.env.PEXELS_API_KEY ??= "test-integration-pexels-key";
  process.env.BRANDFETCH_API_KEY ??= "test-integration-brandfetch-key";
  process.env.BRANDFETCH_CLIENT_ID ??= "test-integration-brandfetch-client";
  process.env.NOUN_PROJECT_API_KEY ??= "test-integration-noun-project-key";
  process.env.NOUN_PROJECT_API_SECRET ??= "test-integration-noun-project-secret";
  process.env.NODE_ENV ??= "test";
});

import {
  FlagNotFoundError,
  GetReadyFlagDetails,
  InMemoryGalleryRepository,
  SearchReadyFlags,
  SearchReadyShapes,
  SearchReadySlides,
} from "@deck-pack/gallery";
import { InMemoryObjectStorage } from "@deck-pack/storage";

async function putBlob(storage: InMemoryObjectStorage, key: string, contentType = "image/png") {
  await storage.put({
    key,
    contentType,
    body: new Uint8Array([1, 2, 3, 4]),
  });
}

describe("gallery discovery use-cases", () => {
  it("searches ready flags and returns signed preview urls", async () => {
    const repo = new InMemoryGalleryRepository();
    const storage = new InMemoryObjectStorage();
    await putBlob(storage, "flags/us.png");

    repo.seedDiscovery({
      flags: [
        {
          id: "flag-us",
          displayName: "United States",
          code: "US",
          scope: "global",
          previewBlobPath: "flags/us.png",
        },
        {
          id: "flag-de",
          displayName: "Germany",
          code: "DE",
          scope: "global",
          previewBlobPath: "flags/de.png",
        },
      ],
    });

    const result = await new SearchReadyFlags(repo, storage).execute({ query: "united" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.id).toBe("flag-us");
    expect(result.results[0]?.imageUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("returns flag details and throws FlagNotFoundError when missing", async () => {
    const repo = new InMemoryGalleryRepository();
    const storage = new InMemoryObjectStorage();
    await putBlob(storage, "flags/us-rect.png");
    await putBlob(storage, "flags/us-square.png");
    await putBlob(storage, "flags/us-circle.png");

    repo.seedDiscovery({
      flagDetails: [
        {
          id: "flag-us",
          displayName: "United States",
          code: "US",
          variants: [
            { role: "rectangle", blobPath: "flags/us-rect.png", contentType: "image/png" },
            { role: "square", blobPath: "flags/us-square.png", contentType: "image/png" },
            { role: "circle", blobPath: "flags/us-circle.png", contentType: "image/png" },
          ],
        },
      ],
    });

    const details = await new GetReadyFlagDetails(repo, storage).execute({ id: "flag-us" });
    expect(details.metadata.FLAG_CODE).toBe("US");
    expect(details.variants).toHaveLength(3);

    await expect(
      new GetReadyFlagDetails(repo, storage).execute({ id: "missing" }),
    ).rejects.toBeInstanceOf(FlagNotFoundError);
  });

  it("searches ready shapes with category facets", async () => {
    const repo = new InMemoryGalleryRepository();
    const storage = new InMemoryObjectStorage();
    await putBlob(storage, "shapes/chevron.svg", "image/svg+xml");

    const now = new Date();
    repo.seedDiscovery({
      shapes: [
        {
          id: "shape-1",
          displayName: "Chevron",
          category: "Arrows",
          scope: "global",
          createdAt: now,
          updatedAt: now,
          svgBlobPath: "shapes/chevron.svg",
          svgContentType: "image/svg+xml",
        },
      ],
    });

    const result = await new SearchReadyShapes(repo, storage).execute({});
    expect(result.total).toBe(1);
    expect(result.results[0]?.name).toBe("Chevron");
    expect(result.facets.categories).toContain("Arrows");
  });

  it("searches ready slides and builds tag facets", async () => {
    const repo = new InMemoryGalleryRepository();
    const storage = new InMemoryObjectStorage();
    await putBlob(storage, "slides/a-thumb.png");
    await putBlob(storage, "slides/a-pres.pptx", "application/vnd.ms-powerpoint");
    await putBlob(storage, "slides/b-thumb.png");
    await putBlob(storage, "slides/b-pres.pptx", "application/vnd.ms-powerpoint");

    const now = new Date();
    repo.seedDiscovery({
      slides: [
        {
          id: "slide-a",
          displayName: "Title Hero",
          category: "Intro",
          aspectRatio: "16:9",
          scope: "global",
          createdAt: now,
          updatedAt: now,
          thumbnailBlobPath: "slides/a-thumb.png",
          presentationBlobPath: "slides/a-pres.pptx",
          aliases: ["title", "hero"],
        },
        {
          id: "slide-b",
          displayName: "Closing CTA",
          category: "Closing",
          aspectRatio: "16:9",
          scope: "global",
          createdAt: now,
          updatedAt: now,
          thumbnailBlobPath: "slides/b-thumb.png",
          presentationBlobPath: "slides/b-pres.pptx",
          aliases: ["closing"],
        },
      ],
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
  });
});
