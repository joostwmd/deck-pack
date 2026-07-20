import { uploadLibraryFile as uploadLibraryFileShared } from "@deck-pack/library-admin/upload-library-file";
import type { LibraryStore, LibraryUploadRole } from "@/services/types";

export async function uploadLibraryFile(args: {
  library: LibraryStore;
  itemId: string;
  role: LibraryUploadRole;
  file: File;
  onProgress: (progress: number) => void;
}): Promise<void> {
  return uploadLibraryFileShared(args);
}
