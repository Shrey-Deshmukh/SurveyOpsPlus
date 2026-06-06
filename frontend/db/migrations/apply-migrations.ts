import type { SQLiteDatabase } from "expo-sqlite";

import { migrationStatements } from "@/db/migrations/migration-statements";
import type { Migration } from "@/db/migrations/types";

async function ensureMigrationHistoryTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const migrationsToApply: Migration[] = [migrationStatements];
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  await ensureMigrationHistoryTable(db);

  const queriedSchemaMigrationRows = await db.getAllAsync<{
    version: number;
  }>(`SELECT version FROM schema_migrations;`);

  const appliedVersions = new Set(
    queriedSchemaMigrationRows.map((row) => row.version),
  );

  for (const migration of migrationsToApply) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    await applyMigration(db, migration);
    appliedVersions.add(migration.version);
  }
}

async function applyMigration(
  db: SQLiteDatabase,
  migration: Migration,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const statement of migration.statements) {
      await db.execAsync(statement);
    }

    await db.runAsync(
      `INSERT INTO schema_migrations (version) VALUES (?);`,
      migration.version,
    );
  });
}
