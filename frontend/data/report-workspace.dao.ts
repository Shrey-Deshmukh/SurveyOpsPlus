// Orchestrates report generation + image inclusion + .docx embedding (controller → data → db/api).

import {
  bulkUpdateImageInclusionApi,
  listImagesApi,
  markImagesIncludedTrueForIdsApi,
  listTagsApi,
} from "@/db/api/images/images-api";
import {
  getProjectByIdApi,
  getProjectMetadataByProjectIdApi,
  listContextDocsByProjectIdApi,
  updateProjectStatusApi,
} from "@/db/api/projects/projects-api";
import {
  listReportsByProjectIdApi,
  updateReportSizeBytesApi,
} from "@/db/api/reports/reports-api";
import { embedIncludedImagesIntoDocxFile } from "@/data/embed-report-images.dao";
import { fetchPersistGeneratedReportForProject } from "@/data/report-generation.dao";
import { PROJECT_STATUS_REPORT_GENERATED } from "@/data/report-workspace.constants";
import {
  isBillReportAttachment,
  isEmailReportAttachment,
} from "@/data/workspace.dao";
import type { ImageRecord } from "@/shared-types/data/image-record";
import { displayNameForReportImage } from "@/utils/report-image-display-name";

export type ReportImageConfirmationIntent = "generate" | "select_only";

async function loadReportContext(projectId: string) {
  const [project, metadata] = await Promise.all([
    getProjectByIdApi(projectId),
    getProjectMetadataByProjectIdApi(projectId),
  ]);

  return {
    project_ref: project?.ref,
    project_name: project?.name,
    project_location: project?.location,
    project_date: project?.date,
    project_created_at: project?.createdAt,
    container_id: metadata?.containerId ?? undefined,
    vessel_name: metadata?.vesselName ?? undefined,
    voyage_id: metadata?.voyageNo ?? undefined,
    operator: metadata?.operator ?? undefined,
    port_of_loading: metadata?.portOfLoading ?? undefined,
    port_of_discharge: metadata?.portOfDischarge ?? undefined,
    inspection_date: metadata?.inspectionDate ?? undefined,
    inspection_time: metadata?.inspectionTime ?? undefined,
  };
}

async function loadReportAttachments(projectId: string) {
  const contextDocs = await listContextDocsByProjectIdApi(projectId);
  const toUploadAttachment = (doc: (typeof contextDocs)[number]) => ({
    uri: doc.localUrl ?? "",
    name: doc.name ?? "attachment",
    type: doc.type ?? "application/octet-stream",
  });

  return {
    emailAttachments: contextDocs
      .filter((doc) => Boolean(doc.localUrl) && isEmailReportAttachment(doc))
      .map(toUploadAttachment),
    billAttachments: contextDocs
      .filter((doc) => Boolean(doc.localUrl) && isBillReportAttachment(doc))
      .map(toUploadAttachment),
  };
}

async function embedWithPlaceholderSync(params: {
  projectId: string;
  docxLocalUri: string;
  reportId: string;
}): Promise<void> {
  const { projectId, docxLocalUri, reportId } = params;
  let images: ImageRecord[] = await listImagesApi(projectId);

  for (let pass = 0; pass < 2; pass += 1) {
    const included = images.filter((img) => img.isImageIncluded);
    const { placeholderNamesMatched, sizeBytes } =
      await embedIncludedImagesIntoDocxFile({
        docxLocalUri,
        includedImages: included,
      });

    await updateReportSizeBytesApi(reportId, projectId, sizeBytes);

    if (!placeholderNamesMatched.length || pass === 1) {
      return;
    }

    const nameSet = new Set(
      placeholderNamesMatched.map((n) => n.trim()).filter((n) => n.length > 0),
    );
    const extraIds = images
      .filter((img) => nameSet.has(displayNameForReportImage(img)))
      .map((img) => img.id);

    if (extraIds.length === 0) {
      return;
    }

    await markImagesIncludedTrueForIdsApi(projectId, extraIds);
    images = await listImagesApi(projectId);
  }
}

/**
 * Persists modal selection, then either patches the latest report (`select_only`)
 * or generates a new report row and embeds images (`generate`).
 */
export async function runReportImageConfirmationFlow(params: {
  projectId: string;
  selectedImageIds: readonly string[];
  intent: ReportImageConfirmationIntent;
  userInstruction: string;
  representingParty: string;
}): Promise<void> {
  const { projectId, selectedImageIds, intent, userInstruction, representingParty } =
    params;

  await bulkUpdateImageInclusionApi(projectId, selectedImageIds);

  if (intent === "select_only") {
    const reports = await listReportsByProjectIdApi(projectId);
    const latest = reports[0];
    if (!latest?.localUrl) {
      throw new Error("No report file found to update.");
    }
    await embedWithPlaceholderSync({
      projectId,
      docxLocalUri: latest.localUrl,
      reportId: latest.id,
    });
    return;
  }

  const selectedIdSet = new Set(selectedImageIds);
  const [reportContext, reportAttachments, images] = await Promise.all([
    loadReportContext(projectId),
    loadReportAttachments(projectId),
    listImagesApi(projectId),
  ]);
  const imagesForReport = images.filter((img) => selectedIdSet.has(img.id));
  const localTags = await Promise.all(
    imagesForReport.map(async (img) => {
      const tags = await listTagsApi(img.id);
      return {
        image_name: displayNameForReportImage(img),
        tags,
      };
    }),
  );
  const record = await fetchPersistGeneratedReportForProject({
    projectId,
    userInstruction,
    representingParty,
    reportContext,
    emailAttachments: reportAttachments.emailAttachments,
    billAttachments: reportAttachments.billAttachments,
    localTags,
  });

  if (!record.localUrl) {
    throw new Error("Generated report has no local path.");
  }

  await embedWithPlaceholderSync({
    projectId,
    docxLocalUri: record.localUrl,
    reportId: record.id,
  });

  await updateProjectStatusApi(projectId, PROJECT_STATUS_REPORT_GENERATED);
}
