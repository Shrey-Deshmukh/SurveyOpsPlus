import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { projectsTable } from "./projectsTable";

export const projectMetadataTable = sqliteTable("project_metadata", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  containerId: text("container_id"),
  vesselName: text("vessel_name"),
  voyageNo: text("voyage_no"),
  operator: text("operator"),
  portOfLoading: text("port_of_loading"),
  portOfDischarge: text("port_of_discharge"),
  inspectionDate: text("inspection_date"),
  inspectionTime: text("inspection_time"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});
