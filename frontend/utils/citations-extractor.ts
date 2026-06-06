// Extracts document citation fields from a single LLM extract-features item.

import type { CitationRecord } from "@/shared-types/data/citation-record";

/** LLM / DB placeholders that should not be stored as real citation text. */
const CITATION_PLACEHOLDERS = new Set([
  "empty string",
  "empty",
  "n/a",
  "na",
  "none",
  "null",
  "-",
  "—",
]);

function isMeaningfulCitationText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !CITATION_PLACEHOLDERS.has(trimmed.toLowerCase());
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is string =>
        typeof v === "string" && isMeaningfulCitationText(v),
    );
  }
  if (typeof value === "string" && isMeaningfulCitationText(value)) {
    return [value.trim()];
  }
  return [];
}

function toStringOrEmpty(value: unknown): string {
  if (typeof value === "string" && isMeaningfulCitationText(value)) {
    return value.trim();
  }
  return "";
}

//given full raw LLM payload, extract and aggregate citation fields across all entries
export function extractCitationRecord(payload: unknown): CitationRecord | null {
  const items = normaliseToArray(payload);
  if (items.length === 0) return null;

  const manual_ref: string[] = [];
  const manual_ref_description: string[] = [];
  const internet_ref_links: string[] = [];
  const internet_ref_descriptions: string[] = [];

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;

    for (const s of toStringArray(obj["manual_ref"])) {
      if (!manual_ref.includes(s)) manual_ref.push(s);
    }
    for (const s of toStringArray(obj["manual_ref_description"])) {
      if (!manual_ref_description.includes(s)) manual_ref_description.push(s);
    }
    for (const s of toStringArray(obj["internet_ref_links"])) {
      if (!internet_ref_links.includes(s)) internet_ref_links.push(s);
    }
    const desc = toStringOrEmpty(obj["internet_ref_description"]);
    if (desc && !internet_ref_descriptions.includes(desc)) {
      internet_ref_descriptions.push(desc);
    }
  }

  // Return null when all citation fields are empty — no useful data to show.
  const hasContent =
    manual_ref.length > 0 ||
    manual_ref_description.length > 0 ||
    internet_ref_links.length > 0 ||
    internet_ref_descriptions.length > 0;

  if (!hasContent) return null;

  return {
    manual_ref,
    manual_ref_description,
    internet_ref_links,
    internet_ref_description: internet_ref_descriptions.join("\n\n"),
  };
}

/** JSON string for `images.citations_json` (TEXT), or null when there is nothing to store. */
export function serializeCitationsJsonForDb(payload: unknown): string | null {
  const record = extractCitationRecord(payload);
  return record ? JSON.stringify(record) : null;
}

function normaliseToArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  // Try parsing if it's a JSON string
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null) return [parsed];
    } catch {
      // not JSON
    }
    return [];
  }

  if (typeof payload === "object" && payload !== null) return [payload];
  return [];
}