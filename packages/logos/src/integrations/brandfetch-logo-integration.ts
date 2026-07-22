import type { BrandfetchClient } from "@deck-pack/integrations/brandfetch";
import {
  BrandfetchNotFoundError,
  BrandfetchRateLimitError,
} from "@deck-pack/integrations/brandfetch";

import { LogoNotFoundError, LogoRateLimitError } from "../domain/errors";
import type { LogoDetailsResponse, LogoSearchResponse } from "../domain/logo";
import type { LogoIntegrationPort } from "./logo-integration-port";
import { mapLogoDetailsResponse, mapLogoSearchResponse } from "./mappers";

export class BrandfetchLogoIntegration implements LogoIntegrationPort {
  constructor(private readonly client: BrandfetchClient) {}

  async search(query: string, options?: { limit?: number }): Promise<LogoSearchResponse> {
    try {
      const response = await this.client.searchBrands({ query, limit: options?.limit });
      return mapLogoSearchResponse(response);
    } catch (error) {
      throw this.mapProviderError(error, query);
    }
  }

  async getDetails(identifier: string): Promise<LogoDetailsResponse> {
    try {
      const response = await this.client.getBrandDetails({ identifier });
      return mapLogoDetailsResponse(response);
    } catch (error) {
      throw this.mapProviderError(error, identifier);
    }
  }

  private mapProviderError(error: unknown, identifier: string): never {
    if (error instanceof BrandfetchNotFoundError) {
      throw new LogoNotFoundError(identifier, { cause: error });
    }
    if (error instanceof BrandfetchRateLimitError) {
      throw new LogoRateLimitError({ cause: error });
    }
    throw error;
  }
}
