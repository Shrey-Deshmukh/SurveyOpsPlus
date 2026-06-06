import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projectsTable = sqliteTable("projects", {
  id: text("id").primaryKey().notNull(),
  ref: text("ref").notNull().unique(),
  name: text("name").notNull(),
  surveyDetails: text("survey_details"),
  instructions: text("instructions"),
  status: text("status").notNull(),
  location: text("location").notNull(),
  date: text("date").notNull(),
  representingParty: text("representing_party"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
