import type { UnitOfWork } from "@deck-pack/db";
import { DrizzleGalleryRepository } from "@deck-pack/gallery/repositories/gallery-repository";
import type { InMemoryObjectStorage } from "@deck-pack/storage";

const GLOBAL = { kind: "global" as const };

const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function seedBlob(
  storage: InMemoryObjectStorage,
  blobPath: string,
  contentType: string,
  body: Buffer,
): void {
  storage.seed(blobPath, {
    contentType,
    byteSize: body.byteLength,
    body: new Uint8Array(body),
  });
}

function galleryRepo(uow: UnitOfWork) {
  return new DrizzleGalleryRepository(uow);
}

export async function seedReadyShape(
  uow: UnitOfWork,
  storage: InMemoryObjectStorage,
  input: {
    displayName: string;
    category: string;
    aliases?: string[];
  },
): Promise<{ id: string; svgBlobPath: string }> {
  const repo = galleryRepo(uow);
  const created = await repo.create(GLOBAL, {
    assetClass: "shape",
    displayName: input.displayName,
    aliases: input.aliases ?? [],
    category: input.category as "Arrows",
    createdByUserId: null,
  });

  const svgBlobPath = `global/shape/${created.id}/shape.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
  const body = Buffer.from(svg, "utf8");
  seedBlob(storage, svgBlobPath, "image/svg+xml", body);

  const file = await repo.insertFile({
    blobPath: svgBlobPath,
    contentType: "image/svg+xml",
    byteSize: body.byteLength,
  });
  await repo.attachFile({
    galleryItemId: created.id,
    role: "svg",
    fileId: file.id,
  });
  await repo.setStatus(GLOBAL, created.id, "ready");

  return { id: created.id, svgBlobPath };
}

export async function seedReadySlide(
  uow: UnitOfWork,
  storage: InMemoryObjectStorage,
  input: {
    displayName: string;
    category: string;
    aspectRatio: "16:9" | "4:3";
    aliases?: string[];
  },
): Promise<{ id: string }> {
  const repo = galleryRepo(uow);
  const created = await repo.create(GLOBAL, {
    assetClass: "slide",
    displayName: input.displayName,
    aliases: input.aliases ?? [],
    category: input.category as "Intro",
    aspectRatio: input.aspectRatio,
    createdByUserId: null,
  });

  const presentationBlobPath = `global/slide/${created.id}/presentation.pptx`;
  const thumbnailBlobPath = `global/slide/${created.id}/thumbnail.png`;
  const presentationBody = Buffer.from("fake-pptx", "utf8");
  seedBlob(
    storage,
    presentationBlobPath,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    presentationBody,
  );
  seedBlob(storage, thumbnailBlobPath, "image/png", PNG_BYTES);

  const presentationFile = await repo.insertFile({
    blobPath: presentationBlobPath,
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    byteSize: presentationBody.byteLength,
  });
  const thumbnailFile = await repo.insertFile({
    blobPath: thumbnailBlobPath,
    contentType: "image/png",
    byteSize: PNG_BYTES.byteLength,
  });

  await repo.attachFile({
    galleryItemId: created.id,
    role: "presentation",
    fileId: presentationFile.id,
  });
  await repo.attachFile({
    galleryItemId: created.id,
    role: "thumbnail",
    fileId: thumbnailFile.id,
  });
  await repo.setStatus(GLOBAL, created.id, "ready");

  return { id: created.id };
}

export async function seedReadyFlag(
  uow: UnitOfWork,
  storage: InMemoryObjectStorage,
  input: {
    displayName: string;
    code: string;
    aliases?: string[];
  },
): Promise<{ id: string }> {
  const repo = galleryRepo(uow);
  const created = await repo.create(GLOBAL, {
    assetClass: "flag",
    displayName: input.displayName,
    aliases: input.aliases ?? [],
    flagCode: input.code,
    createdByUserId: null,
  });

  for (const role of ["rectangle", "square", "circle"] as const) {
    const blobPath = `global/flag/${created.id}/${role}.png`;
    seedBlob(storage, blobPath, "image/png", PNG_BYTES);
    const file = await repo.insertFile({
      blobPath,
      contentType: "image/png",
      byteSize: PNG_BYTES.byteLength,
    });
    await repo.attachFile({
      galleryItemId: created.id,
      role,
      fileId: file.id,
    });
  }

  await repo.setStatus(GLOBAL, created.id, "ready");

  return { id: created.id };
}

export async function seedPendingShape(
  uow: UnitOfWork,
  input: { displayName: string; category: string },
): Promise<{ id: string }> {
  const created = await galleryRepo(uow).create(GLOBAL, {
    assetClass: "shape",
    displayName: input.displayName,
    category: input.category as "Arrows",
    createdByUserId: null,
  });
  return { id: created.id };
}
