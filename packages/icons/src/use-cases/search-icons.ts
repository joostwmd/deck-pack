import type { IconSearchResponse } from "../domain/icon";
import type { IconIntegrationPort } from "../integrations/icon-integration-port";

export type SearchIconsInput = {
  query: string;
};

export class SearchIcons {
  constructor(private readonly iconIntegration: IconIntegrationPort) {}

  async execute(input: SearchIconsInput): Promise<IconSearchResponse> {
    return this.iconIntegration.search(input.query);
  }
}
