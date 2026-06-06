// containes typed data fetching layer
// layer will call cache + db layer

import { ProjectRecord } from "@/shared-types/data/project-record";
import { listProjectsApi } from "@/db/api/projects/projects-api";

/** One project row on the home / inspections list */
export type Project = {
  id: string;
  ref: string;
  name: string;
  surveyDetails: string | null;
  status: string;
  location: string;
  date: string;
};

export type HomePayload = {
  projects: ProjectRecord[];
};

async function loadProjects(): Promise<ProjectRecord[]> {
  const existing = await listProjectsApi();
  return existing.map((project) => ({ ...project }));
}

/** Loads the inspections tab: project cards + bottom banner. */
export async function loadHome(): Promise<HomePayload> {
  const projects = await loadProjects();

  return {
    projects,
  };
}
