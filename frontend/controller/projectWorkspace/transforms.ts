// Pure helpers for project workspace (reports, errors).

import { RestError } from "@/rest/rest-error";

export function mimeTypeForReportFileName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    case "pdf":
      return "application/pdf";

    case "md":
      return "text/markdown";

    default:
      return "application/octet-stream";
  }
}

function isRequestAborted(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg === "aborted" || msg.includes("abort");
  }
  return false;
}

export function formatReportGenerationError(error: unknown): string {
  if (isRequestAborted(error)) {
    return (
      "Report generation timed out. This can happen with many images or slow " +
      "network/API responses. Try again with fewer included images, or wait and retry."
    );
  }
  if (error instanceof RestError) {
    if (
      typeof error.body === "object" &&
      error.body !== null &&
      "detail" in error.body
    ) {
      return String((error.body as { detail?: unknown }).detail);
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Report generation failed.";
}
