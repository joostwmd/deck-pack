import type { NounProjectClient } from "@deck-pack/integrations/noun-project";
import {
  NounProjectNotFoundError,
  NounProjectRateLimitError,
} from "@deck-pack/integrations/noun-project";

import { IconNotFoundError, IconRateLimitError } from "../domain/errors";
import type { IconDetailsResponse, IconSearchResponse } from "../domain/icon";
import type { IconIntegrationPort } from "./icon-integration-port";
import { mapIconDetailsResponse, mapIconSearchResponse } from "./mappers";

export class NounProjectIconIntegration implements IconIntegrationPort {
  constructor(private readonly client: NounProjectClient) {}

  async search(query: string): Promise<IconSearchResponse> {
    try {
      const response = await this.client.searchIcons({ query });
      return mapIconSearchResponse(response);
    } catch (error) {
      throw this.mapProviderError(error, query);
    }
  }

  async getDetails(identifier: string): Promise<IconDetailsResponse> {
    try {
      const response = await this.client.getIconDetails({ id: identifier });
      return mapIconDetailsResponse(response);
    } catch (error) {
      throw this.mapProviderError(error, identifier);
    }
  }

  private mapProviderError(error: unknown, identifier: string): never {
    if (error instanceof NounProjectNotFoundError) {
      throw new IconNotFoundError(identifier, { cause: error });
    }
    if (error instanceof NounProjectRateLimitError) {
      throw new IconRateLimitError({ cause: error });
    }
    throw error;
  }
}
