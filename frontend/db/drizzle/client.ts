import type { SQLiteDatabase } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import { projectsTable } from "@/db/drizzle/schema/projectsTable";
import { imagesTable } from "@/db/drizzle/schema/imagesTable";
import { imageMetadataTable } from "@/db/drizzle/schema/imageMetadataTable";
import { imageTagsTable } from "@/db/drizzle/schema/imageTagsTable";
import { projectMetadataTable } from "@/db/drizzle/schema/projectMetadataTable";
import { reportsTable } from "@/db/drizzle/schema/reportsTable";
import { contextDocsTable } from "@/db/drizzle/schema/contextDocsTable";

const drizzleSchema = {
  projectsTable,
  imagesTable,
  imageMetadataTable,
  imageTagsTable,
  projectMetadataTable,
  reportsTable,
  contextDocsTable,
};

export function getDrizzleDatabase(db: SQLiteDatabase) {
  return drizzle(db, { schema: drizzleSchema });
}
