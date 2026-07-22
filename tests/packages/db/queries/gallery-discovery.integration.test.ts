import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@deck-pack/db";
import { organization } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { UnitOfWork } from "@deck-pack/db/transaction";
import { DrizzleGalleryRepository } from "@deck-pack/gallery/repositories/gallery-repository";

const GLOBAL = { kind: "global" as const };

describe("library discovery (integration)", () => {
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

  it("returns only ready shapes with svg attached", async () => {
    const galleryRepo = repo();
    const ready = await galleryRepo.create(GLOBAL, {
      assetClass: "shape",
      displayName: "Chevron",
      category: "Arrows",
      createdByUserId: null,
    });
    const svgFile = await galleryRepo.insertFile({
      blobPath: `global/shape/${ready.id}/shape.svg`,
      contentType: "image/svg+xml",
      byteSize: 10,
    });
    await galleryRepo.attachFile({
      galleryItemId: ready.id,
      role: "svg",
      fileId: svgFile.id,
    });
    await galleryRepo.setStatus(GLOBAL, ready.id, "ready");

    const pending = await galleryRepo.create(GLOBAL, {
      assetClass: "shape",
      displayName: "Draft shape",
      category: "Arrows",
      createdByUserId: null,
    });
    await galleryRepo.setStatus(GLOBAL, pending.id, "pending");

    const shapes = await galleryRepo.searchReadyShapes({});
    expect(shapes).toHaveLength(1);
    expect(shapes[0]?.id).toBe(ready.id);
    expect(shapes[0]?.displayName).toBe("Chevron");
  });

  it("filters shapes by category", async () => {
    const galleryRepo = repo();
    for (const [displayName, category] of [
      ["Arrow A", "Arrows"],
      ["Banner A", "Banners & Ribbons"],
    ] as const) {
      const created = await galleryRepo.create(GLOBAL, {
        assetClass: "shape",
        displayName,
        category,
        createdByUserId: null,
      });
      const svgFile = await galleryRepo.insertFile({
        blobPath: `global/shape/${created.id}/shape.svg`,
        contentType: "image/svg+xml",
        byteSize: 10,
      });
      await galleryRepo.attachFile({
        galleryItemId: created.id,
        role: "svg",
        fileId: svgFile.id,
      });
      await galleryRepo.setStatus(GLOBAL, created.id, "ready");
    }

    const arrows = await galleryRepo.searchReadyShapes({ category: "Arrows" });
    expect(arrows).toHaveLength(1);
    expect(arrows[0]?.displayName).toBe("Arrow A");
  });

  it("filters slides by query, tags, and aspect ratio", async () => {
    const galleryRepo = repo();
    const created = await galleryRepo.create(GLOBAL, {
      assetClass: "slide",
      displayName: "Title Hero",
      category: "Intro",
      aspectRatio: "16:9",
      aliases: ["title", "hero"],
      createdByUserId: null,
    });
    const presentation = await galleryRepo.insertFile({
      blobPath: `global/slide/${created.id}/presentation.pptx`,
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      byteSize: 10,
    });
    const thumbnail = await galleryRepo.insertFile({
      blobPath: `global/slide/${created.id}/thumbnail.png`,
      contentType: "image/png",
      byteSize: 4,
    });
    await galleryRepo.attachFile({
      galleryItemId: created.id,
      role: "presentation",
      fileId: presentation.id,
    });
    await galleryRepo.attachFile({
      galleryItemId: created.id,
      role: "thumbnail",
      fileId: thumbnail.id,
    });
    await galleryRepo.setStatus(GLOBAL, created.id, "ready");

    const byQuery = await galleryRepo.searchReadySlides({ query: "hero", sort: "relevance" });
    expect(byQuery).toHaveLength(1);

    const byTag = await galleryRepo.searchReadySlides({
      tags: ["title"],
      aspectRatio: "16:9",
      sort: "relevance",
    });
    expect(byTag).toHaveLength(1);
    expect(byTag[0]?.aliases).toEqual(expect.arrayContaining(["title", "hero"]));

    const noMatch = await galleryRepo.searchReadySlides({ query: "zzzz-no-match" });
    expect(noMatch).toHaveLength(0);
  });

  it("searches flags by display name, code, and alias", async () => {
    const galleryRepo = repo();
    const created = await galleryRepo.create(GLOBAL, {
      assetClass: "flag",
      displayName: "United States",
      aliases: ["USA"],
      flagCode: "US",
      createdByUserId: null,
    });

    for (const role of ["rectangle", "square", "circle"] as const) {
      const file = await galleryRepo.insertFile({
        blobPath: `global/flag/${created.id}/${role}.png`,
        contentType: "image/png",
        byteSize: 4,
      });
      await galleryRepo.attachFile({
        galleryItemId: created.id,
        role,
        fileId: file.id,
      });
    }
    await galleryRepo.setStatus(GLOBAL, created.id, "ready");

    expect(await galleryRepo.searchReadyFlags({ query: "united" })).toHaveLength(1);
    expect(await galleryRepo.searchReadyFlags({ query: "us" })).toHaveLength(1);
    expect(await galleryRepo.searchReadyFlags({ query: "usa" })).toHaveLength(1);

    const details = await galleryRepo.getReadyFlagDetails({ id: created.id });
    expect(details?.variants).toHaveLength(3);
  });

  it("merges global and org shapes for an organization and exposes scope", async () => {
    const galleryRepo = repo();
    const orgId = crypto.randomUUID();
    const now = new Date();

    await db.insert(organization).values({
      id: orgId,
      name: "Team Org",
      slug: `team-${orgId.slice(0, 8)}`,
      createdAt: now,
      metadata: JSON.stringify({ type: "team" }),
    });

    async function seedReadyShape(
      displayName: string,
      scope: "global" | "org",
    ): Promise<{ id: string }> {
      const orgScope = { kind: "org" as const, organizationId: orgId };
      const created =
        scope === "global"
          ? await galleryRepo.create(GLOBAL, {
              assetClass: "shape",
              displayName,
              category: "Arrows",
              createdByUserId: null,
            })
          : await galleryRepo.create(orgScope, {
              assetClass: "shape",
              displayName,
              category: "Arrows",
              createdByUserId: null,
            });

      const svgFile = await galleryRepo.insertFile({
        blobPath: `${scope}/shape/${created.id}/shape.svg`,
        contentType: "image/svg+xml",
        byteSize: 10,
      });
      await galleryRepo.attachFile({
        galleryItemId: created.id,
        role: "svg",
        fileId: svgFile.id,
      });
      await galleryRepo.setStatus(scope === "global" ? GLOBAL : orgScope, created.id, "ready");

      return created;
    }

    const globalShape = await seedReadyShape("Global Arrow", "global");
    const orgShape = await seedReadyShape("Internal Arrow", "org");

    const merged = await galleryRepo.searchReadyShapes({ organizationId: orgId });
    expect(merged).toHaveLength(2);
    expect(merged.map((row) => row.id).sort()).toEqual([globalShape.id, orgShape.id].sort());
    expect(merged.find((row) => row.id === globalShape.id)?.scope).toBe("global");
    expect(merged.find((row) => row.id === orgShape.id)?.scope).toBe("org");

    const internalOnly = await galleryRepo.searchReadyShapes({
      organizationId: orgId,
      internalOnly: true,
    });
    expect(internalOnly).toHaveLength(1);
    expect(internalOnly[0]?.id).toBe(orgShape.id);
    expect(internalOnly[0]?.scope).toBe("org");
  });
});
