import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import type { Database } from "../transaction";
import * as schema from "../schema";
import { splitMigrationStatements } from "./split-migration-statements";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const migrationsDir = path.join(packageRoot, "migrations");

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(migrationsDir);
  return entries.filter((entry) => entry.endsWith(".sql")).sort();
}

async function applyMigration(client: PGlite, fileName: string): Promise<void> {
  const migrationPath = path.join(migrationsDir, fileName);
  const sql = await readFile(migrationPath, "utf8");

  for (const statement of splitMigrationStatements(sql)) {
    await client.exec(statement);
  }
}

export async function createPgliteTestDb(): Promise<Database> {
  const client = new PGlite();
  const migrationFiles = await listMigrationFiles();

  for (const fileName of migrationFiles) {
    await applyMigration(client, fileName);
  }

  return drizzle(client, { schema }) as unknown as Database;
}
