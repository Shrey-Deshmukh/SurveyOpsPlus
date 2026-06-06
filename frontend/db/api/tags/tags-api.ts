// Public tag DB API: LLM payloads → SQLite (see tags-payload-helpers for parsing).

import { replaceTagsApi } from "@/db/api/images/images-api";
import {
  MAX_WORDS_PER_TAG,
  NEEDS_ATTENTION_REGEX,
} from "@/db/api/tags/constants";
import {
  gatherRawLocationDescriptions,
  gatherRawTagStrings,
} from "@/db/api/tags/tags-payload-helpers";

function wordCount(label: string): number {
  return label.trim().split(/\s+/).filter(Boolean).length;
}

// Parse an LLM tags payload and replace the image's tag set with the resulting labels.
export async function insertImageTagsApi(
  imageId: string,
  tagsPayload: unknown,
): Promise<string[]> {
  const labels = extractTagLabels(tagsPayload);
  await replaceTagsApi(imageId, labels);
  return labels;
}

// Walk an arbitrary LLM payload and return a de-duplicated list of tag labels.
export function extractTagLabels(payload: unknown): string[] {
  const collected = gatherRawTagStrings(payload);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of collected) {
    const cleaned = raw.trim();
    if (!cleaned || seen.has(cleaned)) continue;
    const stripped = cleaned.replace(NEEDS_ATTENTION_REGEX, "").trim();
    const words = wordCount(stripped);
    if (words > MAX_WORDS_PER_TAG) {
      const preview =
        cleaned.length > 160 ? `${cleaned.slice(0, 160)}…` : cleaned;
      console.warn(
        `[TagsAPI] Ignored tag: ${words} words (max ${MAX_WORDS_PER_TAG}): ${JSON.stringify(preview)}`,
      );
      continue;
    }
    seen.add(cleaned);
    result.push(cleaned);
  }
  return result;
}

// Pull the LLM's `location_desc` text out of a payload (joined+deduped if multiple). Returns null if absent.
export function extractLocationDescription(payload: unknown): string | null {
  const collected = gatherRawLocationDescriptions(payload);

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const raw of collected) {
    const cleaned = raw.trim();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    ordered.push(cleaned);
  }
  return ordered.length > 0 ? ordered.join("\n\n") : null;
}
