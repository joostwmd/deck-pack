import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import {
  attachFileToLibraryItem,
  createGlobalLibraryItem,
  getGlobalLibraryItem,
  insertLibraryFile,
  isLibraryItemPublishable,
  listGlobalLibraryItems,
  setGlobalLibraryItemStatus,
} from "@deck-pack/db/queries/libraryAdmin";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx, UnitOfWork } from "@deck-pack/db/transaction";
import { InvalidStateError } from "@deck-pack/errors";
import {
  CreateGalleryItem,
  CreateGalleryUploadTarget,
  DrizzleGalleryRepository,
  ListGalleryItems,
  PublishGalleryItem,
  PutAndFinalizeGalleryUpload,
} from "@deck-pack/gallery";
import { createMemoryObjectStorage } from "@deck-pack/storage";

const GLOBAL = { kind: "global" as const };

describe("library admin (integration)", () => {
  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, library_item_names, library_items, files RESTART IDENTITY CASCADE`,
      ),
    );
  });

  it("creates a shape draft, attaches svg via use-case, and publishes", async () => {
    const storage = createMemoryObjectStorage();
    const repo = new DrizzleGalleryRepository(new UnitOfWork(db));

    const created = await new CreateGalleryItem(repo).execute(GLOBAL, {
      assetClass: "shape",
      displayName: "Chevron",
      aliases: ["arrow-chevron"],
      category: "Arrows",
      createdByUserId: null,
    });

    const itemId = created.id;

    const target = await new CreateGalleryUploadTarget(repo, storage).execute(GLOBAL, {
      id: itemId,
      role: "svg",
      contentType: "image/svg+xml",
      byteSize: 32,
    });

    expect(target.mode).toBe("proxy");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const finalized = await new PutAndFinalizeGalleryUpload(repo, storage).execute(GLOBAL, {
      id: itemId,
      role: "svg",
      key: target.key,
      contentType: "image/svg+xml",
      dataBase64: Buffer.from(svg, "utf8").toString("base64"),
    });
    expect(finalized.shape?.svgFile?.blobPath).toBe(target.key);

    const published = await new PublishGalleryItem(repo).execute(GLOBAL, { id: itemId });
    expect(published.status).toBe("ready");

    const listed = await listGlobalLibraryItems({ tx, assetClass: "shape" });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.status).toBe("ready");
    expect(listed[0]?.previewBlobPath).toBe(target.key);
    expect(listed[0]?.previewContentType).toBe("image/svg+xml");

    const apiList = await new ListGalleryItems(repo, storage).execute(GLOBAL, {
      assetClass: "shape",
    });
    expect(apiList[0]?.previewUrl?.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  it("rejects publish when required files are missing", async () => {
    const created = await createGlobalLibraryItem({
      tx,
      input: {
        assetClass: "flag",
        displayName: "United States",
        aliases: ["USA"],
        flagCode: "US",
        createdByUserId: null,
      },
    });

    const detail = await getGlobalLibraryItem({ tx, id: created.id });
    expect(detail).not.toBeNull();
    expect(isLibraryItemPublishable(detail!).ok).toBe(false);

    const repo = new DrizzleGalleryRepository(new UnitOfWork(db));
    await expect(
      new PublishGalleryItem(repo).execute(GLOBAL, { id: created.id }),
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it("archives an item and hides it from default list", async () => {
    const created = await createGlobalLibraryItem({
      tx,
      input: {
        assetClass: "slide",
        displayName: "Title slide",
        category: "Intro",
        aspectRatio: "16:9",
        createdByUserId: null,
      },
    });

    const file = await insertLibraryFile({
      tx,
      blobPath: `global/slide/${created.id}/presentation.pptx`,
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      byteSize: 10,
    });
    const thumb = await insertLibraryFile({
      tx,
      blobPath: `global/slide/${created.id}/thumbnail.png`,
      contentType: "image/png",
      byteSize: 4,
    });

    await attachFileToLibraryItem({
      tx,
      libraryItemId: created.id,
      role: "presentation",
      fileId: file.id,
    });
    await attachFileToLibraryItem({
      tx,
      libraryItemId: created.id,
      role: "thumbnail",
      fileId: thumb.id,
    });
    await setGlobalLibraryItemStatus({
      tx,
      id: created.id,
      status: "ready",
    });
    await setGlobalLibraryItemStatus({
      tx,
      id: created.id,
      status: "archived",
    });

    const visible = await listGlobalLibraryItems({ tx, assetClass: "slide" });
    const withArchived = await listGlobalLibraryItems({
      tx,
      assetClass: "slide",
      includeArchived: true,
    });

    expect(visible).toHaveLength(0);
    expect(withArchived).toHaveLength(1);
    expect(withArchived[0]?.status).toBe("archived");
  });
});
