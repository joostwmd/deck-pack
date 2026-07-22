import type { LogoSearchResponse } from "../domain/logo";
import type { LogoIntegrationPort } from "../integrations/logo-integration-port";

export type SearchLogosInput = {
  query: string;
  limit?: number;
};

export class SearchLogos {
  constructor(private readonly logoIntegration: LogoIntegrationPort) {}

  async execute(input: SearchLogosInput): Promise<LogoSearchResponse> {
    return this.logoIntegration.search(input.query, { limit: input.limit });
  }
}
