import type { LogoDetailsResponse } from "../domain/logo";
import type { LogoIntegrationPort } from "../integrations/logo-integration-port";

export type GetLogoDetailsInput = {
  externalId: string;
};

export class GetLogoDetails {
  constructor(private readonly logoIntegration: LogoIntegrationPort) {}

  async execute(input: GetLogoDetailsInput): Promise<LogoDetailsResponse> {
    return this.logoIntegration.getDetails(input.externalId);
  }
}
