import type { SQLiteDatabase } from "expo-sqlite";
import { eq, sql } from "drizzle-orm";

import { getDrizzleDatabase } from "@/db/drizzle/client";
import { projectMetadataTable } from "@/db/drizzle/schema/projectMetadataTable";
import type { ProjectMetadataRecord } from "@/shared-types/data/project-metadata-record";

export async function upsertProjectMetadataInDatabase(
  db: SQLiteDatabase,
  projectMetadata: ProjectMetadataRecord,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .insert(projectMetadataTable)
    .values({
      id: projectMetadata.id,
      projectId: projectMetadata.projectId,
      containerId: projectMetadata.containerId,
      vesselName: projectMetadata.vesselName,
      voyageNo: projectMetadata.voyageNo,
      operator: projectMetadata.operator,
      portOfLoading: projectMetadata.portOfLoading,
      portOfDischarge: projectMetadata.portOfDischarge,
      inspectionDate: projectMetadata.inspectionDate,
      inspectionTime: projectMetadata.inspectionTime,
      createdAt: projectMetadata.createdAt ?? sql`(unixepoch())`,
      updatedAt: projectMetadata.updatedAt ?? sql`(unixepoch())`,
    })
    .onConflictDoUpdate({
      target: projectMetadataTable.id,
      set: {
        projectId: projectMetadata.projectId,
        containerId: projectMetadata.containerId,
        vesselName: projectMetadata.vesselName,
        voyageNo: projectMetadata.voyageNo,
        operator: projectMetadata.operator,
        portOfLoading: projectMetadata.portOfLoading,
        portOfDischarge: projectMetadata.portOfDischarge,
        inspectionDate: projectMetadata.inspectionDate,
        inspectionTime: projectMetadata.inspectionTime,
        updatedAt: sql`(unixepoch())`,
      },
    });
}

export async function getProjectMetadataByProjectIdFromDatabase(
  db: SQLiteDatabase,
  projectId: string,
): Promise<ProjectMetadataRecord | null> {
  const drizzleDb = getDrizzleDatabase(db);
  const rows = await drizzleDb
    .select({
      id: projectMetadataTable.id,
      projectId: projectMetadataTable.projectId,
      containerId: projectMetadataTable.containerId,
      vesselName: projectMetadataTable.vesselName,
      voyageNo: projectMetadataTable.voyageNo,
      operator: projectMetadataTable.operator,
      portOfLoading: projectMetadataTable.portOfLoading,
      portOfDischarge: projectMetadataTable.portOfDischarge,
      inspectionDate: projectMetadataTable.inspectionDate,
      inspectionTime: projectMetadataTable.inspectionTime,
      createdAt: projectMetadataTable.createdAt,
      updatedAt: projectMetadataTable.updatedAt,
    })
    .from(projectMetadataTable)
    .where(eq(projectMetadataTable.projectId, projectId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    createdAt: row.createdAt ?? row.updatedAt ?? Date.now(),
    updatedAt: row.updatedAt ?? Date.now(),
  };
}
