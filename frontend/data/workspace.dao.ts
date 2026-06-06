import type { ImageRecord } from "@/shared-types/data/image-record";
import type { ReportRecord } from "@/shared-types/data/report-record";
import {
  listContextDocsByProjectIdApi,
  listProjectsApi,
  updateProjectInstructionsApi,
} from "@/db/api/projects/projects-api";
import { listImagesApi } from "@/db/api/images/images-api";
import { listReportsByProjectIdApi } from "@/db/api/reports/reports-api";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";

export const REPORT_EMAIL_ATTACHMENT_PREFIX = "report-email-attachment-";
export const REPORT_BILL_ATTACHMENT_PREFIX = "report-bill-attachment-";

/** A file in the Reports section of a workspace */
export type Report = {
  id: string;
  name: string;
  date: string;
  size: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  /** Local file URI for opening in the system viewer */
  localUrl: string | null;
};

export type WorkspacePayload = {
  projectName: string;
  instructions: string;
  representingParty: string;
  status: string;
  reports: Report[];
  images: ImageRecord[];
  emailAttachments: ContextDocRecord[];
  billAttachments: ContextDocRecord[];
};

export function isEmailReportAttachment(doc: ContextDocRecord): boolean {
  return doc.id.startsWith(REPORT_EMAIL_ATTACHMENT_PREFIX);
}

export function isBillReportAttachment(doc: ContextDocRecord): boolean {
  return doc.id.startsWith(REPORT_BILL_ATTACHMENT_PREFIX);
}

function formatReportTimestamp(seconds: number): string {
  if (!seconds) return "";
  const date = new Date(seconds * 1000);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatReportSize(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

function iconStyleForReportName(fileName: string): {
  icon: string;
  iconColor: string;
  iconBg: string;
} {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return { icon: "picture-as-pdf", iconColor: "#dc2626", iconBg: "#fef2f2" };
  }
  if (lower.endsWith(".md")) {
    return { icon: "article", iconColor: "#0d9488", iconBg: "#f0fdfa" };
  }
  return { icon: "description", iconColor: "#2563eb", iconBg: "#eff6ff" };
}

export function mapReportRecordToReport(record: ReportRecord): Report {
  const name = record.name ?? "Report";
  const style = iconStyleForReportName(name);
  return {
    id: record.id,
    name,
    date: formatReportTimestamp(record.createdAt),
    size: formatReportSize(record.sizeBytes),
    icon: style.icon,
    iconColor: style.iconColor,
    iconBg: style.iconBg,
    localUrl: record.localUrl,
  };
}

/** Loads persisted reports for the workspace list (local references only). */
export async function loadWorkspaceReports(projectId: string): Promise<Report[]> {
  const reportRecords = await listReportsByProjectIdApi(projectId);
  return reportRecords.map(mapReportRecordToReport);
}

/** Image rows for a project (via db cache). */
export async function loadProjectImageRecords(
  projectId: string,
): Promise<ImageRecord[]> {
  return listImagesApi(projectId);
}

function normalizeInstructionsForStorage(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function persistProjectInstructions(
  projectId: string,
  instructions: string,
): Promise<void> {
  await updateProjectInstructionsApi(
    projectId,
    normalizeInstructionsForStorage(instructions),
  );
}

/** Loads all workspace data for a single project by its ID. */
export async function loadWorkspace(projectId: string): Promise<WorkspacePayload> {
  const [projects, images, reportRecords, contextDocs] = await Promise.all([
    listProjectsApi(),
    listImagesApi(projectId),
    listReportsByProjectIdApi(projectId),
    listContextDocsByProjectIdApi(projectId),
  ]);

  const project = projects.find((p) => p.id === projectId);

  return {
    projectName: project?.name ?? "Untitled Project",
    instructions: project?.instructions ?? "",
    representingParty: project?.representingParty ?? "",
    status: project?.status ?? "Draft",
    reports: reportRecords.map(mapReportRecordToReport),
    images,
    emailAttachments: contextDocs.filter(isEmailReportAttachment),
    billAttachments: contextDocs.filter(isBillReportAttachment),
  };
}
