// containes utility pure functions

import type { ProjectRecord } from "@/shared-types/data/project-record";

export function matchesSearch(project: ProjectRecord, search: string) {
  if (!search) return true;
  return project.ref.toLowerCase().includes(search.toLowerCase());
}

export function filterProjects(projects: ProjectRecord[], search: string) {
  return projects.filter((p) => matchesSearch(p, search));
}
