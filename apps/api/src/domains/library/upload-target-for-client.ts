import { env } from "@deck-pack/env/server";
import type { UploadTarget } from "@deck-pack/storage";

/**
 * Browser PUT to Azure requires CORS on the storage account. In local dev we
 * route uploads through putAndFinalize (proxy) while still writing via the
 * configured ObjectStorage adapter (e.g. Azure SDK server-side).
 */
export function uploadTargetForClient(target: UploadTarget): UploadTarget {
  if (env.NODE_ENV === "development" && target.mode === "direct") {
    return { ...target, mode: "proxy" };
  }
  return target;
}
