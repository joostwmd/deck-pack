import {
  attachFileToLibraryItem,
  createGlobalLibraryItem,
  insertLibraryFile,
  setGlobalLibraryItemStatus,
} from "@deck-pack/db/queries/libraryAdmin";
import type { Transaction } from "@deck-pack/db/transaction";
import type { MemoryObjectStorage } from "@deck-pack/storage";

const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function seedBlob(
  storage: MemoryObjectStorage,
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

export async function seedReadyShape(
  tx: Transaction,
  storage: MemoryObjectStorage,
  input: {
    displayName: string;
    category: string;
    aliases?: string[];
  },
): Promise<{ id: string; svgBlobPath: string }> {
  const created = await createGlobalLibraryItem({
    tx,
    input: {
      assetClass: "shape",
      displayName: input.displayName,
      aliases: input.aliases ?? [],
      category: input.category,
      createdByUserId: null,
    },
  });

  const svgBlobPath = `global/shape/${created.id}/shape.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
  const body = Buffer.from(svg, "utf8");
  seedBlob(storage, svgBlobPath, "image/svg+xml", body);

  const file = await insertLibraryFile({
    tx,
    blobPath: svgBlobPath,
    contentType: "image/svg+xml",
    byteSize: body.byteLength,
  });
  await attachFileToLibraryItem({
    tx,
    libraryItemId: created.id,
    role: "svg",
    fileId: file.id,
  });
  await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });

  return { id: created.id, svgBlobPath };
}

export async function seedReadySlide(
  tx: Transaction,
  storage: MemoryObjectStorage,
  input: {
    displayName: string;
    category: string;
    aspectRatio: "16:9" | "4:3";
    aliases?: string[];
  },
): Promise<{ id: string }> {
  const created = await createGlobalLibraryItem({
    tx,
    input: {
      assetClass: "slide",
      displayName: input.displayName,
      aliases: input.aliases ?? [],
      category: input.category,
      aspectRatio: input.aspectRatio,
      createdByUserId: null,
    },
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

  const presentationFile = await insertLibraryFile({
    tx,
    blobPath: presentationBlobPath,
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    byteSize: presentationBody.byteLength,
  });
  const thumbnailFile = await insertLibraryFile({
    tx,
    blobPath: thumbnailBlobPath,
    contentType: "image/png",
    byteSize: PNG_BYTES.byteLength,
  });

  await attachFileToLibraryItem({
    tx,
    libraryItemId: created.id,
    role: "presentation",
    fileId: presentationFile.id,
  });
  await attachFileToLibraryItem({
    tx,
    libraryItemId: created.id,
    role: "thumbnail",
    fileId: thumbnailFile.id,
  });
  await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });

  return { id: created.id };
}

export async function seedReadyFlag(
  tx: Transaction,
  storage: MemoryObjectStorage,
  input: {
    displayName: string;
    code: string;
    aliases?: string[];
  },
): Promise<{ id: string }> {
  const created = await createGlobalLibraryItem({
    tx,
    input: {
      assetClass: "flag",
      displayName: input.displayName,
      aliases: input.aliases ?? [],
      flagCode: input.code,
      createdByUserId: null,
    },
  });

  for (const role of ["rectangle", "square", "circle"] as const) {
    const blobPath = `global/flag/${created.id}/${role}.png`;
    seedBlob(storage, blobPath, "image/png", PNG_BYTES);
    const file = await insertLibraryFile({
      tx,
      blobPath,
      contentType: "image/png",
      byteSize: PNG_BYTES.byteLength,
    });
    await attachFileToLibraryItem({
      tx,
      libraryItemId: created.id,
      role,
      fileId: file.id,
    });
  }

  await setGlobalLibraryItemStatus({ tx, id: created.id, status: "ready" });

  return { id: created.id };
}

export async function seedPendingShape(
  tx: Transaction,
  input: { displayName: string; category: string },
): Promise<{ id: string }> {
  const created = await createGlobalLibraryItem({
    tx,
    input: {
      assetClass: "shape",
      displayName: input.displayName,
      category: input.category,
      createdByUserId: null,
    },
  });
  return { id: created.id };
}
