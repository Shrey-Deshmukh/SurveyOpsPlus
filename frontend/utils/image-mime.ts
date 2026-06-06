/** MIME values aligned with backend `ALLOWED_IMAGE_TYPES` / extract-features uploads. */
export enum ImageMimeType {
  Jpeg = "image/jpeg",
  Jpg = "image/jpg",
  Png = "image/png",
  Webp = "image/webp",
}

/** Filename extensions for known image MIME types. */
export enum ImageFileExtension {
  Jpg = "jpg",
  Png = "png",
  Webp = "webp",
  Bin = "bin",
}

const MIME_TO_EXT = new Map<string, ImageFileExtension>([
  [ImageMimeType.Jpeg.toLowerCase(), ImageFileExtension.Jpg],
  [ImageMimeType.Jpg.toLowerCase(), ImageFileExtension.Jpg],
  [ImageMimeType.Png.toLowerCase(), ImageFileExtension.Png],
  [ImageMimeType.Webp.toLowerCase(), ImageFileExtension.Webp],
]);

const EXT_TO_MIME = new Map<string, ImageMimeType>([
  [ImageFileExtension.Jpg, ImageMimeType.Jpeg],
  ["jpeg", ImageMimeType.Jpeg],
  [ImageFileExtension.Png, ImageMimeType.Png],
  [ImageFileExtension.Webp, ImageMimeType.Webp],
]);

// Map a MIME type string to a filename extension enum (unknown → Bin).
export function mimeTypeToFileExtension(mime: string): ImageFileExtension {
  return MIME_TO_EXT.get(mime.trim().toLowerCase()) ?? ImageFileExtension.Bin;
}

// Map a file extension string to a MIME enum (unknown → Jpeg).
export function fileExtensionToMimeType(ext: string): ImageMimeType {
  return EXT_TO_MIME.get(ext.trim().toLowerCase()) ?? ImageMimeType.Jpeg;
}

// Alias: map extension → MIME string for APIs that expect a plain string (same as fileExtensionToMimeType).
export const mimeFromExtension = fileExtensionToMimeType;
