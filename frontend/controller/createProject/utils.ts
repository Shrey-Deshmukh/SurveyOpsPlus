// containes utility pure functions

function normalizeProjectName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .toUpperCase()
    .slice(0, 14);
}

export function toProjectRef(name: string, timestamp: number): string {
  const normalized = normalizeProjectName(name);
  const suffix = String(timestamp).slice(-4);
  return `#${normalized || "PROJECT"}-${suffix}`;
}

export function formatProjectDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

export function formatIsoLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Maps metadata `YYYY-MM-DD` to the `projects.date` display format (`MM/DD/YYYY`). */
export function formatIsoLocalDateForProjectCard(
  isoDate: string | null | undefined,
): string | null {
  if (!isoDate?.trim()) {
    return null;
  }

  const trimmed = isoDate.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${month}/${day}/${year}`;
  }

  return trimmed;
}

export function format24HourTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}`;
}

export function formatFileSize(sizeBytes: number | null): string {
  if (
    sizeBytes === null ||
    !Number.isFinite(sizeBytes) ||
    sizeBytes < 0
  ) {
    return "Unknown size";
  }

  if (sizeBytes < 1024) {
    return `${Math.round(sizeBytes)} B`;
  }

  const kiloBytes = sizeBytes / 1024;
  if (kiloBytes < 1024) {
    return `${kiloBytes < 10 ? kiloBytes.toFixed(1) : Math.round(kiloBytes)} KB`;
  }

  const megaBytes = kiloBytes / 1024;
  return `${megaBytes < 10 ? megaBytes.toFixed(1) : Math.round(megaBytes)} MB`;
}

function toFileTypeLabel(name: string, type: string | null): string {
  if (type) {
    const mimeSegment = type.split("/").at(-1);
    if (mimeSegment) {
      return mimeSegment.toUpperCase();
    }
  }

  const extension = name.split(".").at(-1);
  if (extension && extension !== name) {
    return extension.toUpperCase();
  }

  return "DOCUMENT";
}

export function formatContextDocumentSubtitle(
  name: string,
  type: string | null,
  sizeBytes: number | null,
): string {
  return `${toFileTypeLabel(name, type)} • ${formatFileSize(sizeBytes)}`;
}
