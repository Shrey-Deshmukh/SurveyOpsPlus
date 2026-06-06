import {
  extractFeaturesFromImages,
  type ExtractFeaturesBatchResult,
} from "@/data/extract-features.dao";
import {
  EXTRACT_FEATURES_BATCH_SIZE,
  EXTRACT_FEATURES_INTER_BATCH_DELAY_MS,
} from "@/data/extract-features.constants";
import {
  updateImageNotesApi,
  updateImageTaggingStatusApi,
  updateImageCitationsApi,
} from "@/db/api/images/images-api";
import {
  extractLocationDescription,
  insertImageTagsApi,
} from "@/db/api/tags/tags-api";
import { serializeCitationsJsonForDb } from "@/utils/citations-extractor";
import { RestError } from "@/rest/rest-error";
import type { ImageRecord } from "@/shared-types/data/image-record";
import { mimeFromExtension } from "@/utils/image-mime";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1200;

export type ImageTaggingPatch = Pick<
  ImageRecord,
  "taggingStatus" | "taggingLastError"
>;

export type ImageTaggingJob = {
  imageId: string;
  localUri: string;
  format: string;
  fileName: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBatchResponseBody(body: unknown): body is { results: ExtractFeaturesBatchResult[] } {
  return (
    typeof body === "object" &&
    body !== null &&
    "results" in body &&
    Array.isArray((body as { results: unknown }).results)
  );
}

function formatTaggingError(error: unknown): string {
  if (error instanceof RestError) {
    if (isBatchResponseBody(error.body)) {
      const first = error.body.results.find((r) => r.error);
      if (first?.error) return first.error;
    }
    return `Request failed with HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Tagging failed";
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function persistTagsForImage(
  imageId: string,
  projectId: string,
  tags: unknown,
  onPatch?: (imageId: string, patch: ImageTaggingPatch) => void,
): Promise<void> {
  const labels = await insertImageTagsApi(imageId, tags);
  const observation = extractLocationDescription(tags);
  if (observation) {
    await updateImageNotesApi(imageId, observation);
  }

  await updateImageCitationsApi(imageId, serializeCitationsJsonForDb(tags));

  await updateImageTaggingStatusApi(projectId, imageId, "tagged", null);
  onPatch?.(imageId, { taggingStatus: "tagged", taggingLastError: null });
  console.log(`[Tagging] Saved ${labels.length} tag(s) for image ${imageId}`);
}

async function markImageTaggingFailed(
  imageId: string,
  projectId: string,
  message: string,
  onPatch?: (imageId: string, patch: ImageTaggingPatch) => void,
): Promise<void> {
  await updateImageTaggingStatusApi(projectId, imageId, "untagged", message);
  onPatch?.(imageId, { taggingStatus: "untagged", taggingLastError: message });
}

async function applyBatchResults(
  jobs: ImageTaggingJob[],
  results: ExtractFeaturesBatchResult[],
  projectId: string,
  onPatch?: (imageId: string, patch: ImageTaggingPatch) => void,
): Promise<{ okCount: number; failedCount: number; failedJobs: ImageTaggingJob[] }> {
  const jobByFileName = new Map(jobs.map((job) => [job.fileName, job]));
  const handled = new Set<string>();
  const failedJobs: ImageTaggingJob[] = [];
  let okCount = 0;
  let failedCount = 0;

  for (const result of results) {
    const job = jobByFileName.get(result.filename);
    if (!job) {
      console.warn(
        `[Tagging] No job for filename ${result.filename} in batch response`,
      );
      continue;
    }

    handled.add(job.imageId);

    if (result.error || result.tags == null) {
      const message =
        result.error?.slice(0, 240) ?? "Tag extraction failed";
      await markImageTaggingFailed(job.imageId, projectId, message, onPatch);
      failedJobs.push(job);
      failedCount += 1;
      continue;
    }

    try {
      await persistTagsForImage(job.imageId, projectId, result.tags, onPatch);
      okCount += 1;
    } catch (error) {
      const message = formatTaggingError(error);
      await markImageTaggingFailed(job.imageId, projectId, message, onPatch);
      failedJobs.push(job);
      failedCount += 1;
    }
  }

  for (const job of jobs) {
    if (handled.has(job.imageId)) continue;
    await markImageTaggingFailed(
      job.imageId,
      projectId,
      "No result returned for this image",
      onPatch,
    );
    failedJobs.push(job);
    failedCount += 1;
  }

  return { okCount, failedCount, failedJobs };
}

async function processBatchWithRetries(
  batchJobs: ImageTaggingJob[],
  projectId: string,
  onPatch?: (imageId: string, patch: ImageTaggingPatch) => void,
): Promise<{
  okCount: number;
  failedCount: number;
  failedJobs: ImageTaggingJob[];
}> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await extractFeaturesFromImages(
        batchJobs.map((job) => ({
          uri: job.localUri,
          mimeType: mimeFromExtension(job.format),
          fileName: job.fileName,
        })),
        projectId,
      );
      const counts = await applyBatchResults(
        batchJobs,
        response.results,
        projectId,
        onPatch,
      );
      return counts;
    } catch (error) {
      lastError = error;
      if (error instanceof RestError && isBatchResponseBody(error.body)) {
        const counts = await applyBatchResults(
          batchJobs,
          error.body.results,
          projectId,
          onPatch,
        );
        return counts;
      }
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
      }
    }
  }

  const message = formatTaggingError(lastError);
  for (const job of batchJobs) {
    await markImageTaggingFailed(job.imageId, projectId, message, onPatch);
  }
  console.warn(
    `[Tagging] Batch failed for ${batchJobs.length} image(s)`,
    lastError,
  );
  return {
    okCount: 0,
    failedCount: batchJobs.length,
    failedJobs: batchJobs,
  };
}

/** Process images in batches via /extract-features; sequential batches with cooldown. */
export async function runPersistImageTaggingBatched(args: {
  projectId: string;
  jobs: ImageTaggingJob[];
  onPatch?: (imageId: string, patch: ImageTaggingPatch) => void;
}): Promise<{ ok: number; failed: number }> {
  const { projectId, jobs, onPatch } = args;
  if (jobs.length === 0) {
    return { ok: 0, failed: 0 };
  }

  for (const job of jobs) {
    await updateImageTaggingStatusApi(
      projectId,
      job.imageId,
      "in_progress",
      null,
    );
    onPatch?.(job.imageId, {
      taggingStatus: "in_progress",
      taggingLastError: null,
    });
  }

  const batches = chunk(jobs, EXTRACT_FEATURES_BATCH_SIZE);
  let ok = 0;
  let failed = 0;
  const toRetryIndividually: ImageTaggingJob[] = [];

  for (let i = 0; i < batches.length; i++) {
    if (i > 0) {
      await sleep(EXTRACT_FEATURES_INTER_BATCH_DELAY_MS);
    }
    const counts = await processBatchWithRetries(batches[i], projectId, onPatch);
    ok += counts.okCount;
    failed += counts.failedCount;
    toRetryIndividually.push(...counts.failedJobs);
  }

  for (let i = 0; i < toRetryIndividually.length; i++) {
    if (i > 0) {
      await sleep(EXTRACT_FEATURES_INTER_BATCH_DELAY_MS);
    }
    const counts = await processBatchWithRetries(
      [toRetryIndividually[i]],
      projectId,
      onPatch,
    );
    ok += counts.okCount;
    failed += counts.failedCount;
    if (counts.okCount > 0) {
      failed -= 1;
    }
  }

  return { ok, failed };
}

/** Single-image tagging (batch of one). */
export async function runPersistImageTagging(args: {
  imageId: string;
  projectId: string;
  localUri: string;
  format: string;
  fileName?: string;
  onPatch?: (patch: ImageTaggingPatch) => void;
}): Promise<{ ok: boolean }> {
  const { imageId, projectId, localUri, format, onPatch } = args;
  const ext = format;
  const fileName = args.fileName ?? `${imageId}.${ext}`;

  const { ok, failed } = await runPersistImageTaggingBatched({
    projectId,
    jobs: [{ imageId, localUri, format: ext, fileName }],
    onPatch: (id, patch) => {
      if (id === imageId) {
        onPatch?.(patch);
      }
    },
  });

  return { ok: ok > 0 && failed === 0 };
}
