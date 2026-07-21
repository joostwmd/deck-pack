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
  ArchiveGalleryItem,
  CreateGalleryItem,
  GetGalleryItem,
  InMemoryGalleryRepository,
  PublishGalleryItem,
  PutAndFinalizeGalleryUpload,
} from "@deck-pack/gallery";
import { InvalidStateError, NotFoundError } from "@deck-pack/errors";
import { InMemoryObjectStorage } from "@deck-pack/storage";

const globalScope = { kind: "global" as const };

function seedShape(
  repo: InMemoryGalleryRepository,
  overrides?: { status?: "pending" | "ready" | "archived"; withSvg?: boolean },
) {
  const now = new Date();
  const id = "shape-1";
  repo.seed({
    items: [
      {
        id,
        assetClass: "shape",
        scope: "global",
        organizationId: null,
        status: overrides?.status ?? "pending",
        displayName: "Arrow",
        aliases: [],
        createdAt: now,
        updatedAt: now,
        flag: null,
        shape: {
          category: "Arrows",
          svgFile: overrides?.withSvg
            ? {
                id: "file-1",
                blobPath: "global/shape/shape-1/svg.svg",
                contentType: "image/svg+xml",
                byteSize: 10,
              }
            : null,
        },
        slide: null,
        previewBlobPath: overrides?.withSvg ? "global/shape/shape-1/svg.svg" : null,
        previewContentType: overrides?.withSvg ? "image/svg+xml" : null,
      },
    ],
  });
  return id;
}

describe("gallery use-cases", () => {
  it("creates and gets a gallery item", async () => {
    const repo = new InMemoryGalleryRepository();
    const created = await new CreateGalleryItem(repo).execute(globalScope, {
      assetClass: "shape",
      displayName: "Chevron",
      category: "Arrows",
      createdByUserId: "user-1",
    });
    const got = await new GetGalleryItem(repo).execute(globalScope, { id: created.id });
    expect(got.displayName).toBe("Chevron");
    expect(got.assetClass).toBe("shape");
  });

  it("throws NotFoundError for missing item", async () => {
    const repo = new InMemoryGalleryRepository();
    await expect(
      new GetGalleryItem(repo).execute(globalScope, { id: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects create without category for shapes", async () => {
    const repo = new InMemoryGalleryRepository();
    await expect(
      new CreateGalleryItem(repo).execute(globalScope, {
        assetClass: "shape",
        displayName: "X",
        createdByUserId: null,
      }),
    ).rejects.toMatchObject({ message: "Category is required" });
  });

  it("publishes when required files exist", async () => {
    const repo = new InMemoryGalleryRepository();
    const id = seedShape(repo, { withSvg: true });
    const published = await new PublishGalleryItem(repo).execute(globalScope, { id });
    expect(published.status).toBe("ready");
  });

  it("rejects publish when files missing", async () => {
    const repo = new InMemoryGalleryRepository();
    const id = seedShape(repo, { withSvg: false });
    await expect(new PublishGalleryItem(repo).execute(globalScope, { id })).rejects.toBeInstanceOf(
      InvalidStateError,
    );
  });

  it("archives an item", async () => {
    const repo = new InMemoryGalleryRepository();
    const id = seedShape(repo);
    const archived = await new ArchiveGalleryItem(repo).execute(globalScope, { id });
    expect(archived.status).toBe("archived");
  });

  it("putAndFinalize attaches svg for shape", async () => {
    const repo = new InMemoryGalleryRepository();
    const storage = new InMemoryObjectStorage();
    const id = seedShape(repo);
    const key = "global/shape/shape-1/svg.svg";
    const dataBase64 = Buffer.from("<svg></svg>", "utf8").toString("base64");

    const detail = await new PutAndFinalizeGalleryUpload(repo, storage).execute(globalScope, {
      id,
      role: "svg",
      key,
      contentType: "image/svg+xml",
      dataBase64,
    });

    expect(detail.shape?.svgFile?.blobPath).toBe(key);
  });

  it("putAndFinalize deletes the blob when attach fails", async () => {
    const repo = new InMemoryGalleryRepository();
    const storage = new InMemoryObjectStorage();
    const id = seedShape(repo);
    const key = "global/shape/shape-1/svg.svg";
    const dataBase64 = Buffer.from("<svg></svg>", "utf8").toString("base64");

    vi.spyOn(repo, "insertFile").mockRejectedValueOnce(new Error("db attach failed"));

    await expect(
      new PutAndFinalizeGalleryUpload(repo, storage).execute(globalScope, {
        id,
        role: "svg",
        key,
        contentType: "image/svg+xml",
        dataBase64,
      }),
    ).rejects.toThrow("db attach failed");

    expect(await storage.head(key)).toBeNull();
  });
});
