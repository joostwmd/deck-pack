import type { LibraryStore } from "@deck-pack/library-admin/types";

import { trpcClient } from "@/utils/trpc";

export function createOrgLibraryStore(): LibraryStore {
  const api = trpcClient.gallery.org;
  return {
    list: (input) => api.list.query(input),
    get: (input) => api.get.query(input),
    create: (input) => api.create.mutate(input as Parameters<typeof api.create.mutate>[0]),
    update: (input) => api.update.mutate(input as Parameters<typeof api.update.mutate>[0]),
    publish: (input) => api.publish.mutate(input),
    unpublish: (input) => api.unpublish.mutate(input),
    archive: (input) => api.archive.mutate(input),
    createUploadTarget: (input) => api.createUploadTarget.mutate(input),
    finalizeUpload: (input) => api.finalizeUpload.mutate(input),
    putAndFinalize: (input) => api.putAndFinalize.mutate(input),
  };
}
