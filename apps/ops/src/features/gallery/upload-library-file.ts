import type { LibraryStore, LibraryUploadRole } from "@/services/types";

export async function uploadLibraryFile(args: {
  library: LibraryStore;
  itemId: string;
  role: LibraryUploadRole;
  file: File;
  onProgress: (progress: number) => void;
}): Promise<void> {
  const { library, itemId, role, file, onProgress } = args;

  onProgress(5);
  const target = await library.createUploadTarget({
    id: itemId,
    role,
    contentType: file.type || "application/octet-stream",
    byteSize: file.size,
  });
  onProgress(20);

  if (target.uploadUrl.startsWith("memory://")) {
    // Memory adapter (local/dev without Azure): browser cannot PUT; send bytes through the API.
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    const dataBase64 = btoa(binary);
    onProgress(60);
    await library.putAndFinalize({
      id: itemId,
      role,
      key: target.key,
      contentType: file.type || "application/octet-stream",
      dataBase64,
    });
    onProgress(100);
    return;
  }

  const response = await fetch(target.uploadUrl, {
    method: target.method,
    headers: target.headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${String(response.status)})`);
  }
  onProgress(85);

  await library.finalizeUpload({
    id: itemId,
    role,
    key: target.key,
    contentType: file.type || "application/octet-stream",
  });
  onProgress(100);
}
