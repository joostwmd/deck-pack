import type { IconDetailsResponse, IconSearchResponse } from "../domain/icon";

export type IconIntegrationPort = {
  search(query: string): Promise<IconSearchResponse>;
  getDetails(identifier: string): Promise<IconDetailsResponse>;
};
