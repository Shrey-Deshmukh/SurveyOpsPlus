import type { SQLiteDatabase } from "expo-sqlite";

import { migrateDbIfNeeded } from "@/db/migrations/apply-migrations";

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateDbIfNeeded(db);
}
