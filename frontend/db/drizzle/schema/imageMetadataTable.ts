import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { imagesTable } from "./imagesTable";

export const imageMetadataTable = sqliteTable("image_metadata", {
  id: text("id").primaryKey().notNull(),
  imageId: text("image_id")
    .notNull()
    .references(() => imagesTable.id, { onDelete: "cascade" }),
  tagId: text("tag_id"),
  label: text("label"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
