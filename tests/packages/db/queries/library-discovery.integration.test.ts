import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getReadyFlagDetails,
  searchReadyFlags,
  searchReadyShapes,
  searchReadySlides,
} from "@deck-pack/db/queries/libraryDiscovery";
import {
  attachFileToLibraryItem,
  createGlobalLibraryItem,
  createOrgLibraryItem,
  insertLibraryFile,
  setGlobalLibraryItemStatus,
  setOrgLibraryItemStatus,
} from "@deck-pack/db/queries/libraryAdmin";
import { organization } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx } from "@deck-pack/db/transaction";

describe("library discovery (integration)", () => {
  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await tx.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, library_item_names, library_items, files RESTART IDENTITY CASCADE`,
      ),
    );
  });

  it("returns only ready shapes with svg attached", async () => {
    const ready = await createGlobalLibraryItem({
      tx,
      input: {
        assetClass: "shape",
        displayName: "Chevron",
        category: "Arrows",
        createdByUserId: null,
      },
    });
    const svgFile = await insertLibraryFile({
      tx,
      blobPath: `global/shape/${ready.id}/shape.svg`,
      contentType: "image/svg+xml",
      byteSize: 10,
    });
    await attachFileToLibraryItem({
      tx,
      libraryItemId: ready.id,
      role: "svg",
      fileId: svgFile.id,
    });
    await setGlobalLibraryItemStatus({ tx, id: ready.id, status: "ready" });

    const pending = await createGlobalLibraryItem({
      tx,
      input: {
        assetClass: "shape",
        displayName: "Draft shape",
        category: "Arrows",
        createdByUserId: null,
      },
    });
    await setGlobalLibraryItemStatus({ tx, id: pending.id, status: "pending" });

    const shapes = await searchReadyShapes({ tx });
    expect(shapes).toHaveLength(1);
    expect(shapes[0]?.id).toBe(ready.id);
    expect(shapes[0]?.displayName).toBe("Chevron");
  });

  it("filters shapes by category", async () => {
    for (const [displayName, category] of [
      ["Arrow A", "Arrows"],
      ["Banner A", "Banners & Ribbons"],
    ] as const) {
      const created = await createGlobalLibraryItem({
        tx,
        input: {
          assetClass: "shape",
          displayName,
          category,
          createdByUserId: null,
        },
      });
      const svgFile = await insertLibraryFile({
        tx,
        blobPath: `global/shape/${created.id}/shape.svg`,
        contentType: "image/svg+xml",
        byteSize: 10,
      });
      await attachFileToLibraryItem({
        tx,
        libraryItemId: created.id,
        role: "svg",
        fileId: svgFile.id,
      });
      await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });
    }

    const arrows = await searchReadyShapes({ tx, category: "Arrows" });
    expect(arrows).toHaveLength(1);
    expect(arrows[0]?.displayName).toBe("Arrow A");
  });

  it("filters slides by query, tags, and aspect ratio", async () => {
    const created = await createGlobalLibraryItem({
      tx,
      input: {
        assetClass: "slide",
        displayName: "Title Hero",
        category: "Intro",
        aspectRatio: "16:9",
        aliases: ["title", "hero"],
        createdByUserId: null,
      },
    });
    const presentation = await insertLibraryFile({
      tx,
      blobPath: `global/slide/${created.id}/presentation.pptx`,
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      byteSize: 10,
    });
    const thumbnail = await insertLibraryFile({
      tx,
      blobPath: `global/slide/${created.id}/thumbnail.png`,
      contentType: "image/png",
      byteSize: 4,
    });
    await attachFileToLibraryItem({
      tx,
      libraryItemId: created.id,
      role: "presentation",
      fileId: presentation.id,
    });
    await attachFileToLibraryItem({
      tx,
      libraryItemId: created.id,
      role: "thumbnail",
      fileId: thumbnail.id,
    });
    await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });

    const byQuery = await searchReadySlides({ tx, query: "hero", sort: "relevance" });
    expect(byQuery).toHaveLength(1);

    const byTag = await searchReadySlides({
      tx,
      tags: ["title"],
      aspectRatio: "16:9",
      sort: "relevance",
    });
    expect(byTag).toHaveLength(1);
    expect(byTag[0]?.aliases).toEqual(expect.arrayContaining(["title", "hero"]));

    const noMatch = await searchReadySlides({ tx, query: "zzzz-no-match" });
    expect(noMatch).toHaveLength(0);
  });

  it("searches flags by display name, code, and alias", async () => {
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

    for (const role of ["rectangle", "square", "circle"] as const) {
      const file = await insertLibraryFile({
        tx,
        blobPath: `global/flag/${created.id}/${role}.png`,
        contentType: "image/png",
        byteSize: 4,
      });
      await attachFileToLibraryItem({
        tx,
        libraryItemId: created.id,
        role,
        fileId: file.id,
      });
    }
    await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });

    expect(await searchReadyFlags({ tx, query: "united" })).toHaveLength(1);
    expect(await searchReadyFlags({ tx, query: "us" })).toHaveLength(1);
    expect(await searchReadyFlags({ tx, query: "usa" })).toHaveLength(1);

    const details = await getReadyFlagDetails({ tx, id: created.id });
    expect(details?.variants).toHaveLength(3);
  });

  it("merges global and org shapes for an organization and exposes scope", async () => {
    const orgId = crypto.randomUUID();
    const now = new Date();

    await tx.insert(organization).values({
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
      const created =
        scope === "global"
          ? await createGlobalLibraryItem({
              tx,
              input: {
                assetClass: "shape",
                displayName,
                category: "Arrows",
                createdByUserId: null,
              },
            })
          : await createOrgLibraryItem({
              tx,
              input: {
                organizationId: orgId,
                assetClass: "shape",
                displayName,
                category: "Arrows",
                createdByUserId: null,
              },
            });

      const svgFile = await insertLibraryFile({
        tx,
        blobPath: `${scope}/shape/${created.id}/shape.svg`,
        contentType: "image/svg+xml",
        byteSize: 10,
      });
      await attachFileToLibraryItem({
        tx,
        libraryItemId: created.id,
        role: "svg",
        fileId: svgFile.id,
      });

      if (scope === "global") {
        await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });
      } else {
        await setOrgLibraryItemStatus({
          tx,
          organizationId: orgId,
          id: created.id,
          status: "ready",
        });
      }

      return created;
    }

    const globalShape = await seedReadyShape("Global Arrow", "global");
    const orgShape = await seedReadyShape("Internal Arrow", "org");

    const merged = await searchReadyShapes({ tx, organizationId: orgId });
    expect(merged).toHaveLength(2);
    expect(merged.map((row) => row.id).sort()).toEqual([globalShape.id, orgShape.id].sort());
    expect(merged.find((row) => row.id === globalShape.id)?.scope).toBe("global");
    expect(merged.find((row) => row.id === orgShape.id)?.scope).toBe("org");

    const internalOnly = await searchReadyShapes({
      tx,
      organizationId: orgId,
      internalOnly: true,
    });
    expect(internalOnly).toHaveLength(1);
    expect(internalOnly[0]?.id).toBe(orgShape.id);
    expect(internalOnly[0]?.scope).toBe("org");
  });
});
