import type { TokenCredential } from "@azure/identity";
import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
} from "@azure/storage-blob";

import { StorageConfigError, StorageProviderError } from "../errors";
import type {
  CreateDownloadUrlInput,
  CreateUploadTargetInput,
  DownloadUrl,
  ObjectInfo,
  ObjectKey,
  ObjectStorage,
  PutObjectInput,
  UploadTarget,
} from "../port";

export type AzureObjectStorageConfig = {
  accountName: string;
  containerName: string;
  /** Defaults to DefaultAzureCredential (managed identity / local Azure CLI). */
  credential?: TokenCredential;
  /**
   * Clock-skew cushion when minting user-delegation keys / SAS.
   * @default 300 (5 minutes)
   */
  clockSkewSeconds?: number;
};

function assertPositiveTtl(expiresInSeconds: number): void {
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error("expiresInSeconds must be a positive number");
  }
}

function blobUrl(accountName: string, containerName: string, key: ObjectKey): string {
  return `https://${accountName}.blob.core.windows.net/${containerName}/${key}`;
}

export function createAzureObjectStorage(config: AzureObjectStorageConfig): ObjectStorage {
  const accountName = config.accountName.trim();
  const containerName = config.containerName.trim();
  if (!accountName) {
    throw new StorageConfigError("Azure storage accountName is required");
  }
  if (!containerName) {
    throw new StorageConfigError("Azure storage containerName is required");
  }

  const credential = config.credential ?? new DefaultAzureCredential();
  const clockSkewMs = (config.clockSkewSeconds ?? 300) * 1000;
  const service = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
  const container = service.getContainerClient(containerName);

  async function mintSas(args: {
    key: ObjectKey;
    permissions: string;
    expiresInSeconds: number;
  }): Promise<{ url: string; expiresAt: Date }> {
    assertPositiveTtl(args.expiresInSeconds);

    const now = Date.now();
    const startsOn = new Date(now - clockSkewMs);
    const expiresAt = new Date(now + args.expiresInSeconds * 1000);

    try {
      const userDelegationKey = await service.getUserDelegationKey(startsOn, expiresAt);
      const sas = generateBlobSASQueryParameters(
        {
          containerName,
          blobName: args.key,
          permissions: BlobSASPermissions.parse(args.permissions),
          startsOn,
          expiresOn: expiresAt,
          protocol: SASProtocol.Https,
        },
        userDelegationKey,
        accountName,
      ).toString();

      return {
        url: `${blobUrl(accountName, containerName, args.key)}?${sas}`,
        expiresAt,
      };
    } catch (cause) {
      throw new StorageProviderError("Failed to mint Azure user-delegation SAS", { cause });
    }
  }

  return {
    async createUploadTarget(input: CreateUploadTargetInput): Promise<UploadTarget> {
      const { url, expiresAt } = await mintSas({
        key: input.key,
        permissions: "cw",
        expiresInSeconds: input.expiresInSeconds,
      });

      return {
        key: input.key,
        uploadUrl: url,
        method: "PUT",
        headers: {
          "Content-Type": input.contentType,
          "x-ms-blob-type": "BlockBlob",
        },
        expiresAt,
      };
    },

    async createDownloadUrl(input: CreateDownloadUrlInput): Promise<DownloadUrl> {
      const { url, expiresAt } = await mintSas({
        key: input.key,
        permissions: "r",
        expiresInSeconds: input.expiresInSeconds,
      });

      return {
        key: input.key,
        url,
        expiresAt,
      };
    },

    async head(key: ObjectKey): Promise<ObjectInfo | null> {
      const blob = container.getBlobClient(key);
      try {
        const properties = await blob.getProperties();
        return {
          key,
          contentType: properties.contentType,
          byteSize: properties.contentLength,
          etag: properties.etag,
        };
      } catch (cause) {
        const statusCode =
          cause && typeof cause === "object" && "statusCode" in cause
            ? (cause as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404) {
          return null;
        }
        throw new StorageProviderError(`Failed to head object: ${key}`, { cause });
      }
    },

    async delete(key: ObjectKey): Promise<void> {
      try {
        await container.getBlobClient(key).deleteIfExists();
      } catch (cause) {
        throw new StorageProviderError(`Failed to delete object: ${key}`, { cause });
      }
    },

    async put(input: PutObjectInput): Promise<ObjectInfo> {
      try {
        const blockBlob = container.getBlockBlobClient(input.key);
        await blockBlob.uploadData(input.body, {
          blobHTTPHeaders: { blobContentType: input.contentType },
        });
        const properties = await blockBlob.getProperties();
        return {
          key: input.key,
          contentType: properties.contentType ?? input.contentType,
          byteSize: properties.contentLength ?? input.body.byteLength,
          etag: properties.etag,
        };
      } catch (cause) {
        throw new StorageProviderError(`Failed to put object: ${input.key}`, { cause });
      }
    },
  };
}
