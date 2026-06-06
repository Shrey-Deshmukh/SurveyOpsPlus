import {
  createProjectWithMetadataApi,
  getProjectByIdApi,
  getProjectMetadataByProjectIdApi,
  listContextDocsByProjectIdApi,
  upsertProjectMetadataApi,
} from "@/db/api/projects/projects-api";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";
import type { ProjectMetadataRecord } from "@/shared-types/data/project-metadata-record";
import type { ProjectRecord } from "@/shared-types/data/project-record";

export type MetadataForm = {
  vessel: string;
  voyage: string;
  operator: string;
  pol: string;
  pod: string;
  date: string;
  time: string;
  containerId: string;
};

export type MetadataEditorPayload = {
  projectRef: string;
  form: MetadataForm;
  contextDocs: ContextDocRecord[];
};

export async function createProjectWithMetadata(
  project: ProjectRecord,
  metadata: ProjectMetadataRecord,
  contextDocs: ContextDocRecord[],
): Promise<void> {
  await createProjectWithMetadataApi(project, metadata, contextDocs);
}

export async function loadMetadataEditor(
  projectId: string,
): Promise<MetadataEditorPayload | null> {
  const [project, metadata, contextDocs] = await Promise.all([
    getProjectByIdApi(projectId),
    getProjectMetadataByProjectIdApi(projectId),
    listContextDocsByProjectIdApi(projectId),
  ]);

  if (!project) {
    return null;
  }

  return {
    projectRef: project.ref,
    form: {
      containerId: metadata?.containerId ?? "",
      vessel: metadata?.vesselName ?? "",
      voyage: metadata?.voyageNo ?? "",
      operator: metadata?.operator ?? "",
      pol: metadata?.portOfLoading ?? "",
      pod: metadata?.portOfDischarge ?? "",
      date: metadata?.inspectionDate ?? "",
      time: metadata?.inspectionTime ?? "",
    },
    contextDocs: contextDocs.filter((doc) => Boolean(doc.localUrl)),
  };
}

export async function persistProjectMetadata(
  projectMetadata: ProjectMetadataRecord,
): Promise<void> {
  await upsertProjectMetadataApi(projectMetadata);
}
