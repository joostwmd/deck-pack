import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { InvalidStateError } from "@deck-pack/errors";
import {
  checkPublishable,
  CreateGalleryItem,
  CreateGalleryUploadTarget,
  DrizzleGalleryRepository,
  ListGalleryItems,
  PublishGalleryItem,
  PutAndFinalizeGalleryUpload,
} from "@deck-pack/gallery";
import { InMemoryObjectStorage } from "@deck-pack/storage";

const GLOBAL = { kind: "global" as const };

describe("library admin (integration)", () => {
  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, gallery_item_names, gallery_items, files RESTART IDENTITY CASCADE`,
      ),
    );
  });

  function repo() {
    return new DrizzleGalleryRepository(new UnitOfWork(db));
  }

  it("creates a shape draft, attaches svg via use-case, and publishes", async () => {
    const storage = new InMemoryObjectStorage();
    const galleryRepo = repo();

    const created = await new CreateGalleryItem(galleryRepo).execute(GLOBAL, {
      assetClass: "shape",
      displayName: "Chevron",
      aliases: ["arrow-chevron"],
      category: "Arrows",
      createdByUserId: null,
    });

    const itemId = created.id;

    const target = await new CreateGalleryUploadTarget(galleryRepo, storage).execute(GLOBAL, {
      id: itemId,
      role: "svg",
      contentType: "image/svg+xml",
      byteSize: 32,
    });

    expect(target.mode).toBe("proxy");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const finalized = await new PutAndFinalizeGalleryUpload(galleryRepo, storage).execute(GLOBAL, {
      id: itemId,
      role: "svg",
      key: target.key,
      contentType: "image/svg+xml",
      dataBase64: Buffer.from(svg, "utf8").toString("base64"),
    });
    expect(finalized.shape?.svgFile?.blobPath).toBe(target.key);

    const published = await new PublishGalleryItem(galleryRepo).execute(GLOBAL, { id: itemId });
    expect(published.status).toBe("ready");

    const listed = await galleryRepo.list(GLOBAL, { assetClass: "shape" });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.status).toBe("ready");
    expect(listed[0]?.previewBlobPath).toBe(target.key);
    expect(listed[0]?.previewContentType).toBe("image/svg+xml");

    const apiList = await new ListGalleryItems(galleryRepo, storage).execute(GLOBAL, {
      assetClass: "shape",
    });
    expect(apiList[0]?.previewUrl?.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  it("rejects publish when required files are missing", async () => {
    const galleryRepo = repo();
    const created = await galleryRepo.create(GLOBAL, {
      assetClass: "flag",
      displayName: "United States",
      aliases: ["USA"],
      flagCode: "US",
      createdByUserId: null,
    });

    const detail = await galleryRepo.get(GLOBAL, created.id);
    expect(detail).not.toBeNull();
    expect(checkPublishable(detail!).ok).toBe(false);

    await expect(
      new PublishGalleryItem(galleryRepo).execute(GLOBAL, { id: created.id }),
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it("archives an item and hides it from default list", async () => {
    const galleryRepo = repo();
    const created = await galleryRepo.create(GLOBAL, {
      assetClass: "slide",
      displayName: "Title slide",
      category: "Intro",
      aspectRatio: "16:9",
      createdByUserId: null,
    });

    const file = await galleryRepo.insertFile({
      blobPath: `global/slide/${created.id}/presentation.pptx`,
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      byteSize: 10,
    });
    const thumb = await galleryRepo.insertFile({
      blobPath: `global/slide/${created.id}/thumbnail.png`,
      contentType: "image/png",
      byteSize: 4,
    });

    await galleryRepo.attachFile({
      galleryItemId: created.id,
      role: "presentation",
      fileId: file.id,
    });
    await galleryRepo.attachFile({
      galleryItemId: created.id,
      role: "thumbnail",
      fileId: thumb.id,
    });
    await galleryRepo.setStatus(GLOBAL, created.id, "ready");
    await galleryRepo.setStatus(GLOBAL, created.id, "archived");

    const visible = await galleryRepo.list(GLOBAL, { assetClass: "slide" });
    const withArchived = await galleryRepo.list(GLOBAL, {
      assetClass: "slide",
      includeArchived: true,
    });

    expect(visible).toHaveLength(0);
    expect(withArchived).toHaveLength(1);
    expect(withArchived[0]?.status).toBe("archived");
  });
});
