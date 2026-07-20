import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "@deck-pack/env/server";
import pg from "pg";

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let ensured = false;

async function tableExists(pool: pg.Pool, tableName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName],
  );

  return Boolean(result.rows[0]?.exists);
}

async function applyMigration(pool: pg.Pool, fileName: string): Promise<void> {
  const migrationPath = path.join(packageRoot, "migrations", fileName);
  const sql = await readFile(migrationPath, "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

export async function ensureMigrationsApplied(): Promise<void> {
  if (ensured) return;

  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

  try {
    if (!(await tableExists(pool, "brand_profiles"))) {
      await applyMigration(pool, "0001_brand_profiles.sql");
    }

    if (!(await tableExists(pool, "agenda_instances"))) {
      await applyMigration(pool, "0002_agendas.sql");
    }

    if (!(await tableExists(pool, "shortcut_overrides"))) {
      await applyMigration(pool, "0003_shortcut_overrides.sql");
    }

    if (!(await tableExists(pool, "library_items"))) {
      await applyMigration(pool, "0008_library_assets.sql");
    }

    ensured = true;
  } finally {
    await pool.end();
  }
}
