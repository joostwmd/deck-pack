export { createDb, db } from "./client";
export type { Database, Schema, Transaction, TransactionOptions } from "./transaction";
export { bindUnitOfWork, createLegacyTxProxy, UnitOfWork, withTransaction } from "./transaction";

import { db } from "./client";
import { bindUnitOfWork, UnitOfWork, tx } from "./transaction";

export const unitOfWork = new UnitOfWork(db);
bindUnitOfWork(unitOfWork);

export { tx };
