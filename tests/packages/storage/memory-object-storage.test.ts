import { describe, expect, it } from "vitest";

import {
  buildLibraryObjectKey,
  createMemoryObjectStorage,
  StorageNotFoundError,
} from "@deck-pack/storage";

describe("createMemoryObjectStorage", () => {
  it("mints upload targets with required headers", async () => {
    const storage = createMemoryObjectStorage();
    const target = await storage.createUploadTarget({
      key: "global/shape/item-1/svg.svg",
      contentType: "image/svg+xml",
      expiresInSeconds: 60,
    });

    expect(target.method).toBe("PUT");
    expect(target.headers["Content-Type"]).toBe("image/svg+xml");
    expect(target.uploadUrl).toContain("memory://upload/");
    expect(target.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns null from head until seeded, then serves download urls", async () => {
    const storage = createMemoryObjectStorage();
    const key = "global/flag/item-1/variant_rectangle.png";

    expect(await storage.head(key)).toBeNull();

    storage.seed(key, { contentType: "image/png", byteSize: 128 });

    await expect(storage.head(key)).resolves.toMatchObject({
      key,
      contentType: "image/png",
      byteSize: 128,
    });

    const download = await storage.createDownloadUrl({ key, expiresInSeconds: 30 });
    expect(download.url).toContain("memory://download/");
  });

  it("throws when downloading a missing object", async () => {
    const storage = createMemoryObjectStorage();

    await expect(
      storage.createDownloadUrl({ key: "missing", expiresInSeconds: 30 }),
    ).rejects.toBeInstanceOf(StorageNotFoundError);
  });

  it("deletes seeded objects", async () => {
    const storage = createMemoryObjectStorage();
    const key = "org/org-1/slide/item-1/presentation.pptx";
    storage.seed(key, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      byteSize: 2048,
    });

    await storage.delete(key);
    expect(await storage.head(key)).toBeNull();
  });
});

describe("buildLibraryObjectKey", () => {
  it("builds global and org paths", () => {
    expect(
      buildLibraryObjectKey({
        scope: "global",
        assetClass: "shape",
        libraryItemId: "shape-1",
        role: "svg",
        extension: "svg",
      }),
    ).toBe("global/shape/shape-1/svg.svg");

    expect(
      buildLibraryObjectKey({
        scope: "org",
        organizationId: "org-1",
        assetClass: "slide",
        libraryItemId: "slide-1",
        role: "thumbnail",
        extension: ".png",
      }),
    ).toBe("org/org-1/slide/slide-1/thumbnail.png");
  });

  it("requires organizationId for org scope", () => {
    expect(() =>
      buildLibraryObjectKey({
        scope: "org",
        assetClass: "flag",
        libraryItemId: "flag-1",
        role: "variant_rectangle",
        extension: "png",
      }),
    ).toThrow(/organizationId/);
  });
});
