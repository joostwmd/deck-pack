import type { PhotoSearchInput, PhotoSearchResponse } from "../domain/photo";

export type PhotoIntegrationPort = {
  search(input: PhotoSearchInput): Promise<PhotoSearchResponse>;
};
