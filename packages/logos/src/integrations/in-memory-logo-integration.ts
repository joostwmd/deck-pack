import { LogoNotFoundError } from "../domain/errors";
import type { LogoDetailsResponse, LogoSearchResponse } from "../domain/logo";
import type { LogoIntegrationPort } from "./logo-integration-port";

export class InMemoryLogoIntegration implements LogoIntegrationPort {
  private readonly seeded: LogoDetailsResponse[] = [];

  seed(details: LogoDetailsResponse[]): void {
    this.seeded.push(...details);
  }

  async search(query: string): Promise<LogoSearchResponse> {
    const normalized = query.toLowerCase();
    return {
      results: this.seeded
        .filter(
          (logo) =>
            logo.name.toLowerCase().includes(normalized) ||
            logo.id.toLowerCase().includes(normalized),
        )
        .map((logo) => ({
          id: logo.id,
          imageUrl: logo.imageUrl,
          name: logo.name,
        })),
    };
  }

  async getDetails(identifier: string): Promise<LogoDetailsResponse> {
    const found = this.seeded.find((logo) => logo.id === identifier);
    if (!found) {
      throw new LogoNotFoundError(identifier);
    }
    return found;
  }
}
