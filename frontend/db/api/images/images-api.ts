import {
  listImagesWithCache,
  insertImageWithCache,
  deleteImageWithCache,
  updateImageTaggingStatusWithCache,
  bulkUpdateImageInclusionWithCache,
  markImagesIncludedTrueForIdsWithCache,
} from "@/db/cache/images/images-cache";
import {
  getImageById,
  updateImageNotes,
  updateImageCitations,
} from "@/db/dataAccess/images/imagesDAO";
import {
  listTagsByImage,
  replaceTagsForImage,
} from "@/db/dataAccess/images/imageTagsDAO";
import type {
  ImageRecord,
  ImageTaggingStatus,
} from "@/shared-types/data/image-record";
import { withProjectsDatabase } from "@/db/api/database/connection-pool";

// ─── Project-scoped image list (cached) ─────────────────────────

export async function listImagesApi(
  projectId: string,
): Promise<ImageRecord[]> {
  return withProjectsDatabase((db) => listImagesWithCache(db, projectId));
}

export async function insertImageApi(record: ImageRecord): Promise<void> {
  await withProjectsDatabase((db) => insertImageWithCache(db, record));
}

export async function bulkUpdateImageInclusionApi(
  projectId: string,
  includedImageIds: readonly string[],
): Promise<void> {
  const set = new Set(includedImageIds);
  await withProjectsDatabase((db) =>
    bulkUpdateImageInclusionWithCache(db, projectId, set),
  );
}

export async function markImagesIncludedTrueForIdsApi(
  projectId: string,
  imageIds: readonly string[],
): Promise<void> {
  await withProjectsDatabase((db) =>
    markImagesIncludedTrueForIdsWithCache(db, projectId, imageIds),
  );
}

export async function deleteImageApi(imageId: string): Promise<ImageRecord | null> {
  return withProjectsDatabase((db) => deleteImageWithCache(db, imageId));
}

// ─── Single image operations (no cache) ─────────────────────────

export async function getImageApi(
  imageId: string,
): Promise<ImageRecord | null> {
  return withProjectsDatabase((db) => getImageById(db, imageId));
}

export async function updateImageNotesApi(
  imageId: string,
  notes: string,
): Promise<void> {
  await withProjectsDatabase((db) => updateImageNotes(db, imageId, notes));
}

export async function updateImageCitationsApi(
  imageId: string,
  citationsJson: string | null,
): Promise<void> {
  await withProjectsDatabase((db) => updateImageCitations(db, imageId, citationsJson));
}

export async function updateImageTaggingStatusApi(
  projectId: string,
  imageId: string,
  taggingStatus: ImageTaggingStatus,
  taggingLastError: string | null,
): Promise<void> {
  await withProjectsDatabase((db) =>
    updateImageTaggingStatusWithCache(
      db,
      projectId,
      imageId,
      taggingStatus,
      taggingLastError,
    ),
  );
}

// ─── Per-image tags ─────────────────────────────────────────────

export async function listTagsApi(imageId: string): Promise<string[]> {
  return withProjectsDatabase((db) => listTagsByImage(db, imageId));
}

export async function replaceTagsApi(
  imageId: string,
  tags: string[],
): Promise<void> {
  await withProjectsDatabase((db) => replaceTagsForImage(db, imageId, tags));
}
