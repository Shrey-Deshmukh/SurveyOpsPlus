import type {
  CreateProjectForm,
  CreateProjectMetadataForm,
} from "@/controller/createProject/transforms";
import {
  isProjectStatus,
  PROJECT_STATUS_OPTIONS,
} from "@/shared-types/data/project-status";
import {
  isRepresentingParty,
  REPRESENTING_PARTY_OPTIONS,
} from "@/shared-types/data/representing-party";

type ValidationResult =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      message: string;
    };

type MetadataValidationResult =
  | {
      isValid: true;
      normalizedContainerId: string;
    }
  | {
      isValid: false;
      message: string;
    };

function buildMissingFieldsMessage(
  title: string,
  fields: string[],
): {
  isValid: false;
  message: string;
} {
  return {
    isValid: false,
    message: `${title}\n- ${fields.join("\n- ")}`,
  };
}

function isUsDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function is24HourTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeContainerId(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateCreateProjectForm(
  form: CreateProjectForm,
): ValidationResult {
  const missingFields: string[] = [];

  if (!form.projectName.trim()) {
    missingFields.push("Project Name");
  }

  if (!form.status) {
    missingFields.push("Status");
  }

  if (!form.location.trim()) {
    missingFields.push("Location");
  }

  if (!form.date.trim()) {
    missingFields.push("Date");
  }

  if (!form.representingParty) {
    missingFields.push("Representing Party");
  }

  if (missingFields.length > 0) {
    return buildMissingFieldsMessage(
      "Please complete all required fields:",
      missingFields,
    );
  }

  if (!isProjectStatus(form.status)) {
    return {
      isValid: false,
      message: `Status must be one of: ${PROJECT_STATUS_OPTIONS.join(", ")}.`,
    };
  }

  if (!isUsDate(form.date.trim())) {
    return {
      isValid: false,
      message:
        "Date must be in MM/DD/YYYY format (for example: 05/04/2026).",
    };
  }

  if (
    form.representingParty &&
    !isRepresentingParty(form.representingParty)
  ) {
    return {
      isValid: false,
      message: `Representing Party must be one of: ${REPRESENTING_PARTY_OPTIONS.join(", ")}.`,
    };
  }

  return { isValid: true };
}

export function validateCreateProjectMetadataForm(
  form: CreateProjectMetadataForm,
): MetadataValidationResult {
  const normalizedContainerId = normalizeContainerId(form.containerId);
  if (normalizedContainerId && !/^[A-Z]{4}\d{7}$/.test(normalizedContainerId)) {
    return {
      isValid: false,
      message:
        "Container ID must follow ISO 6346 format when provided: 4 letters followed by 7 digits (example: MSKU1234567).",
    };
  }

  if (form.inspectionDate.trim() && !isIsoDate(form.inspectionDate.trim())) {
    return {
      isValid: false,
      message: "Inspection Date must be in YYYY-MM-DD format when provided.",
    };
  }

  if (form.inspectionTime.trim() && !is24HourTime(form.inspectionTime.trim())) {
    return {
      isValid: false,
      message: "Inspection Time must use 24-hour HH:MM format when provided.",
    };
  }

  return {
    isValid: true,
    normalizedContainerId,
  };
}
