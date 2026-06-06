import { desc, eq, inArray } from "drizzle-orm";
import type { SQLiteDatabase } from "expo-sqlite";

import {
  getTagIdsForImage,
  pruneOrphanedTags,
} from "@/db/dataAccess/images/imageTagsDAO";
import { getDrizzleDatabase } from "@/db/drizzle/client";
import { imagesTable } from "@/db/drizzle/schema/imagesTable";
import type {
  ImageRecord,
  ImageTaggingStatus,
} from "@/shared-types/data/image-record";

// Return all images for a project, newest first.
export async function listImagesByProject(
  db: SQLiteDatabase,
  projectId: string,
): Promise<ImageRecord[]> {
  const drizzleDb = getDrizzleDatabase(db);

  const rows = await drizzleDb
    .select({
      id: imagesTable.id,
      projectId: imagesTable.projectId,
      localUrl: imagesTable.localUrl,
      sizeBytes: imagesTable.sizeBytes,
      format: imagesTable.format,
      notes: imagesTable.notes,
      longitude: imagesTable.longitude,
      latitude: imagesTable.latitude,
      createdAt: imagesTable.createdAt,
      uploadedAt: imagesTable.uploadedAt,
      taggingStatus: imagesTable.taggingStatus,
      taggingLastError: imagesTable.taggingLastError,
      citationsJson: imagesTable.citationsJson,
      isImageIncluded: imagesTable.isImageIncluded,
    })
    .from(imagesTable)
    .where(eq(imagesTable.projectId, projectId))
    .orderBy(desc(imagesTable.createdAt));

  return rows.map((row) => ({
    ...row,
    taggingStatus: row.taggingStatus as ImageTaggingStatus,
  }));
}

export async function insertImageInDatabase(
  db: SQLiteDatabase,
  record: ImageRecord,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb.insert(imagesTable).values({
    id: record.id,
    projectId: record.projectId,
    localUrl: record.localUrl,
    sizeBytes: record.sizeBytes,
    format: record.format,
    notes: record.notes,
    longitude: record.longitude,
    latitude: record.latitude,
    uploadedAt: record.uploadedAt,
    taggingStatus: record.taggingStatus,
    taggingLastError: record.taggingLastError,
    citationsJson: record.citationsJson,
    isImageIncluded: record.isImageIncluded,
  });
}

export async function getImageById(
  db: SQLiteDatabase,
  imageId: string,
): Promise<ImageRecord | null> {
  const drizzleDb = getDrizzleDatabase(db);

  const rows = await drizzleDb
    .select({
      id: imagesTable.id,
      projectId: imagesTable.projectId,
      localUrl: imagesTable.localUrl,
      sizeBytes: imagesTable.sizeBytes,
      format: imagesTable.format,
      notes: imagesTable.notes,
      longitude: imagesTable.longitude,
      latitude: imagesTable.latitude,
      createdAt: imagesTable.createdAt,
      uploadedAt: imagesTable.uploadedAt,
      taggingStatus: imagesTable.taggingStatus,
      taggingLastError: imagesTable.taggingLastError,
      citationsJson: imagesTable.citationsJson,
      isImageIncluded: imagesTable.isImageIncluded,
    })
    .from(imagesTable)
    .where(eq(imagesTable.id, imageId))
    .limit(1);

  return rows.length > 0
    ? {
      ...rows[0],
      taggingStatus: rows[0].taggingStatus as ImageTaggingStatus,
    }
    : null;
}

/** Sets `is_image_included` true for ids in the set, false for all other images in the project. */
export async function setImageInclusionForProject(
  db: SQLiteDatabase,
  projectId: string,
  includedIds: ReadonlySet<string>,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);
  const rows = await drizzleDb
    .select({ id: imagesTable.id })
    .from(imagesTable)
    .where(eq(imagesTable.projectId, projectId));

  if (rows.length === 0) {
    return;
  }

  const trueIds = rows.map((r) => r.id).filter((id) => includedIds.has(id));
  const falseIds = rows.map((r) => r.id).filter((id) => !includedIds.has(id));

  if (trueIds.length > 0) {
    await drizzleDb
      .update(imagesTable)
      .set({ isImageIncluded: true })
      .where(inArray(imagesTable.id, trueIds));
  }
  if (falseIds.length > 0) {
    await drizzleDb
      .update(imagesTable)
      .set({ isImageIncluded: false })
      .where(inArray(imagesTable.id, falseIds));
  }
}

export async function setImagesIncludedTrueForIds(
  db: SQLiteDatabase,
  imageIds: readonly string[],
): Promise<void> {
  if (imageIds.length === 0) {
    return;
  }
  const drizzleDb = getDrizzleDatabase(db);
  await drizzleDb
    .update(imagesTable)
    .set({ isImageIncluded: true })
    .where(inArray(imagesTable.id, [...imageIds]));
}

export async function updateImageNotes(
  db: SQLiteDatabase,
  imageId: string,
  notes: string,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(imagesTable)
    .set({ notes })
    .where(eq(imagesTable.id, imageId));
}

export async function updateImageTaggingStatus(
  db: SQLiteDatabase,
  imageId: string,
  taggingStatus: ImageTaggingStatus,
  taggingLastError: string | null,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(imagesTable)
    .set({ taggingStatus, taggingLastError })
    .where(eq(imagesTable.id, imageId));
}

export async function updateImageCitations(
  db: SQLiteDatabase,
  imageId: string,
  citationsJson: string | null,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  await drizzleDb
    .update(imagesTable)
    .set({ citationsJson })
    .where(eq(imagesTable.id, imageId));
}

export async function deleteImageInDatabase(
  db: SQLiteDatabase,
  imageId: string,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);

  // Snapshot tag links before the FK cascade wipes image_metadata.
  const previouslyLinkedTagIds = await getTagIdsForImage(db, imageId);

  await drizzleDb
    .delete(imagesTable)
    .where(eq(imagesTable.id, imageId));

  await pruneOrphanedTags(db, previouslyLinkedTagIds);
}
