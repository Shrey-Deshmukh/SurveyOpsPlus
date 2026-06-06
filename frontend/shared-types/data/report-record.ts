/** Persisted generated report for a project (local file URI + metadata). */
export type ReportRecord = {
  id: string;
  projectId: string;
  name: string | null;
  localUrl: string | null;
  sizeBytes: number | null;
  status: string | null;
  createdAt: number;
  updatedAt: number;
};
