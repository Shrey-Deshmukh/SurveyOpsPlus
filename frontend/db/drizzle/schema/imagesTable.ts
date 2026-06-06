import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { projectsTable } from "./projectsTable";

export const imagesTable = sqliteTable(
  "images",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    localUrl: text("local_url").notNull(),
    sizeBytes: integer("size_bytes"),
    format: text("format"),
    notes: text("notes"),
    longitude: real("longitude"),
    latitude: real("latitude"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    uploadedAt: integer("uploaded_at"),
    taggingStatus: text("tagging_status")
      .notNull()
      .default("untagged"),
    taggingLastError: text("tagging_last_error"),
    citationsJson: text("citations_json"),
    isImageIncluded: integer("is_image_included", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => ({
    projectIdIdx: index("idx_images_project_id").on(table.projectId),
  })
);
