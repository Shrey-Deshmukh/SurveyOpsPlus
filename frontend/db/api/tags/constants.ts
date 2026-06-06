// LLM tag / location_desc payload parsing — shared keys and patterns for tags-api.

export const LOCATION_DESC_KEY = "location_desc";

export const LABEL_KEYS = ["label", "tag", "name", "value"] as const;

export const WRAPPER_KEYS = ["tags", "categories", "items", "results"] as const;

export const FENCE_REGEX = /^```(?:json)?\s*([\s\S]*?)```$/i;

/** Trailing "(NEEDS ATTENTION)" marker emitted by the LLM. Stripped for display + word-count budgeting. */
export const NEEDS_ATTENTION_REGEX = /\s*\(NEEDS ATTENTION\)\s*$/i;

/** Tag labels with more than this many whitespace-separated words (after stripping markers) are dropped. */
export const MAX_WORDS_PER_TAG = 10;
