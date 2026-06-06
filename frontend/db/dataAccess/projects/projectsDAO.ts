import type { SQLiteDatabase } from "expo-sqlite";
import { desc, eq, sql } from "drizzle-orm";

import { formatIsoLocalDateForProjectCard } from "@/controller/createProject/utils";
import { getDrizzleDatabase } from "@/db/drizzle/client";
import { projectMetadataTable } from "@/db/drizzle/schema/projectMetadataTable";
import { projectsTable } from "@/db/drizzle/schema/projectsTable";
import type { ProjectRecord } from "@/shared-types/data/project-record";
import { isRepresentingParty } from "@/shared-types/data/representing-party";

type ProjectRow = {
  id: string;
  ref: string;
  name: string;
  surveyDetails: string | null;
  instructions: string | null;
  status: string;
  location: string;
  date: string;
  representingParty: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectListRow = ProjectRow & {
  inspectionDate: string | null;
};

function resolveProjectCardDate(
  projectDate: string,
  inspectionDate: string | null,
): string {
  return formatIsoLocalDateForProjectCard(inspectionDate) ?? projectDate;
}

function toProjectRecord(row: ProjectListRow): ProjectRecord {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    surveyDetails: row.surveyDetails,
    instructions: row.instructions,
    status: row.status,
    location: row.location,
    date: resolveProjectCardDate(row.date, row.inspectionDate),
    representingParty:
      row.representingParty && isRepresentingParty(row.representingParty)
        ? row.representingParty
        : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listProjectsFromDatabase(
  db: SQLiteDatabase,
): Promise<ProjectRecord[]> {
  const drizzleDb = getDrizzleDatabase(db);

  const rows = await drizzleDb
    .select({
      id: projectsTable.id,
      ref: projectsTable.ref,
      name: projectsTable.name,
      surveyDetails: projectsTable.surveyDetails,
      instructions: projectsTable.instructions,
      status: projectsTable.status,
      location: projectsTable.location,
      date: projectsTable.date,
      inspectionDate: projectMetadataTable.inspectionDate,
      representingParty: projectsTable.representingParty,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .leftJoin(
      projectMetadataTable,
      eq(projectsTable.id, projectMetadataTable.projectId),
    )
    .orderBy(desc(projectsTable.createdAt));

  return rows.map((row) => toProjectRecord(row));
}

export async function getProjectByIdFromDatabase(
  db: SQLiteDatabase,
  projectId: string,
): Promise<ProjectRecord | null> {
  const drizzleDb = getDrizzleDatabase(db);
  const rows = await drizzleDb
    .select({
      id: projectsTable.id,
      ref: projectsTable.ref,
      name: projectsTable.name,
      surveyDetails: projectsTable.surveyDetails,
      instructions: projectsTable.instructions,
      status: projectsTable.status,
      location: projectsTable.location,
      date: projectsTable.date,
      inspectionDate: projectMetadataTable.inspectionDate,
      representingParty: projectsTable.representingParty,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .leftJoin(
      projectMetadataTable,
      eq(projectsTable.id, projectMetadataTable.projectId),
    )
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return toProjectRecord(row);
}

export async function upsertProjectInDatabase(
  db: SQLiteDatabase,
  project: ProjectRecord,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .insert(projectsTable)
    .values({
      id: project.id,
      ref: project.ref,
      name: project.name,
      surveyDetails: project.surveyDetails,
      instructions: project.instructions,
      status: project.status,
      location: project.location,
      date: project.date,
      representingParty: project.representingParty,
    })
    .onConflictDoUpdate({
      target: projectsTable.id,
      set: {
        ref: project.ref,
        name: project.name,
        surveyDetails: project.surveyDetails,
        instructions: project.instructions,
        status: project.status,
        location: project.location,
        date: project.date,
        representingParty: project.representingParty,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

export async function updateProjectDateInDatabase(
  db: SQLiteDatabase,
  projectId: string,
  date: string,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(projectsTable)
    .set({
      date,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(projectsTable.id, projectId));
}

export async function touchProjectUpdatedAtInDatabase(
  db: SQLiteDatabase,
  projectId: string,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(projectsTable)
    .set({
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(projectsTable.id, projectId));
}

export async function updateProjectStatusInDatabase(
  db: SQLiteDatabase,
  projectId: string,
  status: string,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(projectsTable)
    .set({
      status,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(projectsTable.id, projectId));
}

export async function updateProjectInstructionsInDatabase(
  db: SQLiteDatabase,
  projectId: string,
  instructions: string | null,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(projectsTable)
    .set({
      instructions,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(projectsTable.id, projectId));
}
