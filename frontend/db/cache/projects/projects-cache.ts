import type { SQLiteDatabase } from "expo-sqlite";

import { PROJECTS_LIST_CACHE_TTL_MS } from "@/db/constants/projects-cache";
import {
  listProjectsFromDatabase,
  upsertProjectInDatabase,
} from "@/db/dataAccess/projects/projectsDAO";
import type { ProjectRecord } from "@/shared-types/data/project-record";

const PROJECTS_LIST_CACHE_KEY = "projects:list";

type ProjectListCacheEntry = {
  projects: ProjectRecord[];
  hydratedAtMs: number;
  expiresAtMs: number;
  hydratedFrom: string;
};

const projectsListCache = new Map<string, ProjectListCacheEntry>();

function cloneProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return projects.map((project) => ({ ...project }));
}

function getProjectsListFromCache(nowMs: number): ProjectRecord[] | null {
  const entry = projectsListCache.get(PROJECTS_LIST_CACHE_KEY);
  if (!entry) {
    return null;
  }

  if (entry.expiresAtMs <= nowMs) {
    projectsListCache.delete(PROJECTS_LIST_CACHE_KEY);
    return null;
  }

  return cloneProjects(entry.projects);
}

function hydrateProjectsListCache(
  projects: ProjectRecord[],
  hydratedFrom: string,
  nowMs: number,
): ProjectRecord[] {
  const safeProjects = cloneProjects(projects);

  projectsListCache.set(PROJECTS_LIST_CACHE_KEY, {
    projects: safeProjects,
    hydratedAtMs: nowMs,
    expiresAtMs: nowMs + PROJECTS_LIST_CACHE_TTL_MS,
    hydratedFrom,
  });

  return safeProjects;
}

export async function listProjectsWithCache(
  db: SQLiteDatabase,
): Promise<ProjectRecord[]> {
  const nowMs = Date.now();
  const fromCache = getProjectsListFromCache(nowMs);
  if (fromCache) {
    return fromCache;
  }

  const rows = await listProjectsFromDatabase(db);
  return hydrateProjectsListCache(
    rows,
    "listProjectsWithCache:cache-miss",
    nowMs,
  );
}

export async function upsertProjectWithCache(
  db: SQLiteDatabase,
  project: ProjectRecord,
): Promise<void> {
  await upsertProjectInDatabase(db, project);

  // Write-through sync: after SQL write succeeds, cache is hydrated from table state.
  await refreshProjectsListCache(db, "upsertProjectWithCache:write-through");
}

export async function refreshProjectsListCache(
  db: SQLiteDatabase,
  hydratedFrom: string,
): Promise<ProjectRecord[]> {
  const freshRows = await listProjectsFromDatabase(db);
  return hydrateProjectsListCache(freshRows, hydratedFrom, Date.now());
}
