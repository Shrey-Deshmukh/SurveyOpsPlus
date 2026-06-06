// REST-backed pipeline: send local images to the backend extract-features endpoint.

import { apiPostRequest } from "@/rest/client";
import {
  EXTRACT_FEATURES_BATCH_TIMEOUT_MS,
} from "@/data/extract-features.constants";
import {
  ImageMimeType,
  mimeTypeToFileExtension,
} from "@/utils/image-mime";

export type ExtractFeaturesBatchResult = {
  filename: string;
  tags: unknown;
  error: string | null;
};

export type ExtractFeaturesBatchResponse = {
  project_id: string;
  results: ExtractFeaturesBatchResult[];
  error?: string;
};

export type ExtractFeaturesImageInput = {
  uri: string;
  mimeType: string;
  fileName: string;
};

/** POST up to 10 images as multipart to /v1/extract-features. */
export async function extractFeaturesFromImages(
  images: ExtractFeaturesImageInput[],
  projectId: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<ExtractFeaturesBatchResponse> {
  const form = new FormData();
  form.append("project_id", projectId);

  for (const image of images) {
    form.append(
      "images",
      {
        uri: image.uri,
        name: image.fileName,
        type: image.mimeType,
      } as unknown as Blob,
    );
  }

  return apiPostRequest<ExtractFeaturesBatchResponse>(
    "/v1/extract-features",
    form,
    {
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? EXTRACT_FEATURES_BATCH_TIMEOUT_MS,
    },
  );
}

/** Single-image helper (batch of one). */
export async function extractFeaturesFromImage(
  imageUri: string,
  projectId: string,
  mimeType: string = ImageMimeType.Jpeg,
  options: { fileName?: string; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<{ project_id: string; tags: unknown }> {
  const fileName = options.fileName ?? deriveFileName(imageUri, mimeType);
  const response = await extractFeaturesFromImages(
    [{ uri: imageUri, mimeType, fileName }],
    projectId,
    options,
  );
  const first = response.results[0];
  if (!first || first.error) {
    throw new Error(first?.error ?? "Tag extraction failed");
  }
  return { project_id: response.project_id, tags: first.tags };
}

function deriveFileName(uri: string, mimeType: string): string {
  const last = uri.split("/").pop() ?? "";
  if (last.includes(".")) return last;
  const ext = mimeTypeToFileExtension(mimeType);
  return last.length > 0 ? `${last}.${ext}` : `upload.${ext}`;
}
