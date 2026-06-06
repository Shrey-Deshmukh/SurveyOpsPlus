// containes data transformation methods, pure

import type { ProjectRecord } from "@/shared-types/data/project-record";
import type { ProjectMetadataRecord } from "@/shared-types/data/project-metadata-record";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";
import {
  isProjectStatus,
  ProjectStatus,
} from "@/shared-types/data/project-status";
import {
  isRepresentingParty,
  type RepresentingParty,
} from "@/shared-types/data/representing-party";
import {
  formatProjectDate,
  toProjectRef,
} from "@/controller/createProject/utils";

export type CreateProjectForm = {
  projectName: string;
  surveyDetails: string;
  instructions: string;
  status: ProjectStatus;
  location: string;
  date: string;
  representingParty: RepresentingParty | "";
};

export type CreateProjectMetadataForm = {
  containerId: string;
  vesselName: string;
  voyageNo: string;
  operator: string;
  portOfLoading: string;
  portOfDischarge: string;
  inspectionDate: string;
  inspectionTime: string;
};

export type CreateProjectMetadataAutofill = Partial<CreateProjectMetadataForm>;

export type CreateProjectContextDoc = {
  id: string;
  name: string;
  type: string | null;
  localUrl: string;
  sizeBytes: number | null;
};

type CreateProjectPayload = {
  projectId: string;
  project: ProjectRecord;
};

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapCreateProjectFormToRecord(
  form: CreateProjectForm,
  now: Date,
): CreateProjectPayload {
  const timestamp = now.getTime();
  const projectId = `project-${timestamp}`;
  const trimmedName = form.projectName.trim();
  const representingParty = isRepresentingParty(form.representingParty)
    ? form.representingParty
    : null;

  return {
    projectId,
    project: {
      id: projectId,
      ref: toProjectRef(trimmedName, timestamp),
      name: trimmedName,
      surveyDetails: toNullable(form.surveyDetails),
      instructions: toNullable(form.instructions),
      representingParty,
      status: form.status || ProjectStatus.Draft,
      location: form.location.trim() || "Unassigned",
      date: form.date.trim() || formatProjectDate(now),
    },
  };
}

export function mapCreateProjectMetadataFormToRecord(
  projectId: string,
  form: CreateProjectMetadataForm,
): ProjectMetadataRecord {
  return {
    id: `project-metadata-${projectId}`,
    projectId,
    containerId: toNullable(form.containerId),
    vesselName: toNullable(form.vesselName),
    voyageNo: toNullable(form.voyageNo),
    operator: toNullable(form.operator),
    portOfLoading: toNullable(form.portOfLoading),
    portOfDischarge: toNullable(form.portOfDischarge),
    inspectionDate: toNullable(form.inspectionDate),
    inspectionTime: toNullable(form.inspectionTime),
  };
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null;
}

export function mapCreateProjectContextDocsToRecords(
  projectId: string,
  docs: CreateProjectContextDoc[],
  nowMs: number,
): ContextDocRecord[] {
  return docs
    .filter((doc) => doc.localUrl.trim().length > 0)
    .map((doc) => ({
      id: doc.id,
      projectId,
      name: doc.name.trim() || null,
      type: doc.type ? toNullable(doc.type) : null,
      localUrl: doc.localUrl,
      sizeBytes: toNullableNumber(doc.sizeBytes),
      createdAt: nowMs,
      updatedAt: nowMs,
    }));
}

export function serializeProjectRouteParam(project: ProjectRecord): string {
  return JSON.stringify(project);
}

export function serializeContextDocsRouteParam(
  docs: CreateProjectContextDoc[],
): string {
  return JSON.stringify(docs);
}

export function serializeMetadataAutofillRouteParam(
  metadata: CreateProjectMetadataAutofill,
): string {
  return JSON.stringify(metadata);
}

export function parseContextDocsRouteParam(
  value: string | string[] | undefined,
): CreateProjectContextDoc[] {
  const serialized = Array.isArray(value) ? value[0] : value;
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const item = entry as Partial<CreateProjectContextDoc>;
      const localUrl =
        typeof item.localUrl === "string" ? item.localUrl.trim() : "";
      if (!localUrl) {
        return [];
      }

      return [
        {
          id:
            typeof item.id === "string" && item.id.trim()
              ? item.id
              : `context-doc-${index}`,
          name:
            typeof item.name === "string" && item.name.trim()
              ? item.name
              : "Document",
          type: toNullable(
            typeof item.type === "string" ? item.type : String(item.type ?? ""),
          ),
          localUrl,
          sizeBytes: toNullableNumber(item.sizeBytes),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function parseProjectRouteParam(
  value: string | string[] | undefined,
): ProjectRecord | null {
  const serialized = Array.isArray(value) ? value[0] : value;
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<ProjectRecord>;
    const parsedStatus = typeof parsed.status === "string" ? parsed.status : "";
    const parsedRepresentingParty =
      typeof parsed.representingParty === "string" ? parsed.representingParty : "";
    if (!parsed.id || !parsed.ref || !parsed.name) {
      return null;
    }

    return {
      id: parsed.id,
      ref: parsed.ref,
      name: parsed.name,
      surveyDetails: parsed.surveyDetails ?? null,
      instructions: parsed.instructions ?? null,
      status: isProjectStatus(parsedStatus) ? parsedStatus : ProjectStatus.Draft,
      location: parsed.location ?? "Unassigned",
      date: parsed.date ?? "",
      representingParty: isRepresentingParty(parsedRepresentingParty)
        ? parsedRepresentingParty
        : null,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function parseMetadataAutofillRouteParam(
  value: string | string[] | undefined,
): CreateProjectMetadataAutofill {
  const serialized = Array.isArray(value) ? value[0] : value;
  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<CreateProjectMetadataAutofill>;
    const toOptionalTrimmedString = (entry: unknown): string | undefined => {
      if (typeof entry !== "string") {
        return undefined;
      }
      const trimmed = entry.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    return {
      containerId: toOptionalTrimmedString(parsed.containerId),
      vesselName: toOptionalTrimmedString(parsed.vesselName),
      voyageNo: toOptionalTrimmedString(parsed.voyageNo),
      operator: toOptionalTrimmedString(parsed.operator),
      portOfLoading: toOptionalTrimmedString(parsed.portOfLoading),
      portOfDischarge: toOptionalTrimmedString(parsed.portOfDischarge),
      inspectionDate: toOptionalTrimmedString(parsed.inspectionDate),
      inspectionTime: toOptionalTrimmedString(parsed.inspectionTime),
    };
  } catch {
    return {};
  }
}

export function toSaveProjectErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save project to local database.";
}
