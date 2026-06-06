// Fetches generated report bytes from the gateway and persists a local file + DB row (data → db API).

import {
  documentDirectory,
  EncodingType,
  makeDirectoryAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";

import { insertReportForProjectApi } from "@/db/api/reports/reports-api";
import { apiRequestRaw, RestMethod } from "@/rest/client";
import type { ReportRecord } from "@/shared-types/data/report-record";

/** Report pipeline + LLM can exceed 2 min; allow generous headroom before client abort. */
const GENERATE_TIMEOUT_MS = 300_000;

export type GenerateReportArgData = {
  project_id: string;
  user_instruction: string;
  representing_party: string;
  report_context?: ReportContext;
  local_tags?: { image_name: string; tags: string[] }[];
};

export type ReportContext = {
  project_ref?: string;
  project_name?: string;
  project_location?: string;
  project_date?: string;
  project_created_at?: string;
  container_id?: string;
  vessel_name?: string;
  voyage_id?: string;
  operator?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  inspection_date?: string;
  inspection_time?: string;
};

export type UploadAttachment = {
  uri: string;
  name: string;
  type: string;
};

function encodeGenerateReportArgData(
  projectId: string,
  userInstruction: string,
  representingParty: string,
  reportContext?: ReportContext,
  localTags?: { image_name: string; tags: string[] }[],
): string {
  const payload: GenerateReportArgData = {
    project_id: projectId,
    user_instruction: userInstruction,
    representing_party: representingParty,
    report_context: reportContext,
    local_tags: localTags,
  };
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(header);
  return match?.[1]?.trim() ?? null;
}

/** GET /api/v1/generate-report, write file under documentDirectory/reports, insert reports row. */
export async function fetchPersistGeneratedReportForProject(params: {
  projectId: string;
  userInstruction: string;
  representingParty: string;
  reportContext?: ReportContext;
  emailAttachments?: UploadAttachment[];
  billAttachments?: UploadAttachment[];
  localTags?: { image_name: string; tags: string[] }[];
}): Promise<ReportRecord> {
  const {
    projectId,
    userInstruction,
    representingParty,
    reportContext,
    emailAttachments = [],
    billAttachments = [],
    localTags,
  } = params;
  const argData = encodeGenerateReportArgData(
    projectId,
    userInstruction,
    representingParty,
    reportContext,
    localTags,
  );
  const formData = new FormData();
  formData.append("arg_data", argData);
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
  const response = await apiRequestRaw(
    "/v1/generate-report",
    {
      method: RestMethod.Post,
      body: formData,
      timeoutMs: GENERATE_TIMEOUT_MS,
    },
  );

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength) {
    throw new Error("Empty report download");
  }

  const headerName =
    filenameFromContentDisposition(response.headers.get("content-disposition")) ??
    `Project_Report_${projectId}.docx`;

  const safeName = headerName.replace(/[/\\]/g, "_");
  const base64 = arrayBufferToBase64(arrayBuffer);

  if (!documentDirectory) {
    throw new Error("documentDirectory is not available");
  }

  const dir = `${documentDirectory}reports`;
  await makeDirectoryAsync(dir, { intermediates: true });
  const localUri = `${dir}/${Date.now()}-${safeName}`;

  await writeAsStringAsync(localUri, base64, {
    encoding: EncodingType.Base64,
  });

  const id = `report-${projectId}-${Date.now()}`;
  const nowSec = Math.floor(Date.now() / 1000);
  const record: ReportRecord = {
    id,
    projectId,
    name: safeName,
    localUrl: localUri,
    sizeBytes: arrayBuffer.byteLength,
    status: "ready",
    createdAt: nowSec,
    updatedAt: nowSec,
  };

  await insertReportForProjectApi(record);
  return record;
}
