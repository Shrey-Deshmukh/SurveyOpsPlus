import type { ImageRecord } from "@/shared-types/data/image-record";

/** Basename of `localUrl`, used to match `<name>` placeholders in .docx. */
export function displayNameForReportImage(record: ImageRecord): string {
  const url = record.localUrl;
  const last = url.split(/[/\\]/).pop() ?? "";
  return last.length > 0 ? last : record.id;
}
