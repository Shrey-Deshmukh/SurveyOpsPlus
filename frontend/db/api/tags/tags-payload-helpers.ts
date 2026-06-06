// LLM tag / location_desc payload traversal (used by tags-api only).

import {
  FENCE_REGEX,
  LABEL_KEYS,
  LOCATION_DESC_KEY,
  WRAPPER_KEYS,
} from "@/db/api/tags/constants";
import {
  classifyTagsPayloadValue,
  TagsPayloadValueKind,
} from "@/db/api/tags/utils/tags-payload";

// Collect every raw `location_desc` string found anywhere in the payload.
export function gatherRawLocationDescriptions(payload: unknown): string[] {
  const out: string[] = [];
  collectLocationDescriptions(payload, out);
  return out;
}

// Collect every raw tag-like string found anywhere in the payload.
export function gatherRawTagStrings(payload: unknown): string[] {
  const out: string[] = [];
  collectLabels(payload, out);
  return out;
}

function collectLocationDescriptions(value: unknown, out: string[]): void {
  switch (classifyTagsPayloadValue(value)) {
    case TagsPayloadValueKind.Nullish:
    case TagsPayloadValueKind.Other:
      return;
    case TagsPayloadValueKind.String: {
      const s = value as string;
      const parsed = tryParseJson(s);
      if (
        parsed !== undefined &&
        classifyTagsPayloadValue(parsed) !== TagsPayloadValueKind.String
      ) {
        collectLocationDescriptions(parsed, out);
      }
      return;
    }
    case TagsPayloadValueKind.Array:
      for (const item of value as unknown[]) {
        collectLocationDescriptions(item, out);
      }
      return;
    case TagsPayloadValueKind.Object: {
      const obj = value as Record<string, unknown>;
      const direct = obj[LOCATION_DESC_KEY];
      if (typeof direct === "string" && direct.trim().length > 0) {
        out.push(direct);
      }
      for (const v of Object.values(obj)) {
        collectLocationDescriptions(v, out);
      }
      return;
    }
    default:
      return;
  }
}

function collectLabels(value: unknown, out: string[]): void {
  switch (classifyTagsPayloadValue(value)) {
    case TagsPayloadValueKind.Nullish:
    case TagsPayloadValueKind.Other:
      return;
    case TagsPayloadValueKind.String:
      collectFromString(value as string, out);
      return;
    case TagsPayloadValueKind.Array:
      for (const item of value as unknown[]) {
        collectLabels(item, out);
      }
      return;
    case TagsPayloadValueKind.Object:
      collectFromObject(value as Record<string, unknown>, out);
      return;
    default:
      return;
  }
}

function collectFromString(text: string, out: string[]): void {
  const parsed = tryParseJson(text);
  if (
    parsed !== undefined &&
    classifyTagsPayloadValue(parsed) !== TagsPayloadValueKind.String
  ) {
    collectLabels(parsed, out);
    return;
  }
  out.push(text);
}

function collectFromObject(obj: Record<string, unknown>, out: string[]): void {
  for (const key of LABEL_KEYS) {
    const candidate = obj[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      out.push(candidate);
      return;
    }
  }

  for (const key of WRAPPER_KEYS) {
    if (key in obj) {
      collectLabels(obj[key], out);
      return;
    }
  }

  for (const v of Object.values(obj)) {
    collectLabels(v, out);
  }
}

function tryParseJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = FENCE_REGEX.exec(trimmed);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
    return undefined;
  }
  try {
    return JSON.parse(candidate);
  } catch {
    return undefined;
  }
}
