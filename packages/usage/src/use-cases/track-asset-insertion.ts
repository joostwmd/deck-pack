import {
  AssetInsertionFailedError,
  InsertQuotaExceededError,
  UsageNoSubscriptionError,
} from "../domain/errors";
import type { UsageRepository } from "../repositories/usage-repository";

export class TrackAssetInsertion {
  constructor(private readonly repo: UsageRepository) {}

  async execute(input: {
    organizationId: string;
    userId: string;
    assetType: string;
    externalId: string;
    client: "office" | "web";
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const allowed = await this.repo.assertInsertAllowed({
      organizationId: input.organizationId,
      assetType: input.assetType,
    });

    if (!allowed.ok) {
      if (allowed.reason === "quota_exceeded") {
        throw new InsertQuotaExceededError(allowed.assetType);
      }
      throw new UsageNoSubscriptionError();
    }

    const row = await this.repo.insertAssetInsertion({
      organizationId: input.organizationId,
      userId: input.userId,
      assetType: input.assetType,
      externalId: input.externalId,
      client: input.client,
      metadata: input.metadata,
    });

    if (!row) {
      throw new AssetInsertionFailedError();
    }

    return { id: row.id };
  }
}
