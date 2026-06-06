import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { projectsTable } from "./projectsTable";

export const reportsTable = sqliteTable("reports", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name"),
  localUrl: text("local_url"),
  sizeBytes: integer("size_bytes"),
  status: text("status"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});
