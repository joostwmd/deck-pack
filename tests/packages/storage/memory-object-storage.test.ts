import { describe, expect, it } from "vitest";

import {
  buildGalleryObjectKey,
  InMemoryObjectStorage,
  StorageNotFoundError,
} from "@deck-pack/storage";

describe("InMemoryObjectStorage", () => {
  it("mints upload targets with required headers", async () => {
    const storage = new InMemoryObjectStorage();
    const target = await storage.createUploadTarget({
      key: "global/shape/item-1/svg.svg",
      contentType: "image/svg+xml",
      expiresInSeconds: 60,
    });

    expect(target.method).toBe("PUT");
    expect(target.headers["Content-Type"]).toBe("image/svg+xml");
    expect(target.uploadUrl).toContain("memory://upload/");
    expect(target.mode).toBe("proxy");
    expect(target.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns null from head until seeded, then serves download urls", async () => {
    const storage = new InMemoryObjectStorage();
    const key = "global/flag/item-1/variant_rectangle.png";

    expect(await storage.head(key)).toBeNull();

    storage.seed(key, { contentType: "image/png", byteSize: 128 });

    await expect(storage.head(key)).resolves.toMatchObject({
      key,
      contentType: "image/png",
      byteSize: 128,
    });

    // Seeded without body → opaque memory URL (not browser-renderable).
    const download = await storage.createDownloadUrl({ key, expiresInSeconds: 30 });
    expect(download.url).toContain("memory://download/");
  });

  it("returns a data URL when the object body is available", async () => {
    const storage = new InMemoryObjectStorage();
    const key = "global/shape/item-1/svg.svg";
    const body = new TextEncoder().encode("<svg/>");

    await storage.put({ key, contentType: "image/svg+xml", body });

    const download = await storage.createDownloadUrl({ key, expiresInSeconds: 30 });
    expect(download.url.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  it("throws when downloading a missing object", async () => {
    const storage = new InMemoryObjectStorage();

    await expect(
      storage.createDownloadUrl({ key: "missing", expiresInSeconds: 30 }),
    ).rejects.toBeInstanceOf(StorageNotFoundError);
  });

  it("deletes seeded objects", async () => {
    const storage = new InMemoryObjectStorage();
    const key = "org/org-1/slide/item-1/presentation.pptx";
    storage.seed(key, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      byteSize: 2048,
    });

    await storage.delete(key);
    expect(await storage.head(key)).toBeNull();
  });
});

describe("buildGalleryObjectKey", () => {
  it("builds global and org paths", () => {
    expect(
      buildGalleryObjectKey({
        scope: "global",
        assetClass: "shape",
        galleryItemId: "shape-1",
        role: "svg",
        extension: "svg",
      }),
    ).toBe("global/shape/shape-1/svg.svg");

    expect(
      buildGalleryObjectKey({
        scope: "org",
        organizationId: "org-1",
        assetClass: "slide",
        galleryItemId: "slide-1",
        role: "thumbnail",
        extension: ".png",
      }),
    ).toBe("org/org-1/slide/slide-1/thumbnail.png");
  });

  it("requires organizationId for org scope", () => {
    expect(() =>
      buildGalleryObjectKey({
        scope: "org",
        assetClass: "flag",
        galleryItemId: "flag-1",
        role: "variant_rectangle",
        extension: "png",
      }),
    ).toThrow(/organizationId/);
  });
});
