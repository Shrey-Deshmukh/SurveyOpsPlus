import {
  copyAsync,
  documentDirectory,
  getContentUriAsync,
  getInfoAsync,
  makeDirectoryAsync,
} from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";

const CONTEXT_DOCS_DIRECTORY = `${documentDirectory ?? ""}context-docs`;

function toFileExtension(name: string): string {
  const extension = name.split(".").at(-1);
  if (!extension || extension === name) {
    return "";
  }

  return extension.toLowerCase();
}

function sanitizeFileName(name: string): string {
  const extension = toFileExtension(name);
  const baseName = extension ? name.slice(0, -(extension.length + 1)) : name;
  const safeBaseName = baseName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);

  if (!safeBaseName) {
    return extension ? `document.${extension}` : "document";
  }

  return extension ? `${safeBaseName}.${extension}` : safeBaseName;
}

async function toOpenableDocumentUri(uri: string): Promise<string> {
  if (!uri.startsWith("file://")) {
    return uri;
  }

  try {
    return await getContentUriAsync(uri);
  } catch (error) {
    console.warn(
      "[DocumentUtils] Falling back to file URI for document share",
      error,
    );
    return uri;
  }
}

async function toExistingOpenableUri(uri: string): Promise<string> {
  await assertLocalFileExists(uri);
  return toOpenableDocumentUri(uri);
}

export async function persistContextDocument(
  sourceUri: string,
  sourceName: string,
  documentId: string,
): Promise<string> {
  if (!documentDirectory || !sourceUri.startsWith("file://")) {
    return sourceUri;
  }

  try {
    await makeDirectoryAsync(CONTEXT_DOCS_DIRECTORY, {
      intermediates: true,
    });

    const targetName = `${documentId}-${sanitizeFileName(sourceName)}`;
    const targetUri = `${CONTEXT_DOCS_DIRECTORY}/${targetName}`;

    await copyAsync({
      from: sourceUri,
      to: targetUri,
    });

    return targetUri;
  } catch (error) {
    console.warn(
      "[DocumentUtils] Failed to persist context document, using source URI",
      error,
    );
    return sourceUri;
  }
}

async function assertLocalFileExists(uri: string): Promise<void> {
  const info = await getInfoAsync(uri);
  if (!info.exists) {
    throw new Error(`File not found: ${uri}`);
  }
}

/** Opens the system share sheet for one or more local files. */
export async function shareLocalDocuments(
  uris: string[],
  mimeType?: string | null,
): Promise<void> {
  for (const uri of uris) {
    await assertLocalFileExists(uri);
  }

  const isAvailable = await Sharing.isAvailableAsync();

  if (Platform.OS === "ios") {
    if (!isAvailable) {
      // Last-resort fallback: RN Share with a single URL.
      await Share.share({ url: uris[0]! });
      return;
    }
    // Share each file in sequence. iOS UIActivityViewController only supports
    // one file per invocation; we present one sheet per file so every file
    // is actually attached and visible to the recipient app.
    for (const uri of uris) {
      await Sharing.shareAsync(uri, { UTI: utForMimeType(mimeType) });
    }
    return;
  }

  if (Platform.OS === "android") {
    if (uris.length === 1) {
      // Prefer expo-sharing for a single file — it handles content URIs automatically.
      if (isAvailable) {
        try {
          await Sharing.shareAsync(uris[0]!, { dialogTitle: "Share report" });
          return;
        } catch (error) {
          console.warn("[DocumentUtils] expo-sharing failed, falling back to intent", error);
        }
      }
    }

    // Multi-file (or expo-sharing fallback): use Android intents.
    const contentUris = await Promise.all(uris.map((uri) => toExistingOpenableUri(uri)));
    const type = mimeType ?? "*/*";

    if (uris.length === 1) {
      await IntentLauncher.startActivityAsync("android.intent.action.SEND", {
        type,
        extra: { "android.intent.extra.STREAM": contentUris[0] },
        flags: 1,
      });
      return;
    }

    await IntentLauncher.startActivityAsync("android.intent.action.SEND_MULTIPLE", {
      type,
      extra: { "android.intent.extra.STREAM": contentUris },
      flags: 1,
    });
    return;
  }

  // Fallback for other platforms.
  await Share.share({ url: uris[0]! });
}

/** Maps a MIME type to its iOS UTI equivalent for expo-sharing. */
function utForMimeType(mimeType?: string | null): string | undefined {
  if (!mimeType) return undefined;
  const lower = mimeType.toLowerCase();
  if (lower === "application/pdf") return "com.adobe.pdf";
  if (lower === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "org.openxmlformats.wordprocessingml.document";
  }
  if (lower === "text/markdown") return "net.daringfireball.markdown";
  return undefined;
}


/** Opens a local file in the platform default viewer when available. */
export async function openLocalDocument(
  uri: string,
  mimeType?: string | null,
): Promise<void> {
  await assertLocalFileExists(uri);

  if (Platform.OS === "android") {
    const openableUri = await toOpenableDocumentUri(uri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: openableUri,
      type: mimeType ?? "*/*",
      flags: 1,
    });
    return;
  }

  await Share.share({ url: uri });
}
