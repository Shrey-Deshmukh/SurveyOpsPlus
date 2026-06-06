import { apiPostRequest } from "@/rest/client";

export type MetadataAutofillAttachment = {
  uri: string;
  name: string;
  type: string;
};

export type InferredProjectMetadata = {
  containerId: string | null;
  vesselName: string | null;
  voyageNo: string | null;
  operator: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  inspectionDate: string | null;
  inspectionTime: string | null;
};

export type InferredProjectDraft = {
  projectName: string | null;
  surveyDetails: string | null;
  instructions: string | null;
  status: string | null;
  location: string | null;
  date: string | null;
  representingParty: string | null;
};

export type InferredProjectAutofill = {
  project: InferredProjectDraft;
  metadata: InferredProjectMetadata;
};

type MetadataAutofillResponse = {
  metadata: {
    container_id?: unknown;
    vessel_name?: unknown;
    voyage_no?: unknown;
    operator?: unknown;
    port_of_loading?: unknown;
    port_of_discharge?: unknown;
    inspection_date?: unknown;
    inspection_time?: unknown;
  };
  project?: {
    project_name?: unknown;
    survey_details?: unknown;
    instructions?: unknown;
    status?: unknown;
    location?: unknown;
    date?: unknown;
    representing_party?: unknown;
  };
};

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildAutofillRequestFormData(params: {
  emailAttachments?: MetadataAutofillAttachment[];
  billAttachments?: MetadataAutofillAttachment[];
}): FormData {
  const { emailAttachments = [], billAttachments = [] } = params;
  const formData = new FormData();

  for (const attachment of emailAttachments) {
    formData.append(
      "email_attachments",
      {
        uri: attachment.uri,
        name: attachment.name,
        type: attachment.type,
      } as unknown as Blob,
    );
  }

  for (const attachment of billAttachments) {
    formData.append(
      "bill_attachments",
      {
        uri: attachment.uri,
        name: attachment.name,
        type: attachment.type,
      } as unknown as Blob,
    );
  }

  return formData;
}

async function requestAutofill(params: {
  emailAttachments?: MetadataAutofillAttachment[];
  billAttachments?: MetadataAutofillAttachment[];
}): Promise<MetadataAutofillResponse> {
  const formData = buildAutofillRequestFormData(params);
  return apiPostRequest<MetadataAutofillResponse>(
    "/v1/autofill-metadata",
    formData,
  );
}

function mapMetadata(metadata: MetadataAutofillResponse["metadata"]): InferredProjectMetadata {
  return {
    containerId: toNullableString(metadata.container_id),
    vesselName: toNullableString(metadata.vessel_name),
    voyageNo: toNullableString(metadata.voyage_no),
    operator: toNullableString(metadata.operator),
    portOfLoading: toNullableString(metadata.port_of_loading),
    portOfDischarge: toNullableString(metadata.port_of_discharge),
    inspectionDate: toNullableString(metadata.inspection_date),
    inspectionTime: toNullableString(metadata.inspection_time),
  };
}

function mapProjectDraft(
  project: MetadataAutofillResponse["project"] | undefined,
): InferredProjectDraft {
  const safeProject = project ?? {};
  return {
    projectName: toNullableString(safeProject.project_name),
    surveyDetails: toNullableString(safeProject.survey_details),
    instructions: toNullableString(safeProject.instructions),
    status: toNullableString(safeProject.status),
    location: toNullableString(safeProject.location),
    date: toNullableString(safeProject.date),
    representingParty: toNullableString(safeProject.representing_party),
  };
}

export async function inferProjectMetadataFromAttachments(params: {
  emailAttachments?: MetadataAutofillAttachment[];
  billAttachments?: MetadataAutofillAttachment[];
}): Promise<InferredProjectMetadata> {
  const response = await requestAutofill(params);
  return mapMetadata(response.metadata ?? {});
}

export async function inferProjectDraftFromAttachments(params: {
  emailAttachments?: MetadataAutofillAttachment[];
  billAttachments?: MetadataAutofillAttachment[];
}): Promise<InferredProjectDraft> {
  const response = await requestAutofill(params);
  return mapProjectDraft(response.project);
}

export async function inferProjectAndMetadataFromAttachments(params: {
  emailAttachments?: MetadataAutofillAttachment[];
  billAttachments?: MetadataAutofillAttachment[];
}): Promise<InferredProjectAutofill> {
  const response = await requestAutofill(params);
  return {
    project: mapProjectDraft(response.project),
    metadata: mapMetadata(response.metadata ?? {}),
  };
}
