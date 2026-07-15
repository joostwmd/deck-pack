import { assetInsertions } from "../schema/asset-insertions";
import type { Transaction } from "../transaction";

export type InsertAssetInsertionInput = {
  userId: string;
  assetType: string;
  externalId: string;
  client: string;
  metadata?: Record<string, unknown>;
};

export async function insertAssetInsertion({
  tx,
  input,
}: {
  tx: Transaction;
  input: InsertAssetInsertionInput;
}) {
  const [row] = await tx
    .insert(assetInsertions)
    .values({
      userId: input.userId,
      assetType: input.assetType,
      externalId: input.externalId,
      client: input.client,
      metadata: input.metadata ?? {},
    })
    .returning({
      id: assetInsertions.id,
      userId: assetInsertions.userId,
      assetType: assetInsertions.assetType,
      externalId: assetInsertions.externalId,
      client: assetInsertions.client,
      metadata: assetInsertions.metadata,
      createdAt: assetInsertions.createdAt,
    });

  return row;
}
