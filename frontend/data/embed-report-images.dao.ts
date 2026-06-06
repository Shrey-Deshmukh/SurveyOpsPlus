// Fetches .docx bytes from the embed endpoint (append image gallery + strip placeholders).

import {
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";

import { apiPostRequest } from "@/rest/client";
import { listTagsApi } from "@/db/api/images/images-api";
import type { ImageRecord } from "@/shared-types/data/image-record";
import { mimeFromExtension } from "@/utils/image-mime";
import { displayNameForReportImage } from "@/utils/report-image-display-name";

const EMBED_BASE_TIMEOUT_MS = 120_000;
/** Per tagged image the backend may run a short LLM call for the appendix summary. */
const EMBED_TIMEOUT_PER_TAGGED_IMAGE_MS = 45_000;
const EMBED_MAX_TIMEOUT_MS = 600_000;

function embedTimeoutMs(taggedImageCount: number, overrideMs?: number): number {
  if (overrideMs !== undefined) {
    return overrideMs;
  }
  const scaled =
    EMBED_BASE_TIMEOUT_MS + taggedImageCount * EMBED_TIMEOUT_PER_TAGGED_IMAGE_MS;
  return Math.min(EMBED_MAX_TIMEOUT_MS, scaled);
}

export type EmbedReportImagesResponse = {
  report_base64: string;
  placeholder_names_matched: string[];
};

function isEmbeddableLocalUri(uri: string): boolean {
  const u = uri.trim().toLowerCase();
  return u.length > 0 && !u.startsWith("data:");
}

/** Tags plus optional surveyor notes (location_desc) for the appendix block. */
export function appendixDescriptionForImage(
  tags: string[],
  notes: string | null | undefined,
): string | undefined {
  const tagLine = tags.map((t) => t.trim()).filter(Boolean).join(", ");
  const noteLine = (notes ?? "").trim();
  if (tagLine && noteLine) {
    return `${tagLine}\n\n${noteLine}`;
  }
  if (tagLine) {
    return tagLine;
  }
  if (noteLine) {
    return noteLine;
  }
  return undefined;
}

/** POST /api/v1/embed-report-images — rewrites the local .docx in place. */
export async function embedIncludedImagesIntoDocxFile(params: {
  docxLocalUri: string;
  includedImages: ImageRecord[];
  timeoutMs?: number;
}): Promise<{ placeholderNamesMatched: string[]; sizeBytes: number }> {
  const { docxLocalUri, includedImages } = params;
  const reportBase64 = await readAsStringAsync(docxLocalUri, {
    encoding: EncodingType.Base64,
  });

  const imagesPayload: {
    display_name: string;
    image_base64: string;
    content_type: string;
    description?: string;
  }[] = [];

  for (const img of includedImages) {
    if (!isEmbeddableLocalUri(img.localUrl)) {
      continue;
    }
    const mime = mimeFromExtension(img.format ?? "jpg");
    const imageBase64 = await readAsStringAsync(img.localUrl, {
      encoding: EncodingType.Base64,
    });
    const tags = await listTagsApi(img.id);
    const description = appendixDescriptionForImage(tags, img.notes);
    const item: {
      display_name: string;
      image_base64: string;
      content_type: string;
      description?: string;
    } = {
      display_name: displayNameForReportImage(img),
      image_base64: imageBase64,
      content_type: mime,
    };
    if (description) {
      item.description = description;
    }
    imagesPayload.push(item);
  }

  const uniqueDescriptions = new Set(
    imagesPayload
      .map((item) => (item.description ?? "").trim())
      .filter((text) => text.length > 0),
  );
  const taggedCount = uniqueDescriptions.size;

  const result = await apiPostRequest<EmbedReportImagesResponse>(
    "/v1/embed-report-images",
    {
      report_base64: reportBase64,
      images: imagesPayload,
    } as unknown as BodyInit,
    {
      timeoutMs: embedTimeoutMs(taggedCount, params.timeoutMs),
    },
  );

  await writeAsStringAsync(docxLocalUri, result.report_base64, {
    encoding: EncodingType.Base64,
  });

  const sizeBytes = Math.max(
    0,
    Math.floor((result.report_base64.length * 3) / 4) - 2,
  );

  return {
    placeholderNamesMatched: result.placeholder_names_matched ?? [],
    sizeBytes,
  };
}
