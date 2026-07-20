import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createLibraryService } from "@deck-pack/api/domains/library/service";
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
import { tx } from "@deck-pack/db/transaction";
import { createMemoryObjectStorage } from "@deck-pack/storage";

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

  it("creates a shape draft, attaches svg via service, and publishes", async () => {
    const storage = createMemoryObjectStorage();
    const service = createLibraryService({ storage });

    const created = await service.create(tx, {
      assetClass: "shape",
      displayName: "Chevron",
      aliases: ["arrow-chevron"],
      category: "Arrows",
      createdByUserId: null,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const itemId = created.data.id;

    const target = await service.createUploadTarget(tx, {
      id: itemId,
      role: "svg",
      contentType: "image/svg+xml",
      byteSize: 32,
    });
    expect(target.ok).toBe(true);
    if (!target.ok) return;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const finalized = await service.putAndFinalize(tx, {
      id: itemId,
      role: "svg",
      key: target.data.key,
      contentType: "image/svg+xml",
      dataBase64: Buffer.from(svg, "utf8").toString("base64"),
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.data.shape?.svgFile?.blobPath).toBe(target.data.key);

    const published = await service.publish(tx, { id: itemId });
    expect(published.ok).toBe(true);
    if (!published.ok) return;
    expect(published.data.status).toBe("ready");

    const listed = await listGlobalLibraryItems({ tx, assetClass: "shape" });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.status).toBe("ready");
    expect(listed[0]?.previewBlobPath).toBe(target.data.key);
    expect(listed[0]?.previewContentType).toBe("image/svg+xml");

    const apiList = await service.list(tx, { assetClass: "shape" });
    expect(apiList.ok).toBe(true);
    if (!apiList.ok) return;
    expect(apiList.data[0]?.previewUrl?.startsWith("data:image/svg+xml;base64,")).toBe(true);
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

    const storage = createMemoryObjectStorage();
    const service = createLibraryService({ storage });
    const published = await service.publish(tx, { id: created.id });
    expect(published.ok).toBe(false);
    if (!published.ok) {
      expect(published.code).toBe("invalid_state");
    }
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
