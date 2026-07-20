import type { LibraryStore } from "@deck-pack/library-admin/types";

import { trpcClient } from "@/utils/trpc";

export function createOrgLibraryStore(): LibraryStore {
  const api = trpcClient.library.org;
  return {
    list: (input) => api.list.query(input),
    get: (input) => api.get.query(input),
    create: (input) => api.create.mutate(input),
    update: (input) => api.update.mutate(input),
    publish: (input) => api.publish.mutate(input),
    unpublish: (input) => api.unpublish.mutate(input),
    archive: (input) => api.archive.mutate(input),
    createUploadTarget: (input) => api.createUploadTarget.mutate(input),
    finalizeUpload: (input) => api.finalizeUpload.mutate(input),
    putAndFinalize: (input) => api.putAndFinalize.mutate(input),
  };
}
