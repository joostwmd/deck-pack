import { IconNotFoundError } from "../domain/errors";
import type { IconDetailsResponse, IconSearchResponse } from "../domain/icon";
import type { IconIntegrationPort } from "./icon-integration-port";

export class InMemoryIconIntegration implements IconIntegrationPort {
  private readonly seeded: IconDetailsResponse[] = [];

  seed(details: IconDetailsResponse[]): void {
    this.seeded.push(...details);
  }

  async search(query: string): Promise<IconSearchResponse> {
    const normalized = query.toLowerCase();
    return {
      results: this.seeded
        .filter(
          (icon) =>
            icon.name.toLowerCase().includes(normalized) ||
            icon.id.toLowerCase().includes(normalized),
        )
        .map((icon) => ({
          id: icon.id,
          imageUrl: icon.imageUrl,
          name: icon.name,
        })),
    };
  }

  async getDetails(identifier: string): Promise<IconDetailsResponse> {
    const found = this.seeded.find((icon) => icon.id === identifier);
    if (!found) {
      throw new IconNotFoundError(identifier);
    }
    return found;
  }
}
