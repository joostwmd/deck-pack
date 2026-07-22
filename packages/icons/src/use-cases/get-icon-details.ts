import type { IconDetailsResponse } from "../domain/icon";
import type { IconIntegrationPort } from "../integrations/icon-integration-port";

export type GetIconDetailsInput = {
  externalId: string;
};

export class GetIconDetails {
  constructor(private readonly iconIntegration: IconIntegrationPort) {}

  async execute(input: GetIconDetailsInput): Promise<IconDetailsResponse> {
    return this.iconIntegration.getDetails(input.externalId);
  }
}
