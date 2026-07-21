import { AppError } from "@deck-pack/errors";

export class InsertQuotaExceededError extends AppError {
  readonly assetType: string;

  constructor(assetType: string, options?: { cause?: unknown }) {
    super(
      "INVALID_STATE",
      `Monthly insert limit reached for ${assetType}. Upgrade your plan to continue.`,
      400,
      options,
    );
    this.name = "InsertQuotaExceededError";
    this.assetType = assetType;
  }
}

export class UsageNoSubscriptionError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("INVALID_STATE", "No active subscription for this workspace", 400, options);
    this.name = "UsageNoSubscriptionError";
  }
}

export class AssetInsertionFailedError extends AppError {
  constructor(options?: { cause?: unknown }) {
    super("INTERNAL", "Failed to track asset insertion", 500, options);
    this.name = "AssetInsertionFailedError";
  }
}
