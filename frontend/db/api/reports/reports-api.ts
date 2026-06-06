import { withProjectsDatabase } from "@/db/api/database/connection-pool";
import { refreshProjectsListCache } from "@/db/cache/projects/projects-cache";
import {
  insertReportInDatabase,
  listReportsByProjectIdFromDatabase,
  updateReportSizeBytesInDatabase,
} from "@/db/dataAccess/reports/reportsDAO";
import { touchProjectUpdatedAtInDatabase } from "@/db/dataAccess/projects/projectsDAO";
import type { ReportRecord } from "@/shared-types/data/report-record";

export async function listReportsByProjectIdApi(
  projectId: string,
): Promise<ReportRecord[]> {
  return withProjectsDatabase((db) =>
    listReportsByProjectIdFromDatabase(db, projectId),
  );
}

export async function insertReportForProjectApi(
  report: ReportRecord,
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await insertReportInDatabase(db, report);
    await touchProjectUpdatedAtInDatabase(db, report.projectId);
    await refreshProjectsListCache(db, "insertReportForProjectApi:write-through");
  });
}

export async function updateReportSizeBytesApi(
  reportId: string,
  projectId: string,
  sizeBytes: number,
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await updateReportSizeBytesInDatabase(db, reportId, sizeBytes);
    await touchProjectUpdatedAtInDatabase(db, projectId);
    await refreshProjectsListCache(db, "updateReportSizeBytesApi:write-through");
  });
}
