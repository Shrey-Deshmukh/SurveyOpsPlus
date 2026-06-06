import {
  listProjectsWithCache,
  refreshProjectsListCache,
  upsertProjectWithCache,
} from "@/db/cache/projects/projects-cache";
import {
  deleteContextDocByIdFromDatabase,
  listContextDocsByProjectIdFromDatabase,
  upsertContextDocsInDatabase,
} from "@/db/dataAccess/projects/contextDocsDAO";
import {
  getProjectMetadataByProjectIdFromDatabase,
  upsertProjectMetadataInDatabase,
} from "@/db/dataAccess/projects/projectMetadataDAO";
import { formatIsoLocalDateForProjectCard } from "@/controller/createProject/utils";
import {
  getProjectByIdFromDatabase,
  touchProjectUpdatedAtInDatabase,
  updateProjectDateInDatabase,
  upsertProjectInDatabase,
  updateProjectInstructionsInDatabase,
  updateProjectStatusInDatabase,
} from "@/db/dataAccess/projects/projectsDAO";
import type { ProjectRecord } from "@/shared-types/data/project-record";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";
import type { ProjectMetadataRecord } from "@/shared-types/data/project-metadata-record";
import { withProjectsDatabase } from "@/db/api/database/connection-pool";
import type { SQLiteDatabase } from "expo-sqlite";

async function syncProjectDateFromMetadata(
  db: SQLiteDatabase,
  projectMetadata: ProjectMetadataRecord,
): Promise<void> {
  const displayDate = formatIsoLocalDateForProjectCard(
    projectMetadata.inspectionDate,
  );
  if (!displayDate) {
    return;
  }

  await updateProjectDateInDatabase(db, projectMetadata.projectId, displayDate);
}

export async function listProjectsApi(): Promise<ProjectRecord[]> {
  return withProjectsDatabase((db) => listProjectsWithCache(db));
}

export async function upsertProjectApi(project: ProjectRecord): Promise<void> {
  await withProjectsDatabase((db) => upsertProjectWithCache(db, project));
}

export async function getProjectByIdApi(
  projectId: string,
): Promise<ProjectRecord | null> {
  return withProjectsDatabase((db) => getProjectByIdFromDatabase(db, projectId));
}

export async function updateProjectStatusApi(
  projectId: string,
  status: string,
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await updateProjectStatusInDatabase(db, projectId, status);
    await refreshProjectsListCache(db, "updateProjectStatusApi:write-through");
  });
}

export async function updateProjectInstructionsApi(
  projectId: string,
  instructions: string | null,
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await updateProjectInstructionsInDatabase(db, projectId, instructions);
    await refreshProjectsListCache(
      db,
      "updateProjectInstructionsApi:write-through",
    );
  });
}

export async function getProjectMetadataByProjectIdApi(
  projectId: string,
): Promise<ProjectMetadataRecord | null> {
  return withProjectsDatabase((db) =>
    getProjectMetadataByProjectIdFromDatabase(db, projectId),
  );
}

export async function listContextDocsByProjectIdApi(
  projectId: string,
): Promise<ContextDocRecord[]> {
  return withProjectsDatabase((db) =>
    listContextDocsByProjectIdFromDatabase(db, projectId),
  );
}

export async function upsertContextDocsApi(
  contextDocs: ContextDocRecord[],
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await upsertContextDocsInDatabase(db, contextDocs);
    if (contextDocs[0]?.projectId) {
      await touchProjectUpdatedAtInDatabase(db, contextDocs[0].projectId);
    }
    await refreshProjectsListCache(db, "upsertContextDocsApi:write-through");
  });
}

export async function deleteContextDocByIdApi(
  projectId: string,
  contextDocId: string,
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await deleteContextDocByIdFromDatabase(db, contextDocId);
    await touchProjectUpdatedAtInDatabase(db, projectId);
    await refreshProjectsListCache(db, "deleteContextDocByIdApi:write-through");
  });
}

export async function upsertProjectMetadataApi(
  projectMetadata: ProjectMetadataRecord,
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    await db.withTransactionAsync(async () => {
      await upsertProjectMetadataInDatabase(db, projectMetadata);
      await syncProjectDateFromMetadata(db, projectMetadata);
      await touchProjectUpdatedAtInDatabase(db, projectMetadata.projectId);
    });

    await refreshProjectsListCache(db, "upsertProjectMetadataApi:write-through");
  });
}

export async function createProjectWithMetadataApi(
  project: ProjectRecord,
  projectMetadata: ProjectMetadataRecord,
  contextDocs: ContextDocRecord[],
): Promise<void> {
  await withProjectsDatabase(async (db) => {
    const displayDate = formatIsoLocalDateForProjectCard(
      projectMetadata.inspectionDate,
    );
    const projectToSave = displayDate ? { ...project, date: displayDate } : project;

    await db.withTransactionAsync(async () => {
      await upsertProjectInDatabase(db, projectToSave);
      await upsertProjectMetadataInDatabase(db, projectMetadata);
      await upsertContextDocsInDatabase(db, contextDocs);
    });

    await refreshProjectsListCache(db, "createProjectWithMetadataApi:write-through");
  });
}
