import type { SQLiteDatabase } from "expo-sqlite";
import { desc, eq } from "drizzle-orm";

import { getDrizzleDatabase } from "@/db/drizzle/client";
import { reportsTable } from "@/db/drizzle/schema/reportsTable";
import type { ReportRecord } from "@/shared-types/data/report-record";

export async function insertReportInDatabase(
  db: SQLiteDatabase,
  report: ReportRecord,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb.insert(reportsTable).values({
    id: report.id,
    projectId: report.projectId,
    name: report.name,
    localUrl: report.localUrl,
    sizeBytes: report.sizeBytes,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  });
}

export async function listReportsByProjectIdFromDatabase(
  db: SQLiteDatabase,
  projectId: string,
): Promise<ReportRecord[]> {
  const drizzleDb = getDrizzleDatabase(db);
  const rows = await drizzleDb
    .select({
      id: reportsTable.id,
      projectId: reportsTable.projectId,
      name: reportsTable.name,
      localUrl: reportsTable.localUrl,
      sizeBytes: reportsTable.sizeBytes,
      status: reportsTable.status,
      createdAt: reportsTable.createdAt,
      updatedAt: reportsTable.updatedAt,
    })
    .from(reportsTable)
    .where(eq(reportsTable.projectId, projectId))
    .orderBy(desc(reportsTable.createdAt));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ?? 0,
    updatedAt: row.updatedAt ?? 0,
  }));
}

export async function updateReportSizeBytesInDatabase(
  db: SQLiteDatabase,
  reportId: string,
  sizeBytes: number,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);
  const nowSec = Math.floor(Date.now() / 1000);
  await drizzleDb
    .update(reportsTable)
    .set({
      sizeBytes,
      updatedAt: nowSec,
    })
    .where(eq(reportsTable.id, reportId));
}
