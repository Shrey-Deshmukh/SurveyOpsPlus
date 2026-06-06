/** Must match backend `EXTRACT_FEATURES_MAX_BATCH_SIZE`. */
export const EXTRACT_FEATURES_BATCH_SIZE = 10;

/** Pause between batch requests to reduce Gemini rate-limit errors. */
export const EXTRACT_FEATURES_INTER_BATCH_DELAY_MS = 4_000;

/** Long-running batch: up to 10 sequential Gemini calls per request. */
export const EXTRACT_FEATURES_BATCH_TIMEOUT_MS = 600_000;
