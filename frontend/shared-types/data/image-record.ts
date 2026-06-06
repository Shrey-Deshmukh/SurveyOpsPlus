/** LLM auto-tag pipeline state persisted on `images`. */
export type ImageTaggingStatus = "untagged" | "in_progress" | "tagged";

export type ImageRecord = {
  id: string;
  projectId: string;
  localUrl: string;
  sizeBytes: number | null;
  format: string | null;
  notes: string | null;
  longitude: number | null;
  latitude: number | null;
  createdAt: string;
  uploadedAt: number | null;
  taggingStatus: ImageTaggingStatus;
  /** Set when the last auto-tag attempt failed (e.g. non-2xx from extract-features). */
  taggingLastError: string | null;
  /** Serialised CitationRecord JSON, set after a successful extract-features run. Null until tagged. */
  citationsJson: string | null;
  /** Local DB: included in generated report appendix when true. */
  isImageIncluded: boolean;
};
