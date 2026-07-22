import type { ObjectStorage } from "@deck-pack/storage";

const DISCOVERY_URL_TTL_SECONDS = 15 * 60;

export async function createDiscoveryDownloadUrl(
  storage: ObjectStorage,
  blobPath: string,
): Promise<string | null> {
  try {
    const download = await storage.createDownloadUrl({
      key: blobPath,
      expiresInSeconds: DISCOVERY_URL_TTL_SECONDS,
    });
    return download.url;
  } catch {
    return null;
  }
}

export async function mapWithSignedUrls<T>(
  rows: T[],
  storage: ObjectStorage,
  getBlobPath: (row: T) => string,
): Promise<Array<T & { signedUrl: string }>> {
  const results: Array<T & { signedUrl: string }> = [];
  for (const row of rows) {
    const url = await createDiscoveryDownloadUrl(storage, getBlobPath(row));
    if (url) {
      results.push({ ...row, signedUrl: url });
    }
  }
  return results;
}
