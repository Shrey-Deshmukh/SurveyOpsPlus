// Classifies arbitrary LLM tag / location_desc payload nodes for traversal.

export enum TagsPayloadValueKind {
  Nullish = "nullish",
  String = "string",
  Array = "array",
  Object = "object",
  Other = "other",
}

// Buckets an `unknown` payload fragment so walkers can switch on shape instead of chained typeof checks.
export function classifyTagsPayloadValue(value: unknown): TagsPayloadValueKind {
  if (value === null || value === undefined) {
    return TagsPayloadValueKind.Nullish;
  }
  if (typeof value === "string") {
    return TagsPayloadValueKind.String;
  }
  if (Array.isArray(value)) {
    return TagsPayloadValueKind.Array;
  }
  if (typeof value === "object") {
    return TagsPayloadValueKind.Object;
  }
  return TagsPayloadValueKind.Other;
}
