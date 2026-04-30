import { env } from "@deck-pack/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}

export const db = createDb();

export { tx } from "./transaction";
export type { Transaction } from "./transaction";
