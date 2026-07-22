import type { GalleryStore, GalleryUploadRole, UploadTarget } from "./gallery-store";

function fileToBase64(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  });
}

async function uploadViaProxy(args: {
  gallery: GalleryStore;
  itemId: string;
  role: GalleryUploadRole;
  file: File;
  target: UploadTarget;
  onProgress: (progress: number) => void;
}): Promise<void> {
  const { gallery, itemId, role, file, target, onProgress } = args;
  const contentType = file.type || "application/octet-stream";

  onProgress(60);
  const dataBase64 = await fileToBase64(file);
  await gallery.putAndFinalize({
    id: itemId,
    role,
    key: target.key,
    contentType,
    dataBase64,
  });
  onProgress(100);
}

async function uploadViaDirect(args: {
  gallery: GalleryStore;
  itemId: string;
  role: GalleryUploadRole;
  file: File;
  target: UploadTarget;
  onProgress: (progress: number) => void;
}): Promise<void> {
  const { gallery, itemId, role, file, target, onProgress } = args;
  const contentType = file.type || "application/octet-stream";

  const response = await fetch(target.uploadUrl, {
    method: target.method,
    headers: target.headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${String(response.status)})`);
  }
  onProgress(85);

  await gallery.finalizeUpload({
    id: itemId,
    role,
    key: target.key,
    contentType,
  });
  onProgress(100);
}

export async function uploadGalleryFile(args: {
  gallery: GalleryStore;
  itemId: string;
  role: GalleryUploadRole;
  file: File;
  onProgress: (progress: number) => void;
}): Promise<void> {
  const { gallery, itemId, role, file, onProgress } = args;

  onProgress(5);
  const target = await gallery.createUploadTarget({
    id: itemId,
    role,
    contentType: file.type || "application/octet-stream",
    byteSize: file.size,
  });
  onProgress(20);

  if (target.mode === "proxy") {
    await uploadViaProxy({ gallery, itemId, role, file, target, onProgress });
    return;
  }

  await uploadViaDirect({ gallery, itemId, role, file, target, onProgress });
}
