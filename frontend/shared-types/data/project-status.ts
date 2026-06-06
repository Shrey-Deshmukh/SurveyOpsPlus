export enum ProjectStatus {
  Draft = "Draft",
  InProgress = "In Progress",
  PendingUpload = "Pending Upload",
  Completed = "Completed",
}

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  ProjectStatus.Draft,
  ProjectStatus.InProgress,
  ProjectStatus.PendingUpload,
  ProjectStatus.Completed,
];

export function isProjectStatus(value: string): value is ProjectStatus {
  return PROJECT_STATUS_OPTIONS.includes(value as ProjectStatus);
}
