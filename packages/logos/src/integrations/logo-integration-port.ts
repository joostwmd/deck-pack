import type { LogoDetailsResponse, LogoSearchResponse } from "../domain/logo";

export type LogoIntegrationPort = {
  search(query: string, options?: { limit?: number }): Promise<LogoSearchResponse>;
  getDetails(identifier: string): Promise<LogoDetailsResponse>;
};
