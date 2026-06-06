import type { SQLiteDatabase } from "expo-sqlite";
import { asc, eq, inArray } from "drizzle-orm";

import { getDrizzleDatabase } from "@/db/drizzle/client";
import { imageMetadataTable } from "@/db/drizzle/schema/imageMetadataTable";
import { imageTagsTable } from "@/db/drizzle/schema/imageTagsTable";

// Return the canonical `image_tags.id`s currently linked to an image (deduped).
export async function getTagIdsForImage(
  db: SQLiteDatabase,
  imageId: string,
): Promise<string[]> {
  const drizzleDb = getDrizzleDatabase(db);

  const rows = await drizzleDb
    .select({ tagId: imageMetadataTable.tagId })
    .from(imageMetadataTable)
    .where(eq(imageMetadataTable.imageId, imageId));

  return [
    ...new Set(
      rows
        .map((row) => row.tagId)
        .filter((id): id is string => id !== null && id.length > 0),
    ),
  ];
}

// Delete any of the given canonical tag IDs that no image still references; returns the IDs actually removed.
export async function pruneOrphanedTags(
  db: SQLiteDatabase,
  candidateTagIds: string[],
): Promise<string[]> {
  if (candidateTagIds.length === 0) return [];

  const drizzleDb = getDrizzleDatabase(db);

  const stillLinkedRows = await drizzleDb
    .selectDistinct({ tagId: imageMetadataTable.tagId })
    .from(imageMetadataTable)
    .where(inArray(imageMetadataTable.tagId, candidateTagIds));

  const stillLinked = new Set<string>(
    stillLinkedRows
      .map((row) => row.tagId)
      .filter((id): id is string => id !== null),
  );

  const orphaned = candidateTagIds.filter((id) => !stillLinked.has(id));
  if (orphaned.length === 0) return [];

  await drizzleDb
    .delete(imageTagsTable)
    .where(inArray(imageTagsTable.id, orphaned));

  return orphaned;
}

// Return every tag label associated with an image (prefers the canonical label, falls back to denormalized).
export async function listTagsByImage(
  db: SQLiteDatabase,
  imageId: string,
): Promise<string[]> {
  const drizzleDb = getDrizzleDatabase(db);

  const rows = await drizzleDb
    .select({
      linkedLabel: imageTagsTable.label,
      metadataLabel: imageMetadataTable.label,
    })
    .from(imageMetadataTable)
    .leftJoin(
      imageTagsTable,
      eq(imageMetadataTable.tagId, imageTagsTable.id),
    )
    .where(eq(imageMetadataTable.imageId, imageId))
    .orderBy(asc(imageMetadataTable.createdAt));

  return rows
    .map((row) => row.linkedLabel ?? row.metadataLabel)
    .filter((label): label is string => label !== null);
}

// Replace an image's full tag set: wipe its metadata, upsert canonical tags, relink, and prune orphans.
export async function replaceTagsForImage(
  db: SQLiteDatabase,
  imageId: string,
  tags: string[],
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);
  const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];

  // Snapshot existing tag links so we can prune orphans after the rewrite.
  const previouslyLinkedTagIds = await getTagIdsForImage(db, imageId);

  await drizzleDb
    .delete(imageMetadataTable)
    .where(eq(imageMetadataTable.imageId, imageId));

  if (normalizedTags.length === 0) {
    await pruneOrphanedTags(db, previouslyLinkedTagIds);
    return;
  }

  // Look up canonical rows for any labels that already exist.
  const existingTags = await drizzleDb
    .select({ id: imageTagsTable.id, label: imageTagsTable.label })
    .from(imageTagsTable)
    .where(inArray(imageTagsTable.label, normalizedTags))
    .orderBy(asc(imageTagsTable.createdAt));

  const tagIdByLabel = new Map<string, string>();
  for (const row of existingTags) {
    if (!tagIdByLabel.has(row.label)) {
      tagIdByLabel.set(row.label, row.id);
    }
  }

  // Insert canonical rows for any labels we haven't seen before.
  const missingLabels = normalizedTags.filter((label) => !tagIdByLabel.has(label));
  if (missingLabels.length > 0) {
    const now = Date.now();
    const newTagRows = missingLabels.map((label, index) => {
      const id = `img-tag-${now}-${index}-${Math.random().toString(36).slice(2, 8)}`;
      tagIdByLabel.set(label, id);
      return { id, label };
    });

    await drizzleDb.insert(imageTagsTable).values(newTagRows);
  }

  // Re-link the image to each tag through image_metadata (denormalized label kept for resilience).
  const metadataRows = normalizedTags
    .map((label, index) => {
      const tagId = tagIdByLabel.get(label);
      if (!tagId) {
        return null;
      }
      return {
        id: `meta-${imageId}-${Date.now()}-${index}`,
        imageId,
        tagId,
        label,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (metadataRows.length > 0) {
    await drizzleDb.insert(imageMetadataTable).values(metadataRows);
  }

  // Drop any previously-linked canonical tags that nothing references now.
  await pruneOrphanedTags(db, previouslyLinkedTagIds);
}
