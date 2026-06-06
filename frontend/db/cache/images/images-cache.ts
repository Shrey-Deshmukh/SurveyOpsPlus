import type { SQLiteDatabase } from "expo-sqlite";

import {
  listImagesByProject,
  insertImageInDatabase,
  getImageById,
  deleteImageInDatabase,
  updateImageTaggingStatus,
  setImageInclusionForProject,
  setImagesIncludedTrueForIds,
} from "@/db/dataAccess/images/imagesDAO";
import type {
  ImageRecord,
  ImageTaggingStatus,
} from "@/shared-types/data/image-record";

const IMAGES_CACHE_TTL_MS = 30_000;

type ImagesCacheEntry = {
  images: ImageRecord[];
  hydratedAtMs: number;
  expiresAtMs: number;
};

/** Per-project image cache, keyed by projectId. */
const imagesCache = new Map<string, ImagesCacheEntry>();

function cloneImages(images: ImageRecord[]): ImageRecord[] {
  return images.map((img) => ({ ...img }));
}

function getCachedImages(
  projectId: string,
  nowMs: number,
): ImageRecord[] | null {
  const entry = imagesCache.get(projectId);
  if (!entry) return null;
  if (entry.expiresAtMs <= nowMs) {
    imagesCache.delete(projectId);
    return null;
  }
  return cloneImages(entry.images);
}

function hydrateCache(
  projectId: string,
  images: ImageRecord[],
  nowMs: number,
): ImageRecord[] {
  const safe = cloneImages(images);
  imagesCache.set(projectId, {
    images: safe,
    hydratedAtMs: nowMs,
    expiresAtMs: nowMs + IMAGES_CACHE_TTL_MS,
  });
  return safe;
}

export async function listImagesWithCache(
  db: SQLiteDatabase,
  projectId: string,
): Promise<ImageRecord[]> {
  const nowMs = Date.now();
  const fromCache = getCachedImages(projectId, nowMs);
  if (fromCache) return fromCache;

  const rows = await listImagesByProject(db, projectId);
  return hydrateCache(projectId, rows, nowMs);
}

export async function insertImageWithCache(
  db: SQLiteDatabase,
  record: ImageRecord,
): Promise<void> {
  await insertImageInDatabase(db, record);

  // Write-through: refresh this project's cache from DB
  const freshRows = await listImagesByProject(db, record.projectId);
  hydrateCache(record.projectId, freshRows, Date.now());
}

export async function updateImageTaggingStatusWithCache(
  db: SQLiteDatabase,
  projectId: string,
  imageId: string,
  taggingStatus: ImageTaggingStatus,
  taggingLastError: string | null,
): Promise<void> {
  await updateImageTaggingStatus(db, imageId, taggingStatus, taggingLastError);
  const freshRows = await listImagesByProject(db, projectId);
  hydrateCache(projectId, freshRows, Date.now());
}

export async function bulkUpdateImageInclusionWithCache(
  db: SQLiteDatabase,
  projectId: string,
  includedIds: ReadonlySet<string>,
): Promise<void> {
  await setImageInclusionForProject(db, projectId, includedIds);
  const freshRows = await listImagesByProject(db, projectId);
  hydrateCache(projectId, freshRows, Date.now());
}

export async function markImagesIncludedTrueForIdsWithCache(
  db: SQLiteDatabase,
  projectId: string,
  imageIds: readonly string[],
): Promise<void> {
  await setImagesIncludedTrueForIds(db, imageIds);
  const freshRows = await listImagesByProject(db, projectId);
  hydrateCache(projectId, freshRows, Date.now());
}

export async function deleteImageWithCache(
  db: SQLiteDatabase,
  imageId: string,
): Promise<ImageRecord | null> {
  const existing = await getImageById(db, imageId);
  if (!existing) {
    return null;
  }

  await deleteImageInDatabase(db, imageId);

  // Write-through: refresh this project's cache from DB
  const freshRows = await listImagesByProject(db, existing.projectId);
  hydrateCache(existing.projectId, freshRows, Date.now());
  return existing;
}
