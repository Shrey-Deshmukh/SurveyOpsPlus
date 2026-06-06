import type { SQLiteDatabase } from "expo-sqlite";
import { desc, eq } from "drizzle-orm";

import { getDrizzleDatabase } from "@/db/drizzle/client";
import { contextDocsTable } from "@/db/drizzle/schema/contextDocsTable";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";

export async function upsertContextDocsInDatabase(
  db: SQLiteDatabase,
  contextDocs: ContextDocRecord[],
): Promise<void> {
  if (contextDocs.length === 0) {
    return;
  }

  const drizzleDb = getDrizzleDatabase(db);

  for (const contextDoc of contextDocs) {
    await drizzleDb
      .insert(contextDocsTable)
      .values({
        id: contextDoc.id,
        projectId: contextDoc.projectId,
        name: contextDoc.name,
        type: contextDoc.type,
        localUrl: contextDoc.localUrl,
        sizeBytes: contextDoc.sizeBytes,
        createdAt: contextDoc.createdAt,
        updatedAt: contextDoc.updatedAt,
      })
      .onConflictDoUpdate({
        target: contextDocsTable.id,
        set: {
          projectId: contextDoc.projectId,
          name: contextDoc.name,
          type: contextDoc.type,
          localUrl: contextDoc.localUrl,
          sizeBytes: contextDoc.sizeBytes,
          createdAt: contextDoc.createdAt,
          updatedAt: contextDoc.updatedAt,
        },
      });
  }
}

export async function listContextDocsByProjectIdFromDatabase(
  db: SQLiteDatabase,
  projectId: string,
): Promise<ContextDocRecord[]> {
  const drizzleDb = getDrizzleDatabase(db);
  const rows = await drizzleDb
    .select({
      id: contextDocsTable.id,
      projectId: contextDocsTable.projectId,
      name: contextDocsTable.name,
      type: contextDocsTable.type,
      localUrl: contextDocsTable.localUrl,
      sizeBytes: contextDocsTable.sizeBytes,
      createdAt: contextDocsTable.createdAt,
      updatedAt: contextDocsTable.updatedAt,
    })
    .from(contextDocsTable)
    .where(eq(contextDocsTable.projectId, projectId))
    .orderBy(desc(contextDocsTable.createdAt));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ?? 0,
    updatedAt: row.updatedAt ?? 0,
  }));
}

export async function deleteContextDocByIdFromDatabase(
  db: SQLiteDatabase,
  contextDocId: string,
): Promise<void> {
  const drizzleDb = getDrizzleDatabase(db);
  await drizzleDb
    .delete(contextDocsTable)
    .where(eq(contextDocsTable.id, contextDocId));
}
