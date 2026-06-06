import type { ImageRecord, ImageTaggingStatus } from "@/shared-types/data/image-record";
import { File } from "expo-file-system";
import {
  getImageApi,
  updateImageNotesApi,
  listTagsApi,
  replaceTagsApi,
  deleteImageApi,
} from "@/db/api/images/images-api";

/** One row in the "Technical metadata" list on the photo screen */
export type MetaRow = {
  icon: string;
  label: string;
  value: string;
  editable: boolean;
};

/** Everything the image details screen needs in one bundle */
export type PhotoDetails = {
  image: ImageRecord;
  tags: string[];
  rows: MetaRow[];
  citationsJson: string | null;
};

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

function formatTaggingStatusValue(image: ImageRecord): string {
  const status: ImageTaggingStatus = image.taggingStatus;
  if (status === "tagged") {
    return "Tagged (auto)";
  }
  if (status === "in_progress") {
    return "Tagging in progress…";
  }
  if (image.taggingLastError) {
    return `Not tagged — ${image.taggingLastError}`;
  }
  return "Not tagged yet";
}

function buildMetaRows(image: ImageRecord): MetaRow[] {
  return [
    {
      icon: "auto-awesome",
      label: "Auto-tag status",
      value: formatTaggingStatusValue(image),
      editable: false,
    },
    {
      icon: "calendar-today",
      label: "Date Added",
      value: formatDate(image.createdAt),
      editable: false,
    },
    {
      icon: "location-on",
      label: "GPS Coordinates",
      value:
        image.latitude !== null && image.longitude !== null
          ? `${image.latitude.toFixed(4)}, ${image.longitude.toFixed(4)}`
          : "Not available",
      editable: false,
    },
    {
      icon: "sd-storage",
      label: "Size & Format",
      value: `${formatBytes(image.sizeBytes)} • ${(image.format ?? "unknown").toUpperCase()}`,
      editable: false,
    },
  ];
}

/** Loads preview, tags, notes, and metadata rows for a specific image. */
export async function loadPhoto(imageId: string): Promise<PhotoDetails | null> {
  const [image, tags] = await Promise.all([
    getImageApi(imageId),
    listTagsApi(imageId),
  ]);

  if (!image) return null;

  return {
    image,
    tags,
    rows: buildMetaRows(image),
    citationsJson: image.citationsJson ?? null,
  };
}

/** Persists tag labels only (used when adding/removing tags before full metadata save). */
export async function savePhotoTags(
  imageId: string,
  tags: string[],
): Promise<void> {
  await replaceTagsApi(imageId, tags);
}

/** Saves notes and tags for an image. */
export async function savePhotoMetadata(
  imageId: string,
  notes: string,
  tags: string[],
): Promise<void> {
  // Save in sequence to avoid write contention across pooled SQLite connections.
  await updateImageNotesApi(imageId, notes);
  await savePhotoTags(imageId, tags);
}

/** Deletes an image row (and cascading metadata) and local file for a specific image. */
export async function deletePhoto(imageId: string): Promise<boolean> {
  const deletedImage = await deleteImageApi(imageId);
  if (!deletedImage) {
    return false;
  }

  try {
    const file = new File(deletedImage.localUrl);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn("[PhotoDAO] Failed to delete local image file", error);
  }

  return true;
}
