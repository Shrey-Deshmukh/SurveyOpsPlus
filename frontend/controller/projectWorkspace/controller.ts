// main controller for workspace data flow

import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  getDocumentAsync,
  type DocumentPickerAsset,
} from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useWorkspacePreload } from "@/controller/projectWorkspace/preload";
import { useWorkspaceReports } from "@/controller/projectWorkspace/useWorkspaceReports";
import { formatReportGenerationError } from "@/controller/projectWorkspace/transforms";
import { insertImageApi } from "@/db/api/images/images-api";
import {
  deleteContextDocByIdApi,
  upsertContextDocsApi,
} from "@/db/api/projects/projects-api";
import { deletePhoto } from "@/data/photo.dao";
import { runPersistImageTaggingBatched } from "@/data/image-tagging-workflow";
import { runReportImageConfirmationFlow } from "@/data/report-workspace.dao";
import { PROJECT_STATUS_REPORT_GENERATED } from "@/data/report-workspace.constants";
import {
  REPORT_BILL_ATTACHMENT_PREFIX,
  REPORT_EMAIL_ATTACHMENT_PREFIX,
  loadWorkspaceReports,
  loadProjectImageRecords,
  persistProjectInstructions,
  type Report,
} from "@/data/workspace.dao";
import { toSaveProjectErrorMessage } from "@/controller/createProject/transforms";
import { persistContextDocument } from "@/controller/utils/document-utils";
import type { ImageTaggingPatch } from "@/data/image-tagging-workflow";
import type { ImageRecord } from "@/shared-types/data/image-record";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";

type CaptureImageOptions = {
  closeGalleryBeforeNavigate?: () => void;
};
type CapturedAsset = {
  uri: string;
  fileSize?: number | null;
};

const imagesDir = new Directory(Paths.document, "images");

// Lazily create the persistent images directory if it doesn't exist yet.
function ensureImagesDir(): void {
  if (!imagesDir.exists) {
    imagesDir.create();
  }
}

// Pull the file extension from a URI, defaulting to "jpg".
function fileExtension(uri: string): string {
  const parts = uri.split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "jpg").toLowerCase() : "jpg";
}

function extensionFromName(name: string): string {
  const extension = name.split(".").at(-1);
  if (!extension || extension === name) {
    return "";
  }
  return extension.toLowerCase();
}

function isEmailAttachmentAsset(asset: DocumentPickerAsset): boolean {
  const ext = extensionFromName(asset.name);
  return (
    ext === "eml" ||
    ext === "msg" ||
    ext === "pdf" ||
    asset.mimeType === "message/rfc822" ||
    asset.mimeType === "application/vnd.ms-outlook" ||
    asset.mimeType === "application/pdf"
  );
}

function isBillAttachmentAsset(asset: DocumentPickerAsset): boolean {
  const ext = extensionFromName(asset.name);
  return ext === "pdf" || asset.mimeType === "application/pdf";
}

function toContextDocRecord(params: {
  projectId: string;
  id: string;
  localUrl: string;
  asset: DocumentPickerAsset;
}): ContextDocRecord {
  const now = Date.now();
  return {
    id: params.id,
    projectId: params.projectId,
    name: params.asset.name?.trim() || "Document",
    type: params.asset.mimeType ?? null,
    localUrl: params.localUrl,
    sizeBytes: params.asset.size ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

async function saveImageRecord({
  projectId,
  localUrl,
  format,
  sizeBytes,
  taggingStatus,
  taggingLastError,
}: {
  projectId: string;
  localUrl: string;
  format: string;
  sizeBytes: number | null;
  taggingStatus: ImageRecord["taggingStatus"];
  taggingLastError: string | null;
}): Promise<ImageRecord> {
  const timestamp = Date.now();
  const imageId = `img-${projectId}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
  const record: ImageRecord = {
    id: imageId,
    projectId,
    localUrl,
    sizeBytes,
    format,
    notes: null,
    longitude: null,
    latitude: null,
    createdAt: new Date().toISOString(),
    uploadedAt: timestamp,
    isImageIncluded: false,
    taggingStatus,
    taggingLastError,
    citationsJson: null,
  };
  await insertImageApi(record);
  return record;
}

async function persistAssetAsProjectImage({
  asset,
  projectId,
  onTaggingPatch,
}: {
  asset: CapturedAsset;
  projectId: string;
  onTaggingPatch: (imageId: string, patch: ImageTaggingPatch) => void;
}): Promise<ImageRecord> {
  ensureImagesDir();
  const ext = fileExtension(asset.uri);
  const imageId = `img-${projectId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${imageId}.${ext}`;

  const sourceFile = new File(asset.uri);
  const destFile = new File(imagesDir, fileName);
  sourceFile.copy(destFile);

  const record = await saveImageRecord({
    projectId,
    localUrl: destFile.uri,
    sizeBytes: asset.fileSize ?? null,
    format: ext,
    taggingStatus: "in_progress",
    taggingLastError: null,
  });
  return record;
}

function startBatchedTaggingForRecords(
  records: ImageRecord[],
  projectId: string,
  onTaggingPatch: (imageId: string, patch: ImageTaggingPatch) => void,
): void {
  if (records.length === 0) return;

  const jobs = records.map((record) => {
    const ext = record.format ?? fileExtension(record.localUrl);
    return {
      imageId: record.id,
      localUri: record.localUrl,
      format: ext,
      fileName: `${record.id}.${ext}`,
    };
  });

  void runPersistImageTaggingBatched({
    projectId,
    jobs,
    onPatch: onTaggingPatch,
  });
}

function promptCaptureAnother(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    Alert.alert(
      "Capture Another Image?",
      "Do you want to keep capturing images for this project?",
      [
        { text: "Done", style: "cancel", onPress: () => finish(false) },
        { text: "Capture More", onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}

// Hook that wires up the project workspace screen: state, derived menus, and image-upload flow.
export function useWorkspaceController(projectId: string) {
  const router = useRouter();

  const goBackToProjectList = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }, [router]);
  const {
    projectName,
    instructions,
    setInstructions,
    savedInstructions,
    setSavedInstructions,
    representingParty,
    status,
    setStatus,
    reports,
    setReports,
    images,
    setImages,
    emailAttachments,
    setEmailAttachments,
    billAttachments,
    setBillAttachments,
    loading,
  } = useWorkspacePreload(projectId);

  const { handleOpenReport, handleExportReports } = useWorkspaceReports();

  const [selected, setSelected] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reportImageModalOpen, setReportImageModalOpen] = useState(false);
  const [isReportFlowBusy, setIsReportFlowBusy] = useState(false);
  const reportModalIntentRef = useRef<"generate" | "select_only">("generate");
  const [bulkTagging, setBulkTagging] = useState(false);
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);

  const instructionsDirty = instructions !== savedInstructions;

  const patchImageTagging = useCallback(
    (imageId: string, patch: ImageTaggingPatch) => {
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, ...patch } : img)),
      );
    },
    [setImages],
  );

  const openProjectMetadata = useCallback(() => {
    router.push({
      pathname: "/(project)/edit-project-metadata",
      params: { id: projectId },
    });
  }, [projectId, router]);

  const handleExportSelectedReports = useCallback(async () => {
    const selectedReports = reports.filter((report) =>
      selected.includes(report.id),
    );
    await handleExportReports(selectedReports);
  }, [handleExportReports, reports, selected]);

  const handleShareReport = useCallback(
    async (report: Report) => {
      await handleExportReports([report]);
    },
    [handleExportReports],
  );

  const handleSaveInstructions = useCallback(async (): Promise<void> => {
    if (!projectId || isSavingInstructions || !instructionsDirty) {
      return;
    }

    setIsSavingInstructions(true);
    try {
      await persistProjectInstructions(projectId, instructions);
      const normalized = instructions.trim();
      setInstructions(normalized);
      setSavedInstructions(normalized);
    } catch (error) {
      console.error("[Workspace] Failed to save instructions", error);
      Alert.alert("Database Error", toSaveProjectErrorMessage(error));
    } finally {
      setIsSavingInstructions(false);
    }
  }, [
    instructions,
    instructionsDirty,
    isSavingInstructions,
    projectId,
    setInstructions,
    setSavedInstructions,
  ]);

  // Toggle a single image id in/out of the multi-select set.
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  // Replace the selection with the given ids (used for "Select all").
  function selectAll(ids: string[]) {
    setSelected(ids);
  }

  const openReportImagesForGenerate = useCallback(() => {
    reportModalIntentRef.current = "generate";
    setReportImageModalOpen(true);
  }, []);

  const openReportImagesForSelectOnly = useCallback(() => {
    if (reports.length === 0) {
      return;
    }
    reportModalIntentRef.current = "select_only";
    setReportImageModalOpen(true);
  }, [reports.length]);

  const closeReportImageModal = useCallback(() => {
    setReportImageModalOpen(false);
  }, []);

  const handleConfirmReportImages = useCallback(
    async (selectedIds: string[]) => {
      if (!projectId) {
        return;
      }
      const intent = reportModalIntentRef.current;
      setReportImageModalOpen(false);
      setIsReportFlowBusy(true);
      try {
        await runReportImageConfirmationFlow({
          projectId,
          selectedImageIds: selectedIds,
          intent,
          userInstruction: instructions,
          representingParty,
        });
        const [nextImages, nextReports] = await Promise.all([
          loadProjectImageRecords(projectId),
          loadWorkspaceReports(projectId),
        ]);
        setImages(nextImages);
        setReports(nextReports);
        if (intent === "generate") {
          setStatus(PROJECT_STATUS_REPORT_GENERATED);
        }
      } catch (error) {
        console.error("[Workspace] Report image confirmation failed", error);
        Alert.alert("Report", formatReportGenerationError(error));
      } finally {
        setIsReportFlowBusy(false);
      }
    },
    [instructions, representingParty, projectId, setImages, setReports, setStatus],
  );

  const isReportGenerated =
    status.trim().toLowerCase() ===
    PROJECT_STATUS_REPORT_GENERATED.trim().toLowerCase();

  // Pick images, copy them into the persistent dir, insert DB records, and kick off tag extraction.
  async function handleUploadImages(): Promise<void> {
    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (result.canceled || result.assets.length === 0) return;

      ensureImagesDir();
      const newRecords: ImageRecord[] = [];

      for (const asset of result.assets) {
        const ext = fileExtension(asset.uri);
        const imageId = `img-${projectId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const fileName = `${imageId}.${ext}`;

        // Copy picked image into the persistent images directory.
        const sourceFile = new File(asset.uri);
        const destFile = new File(imagesDir, fileName);
        sourceFile.copy(destFile);

        const record = await saveImageRecord({
          projectId,
          localUrl: destFile.uri,
          sizeBytes: asset.fileSize ?? null,
          format: ext,
          taggingStatus: "in_progress",
          taggingLastError: null,
        });
        newRecords.push(record);
      }

      // Optimistically prepend new images to the current list.
      setImages((prev) => [...newRecords, ...prev]);
      startBatchedTaggingForRecords(newRecords, projectId, patchImageTagging);
    } catch (error) {
      console.error("[Workspace] Image upload failed", error);
      Alert.alert(
        "Upload Error",
        "Image picker is unavailable in this runtime. Please use a dev build or install a compatible client.",
      );
    }
  }

  async function handleCaptureImage(
    options?: CaptureImageOptions,
  ): Promise<void> {
    try {
      const ImagePicker = await import("expo-image-picker");
      const MediaLibrary = await import("expo-media-library");

      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(
          "Camera Access Required",
          "Please allow camera access to capture project images.",
        );
        return;
      }

      const mediaPermission = await MediaLibrary.getPermissionsAsync(false, [
        "photo",
      ]);
      const resolvedMediaPermission = mediaPermission.granted
        ? mediaPermission
        : await MediaLibrary.requestPermissionsAsync(false, ["photo"]);
      if (!resolvedMediaPermission.granted) {
        Alert.alert(
          "Gallery Access Required",
          "Please allow media library access to save captured images.",
        );
        return;
      }

      const capturedRecords: ImageRecord[] = [];

      while (true) {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.9,
        });

        if (result.canceled || result.assets.length === 0) {
          break;
        }

        const capturedAsset = result.assets[0];
        const savedRecord = await persistAssetAsProjectImage({
          asset: capturedAsset,
          projectId,
          onTaggingPatch: patchImageTagging,
        });
        await MediaLibrary.saveToLibraryAsync(savedRecord.localUrl);
        capturedRecords.push(savedRecord);

        const continueCapturing = await promptCaptureAnother();
        if (!continueCapturing) {
          break;
        }
      }

      if (capturedRecords.length > 0) {
        const newestFirst = [...capturedRecords].reverse();
        setImages((prev) => [...newestFirst, ...prev]);
        startBatchedTaggingForRecords(newestFirst, projectId, patchImageTagging);

        if (capturedRecords.length === 1) {
          options?.closeGalleryBeforeNavigate?.();
          router.push({
            pathname: "/(project)/image-details-metadata",
            params: { imageId: capturedRecords[0].id },
          });
        }
      }
    } catch (error) {
      console.error("[Workspace] Camera capture failed", error);
      Alert.alert(
        "Camera Error",
        "Unable to capture and save image. Please try again.",
      );
    }
  }

  const handleDeleteImages = useCallback(
    (imageIds: string[], onComplete?: () => void) => {
      if (imageIds.length === 0) {
        return;
      }

      const count = imageIds.length;
      const noun = count === 1 ? "image" : "images";

      const performDeletion = async () => {
        const deletedIds: string[] = [];
        const failedIds: string[] = [];

        for (const id of imageIds) {
          try {
            if (await deletePhoto(id)) {
              deletedIds.push(id);
            } else {
              failedIds.push(id);
            }
          } catch (error) {
            console.error("[Workspace] Failed to delete image", id, error);
            failedIds.push(id);
          }
        }

        if (deletedIds.length > 0) {
          setImages((prev) =>
            prev.filter((img) => !deletedIds.includes(img.id)),
          );
        }

        onComplete?.();

        if (failedIds.length > 0) {
          if (deletedIds.length === 0) {
            Alert.alert("Error", "Failed to delete the selected images.");
          } else {
            Alert.alert(
              "Partially deleted",
              `${deletedIds.length} of ${count} ${noun} were removed. Some images could not be deleted.`,
            );
          }
        }
      };

      Alert.alert(
        "Delete images",
        `Delete ${count} ${noun} from this project?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              void performDeletion();
            },
          },
        ],
      );
    },
    [setImages],
  );

  async function handleGenerateTagsForAllUntagged(): Promise<void> {
    const targets = images.filter((img) => img.taggingStatus === "untagged");
    if (targets.length === 0) {
      Alert.alert(
        "Generate tags",
        "Every image is already tagged or still being processed.",
      );
      return;
    }
    setBulkTagging(true);
    try {
      const jobs = targets.map((img) => {
        const fmt = img.format ?? fileExtension(img.localUrl);
        return {
          imageId: img.id,
          localUri: img.localUrl,
          format: fmt,
          fileName: `${img.id}.${fmt}`,
        };
      });
      await runPersistImageTaggingBatched({
        projectId,
        jobs,
        onPatch: (imageId: string, patch: ImageTaggingPatch) =>
          patchImageTagging(imageId, patch),
      });
    } finally {
      setBulkTagging(false);
    }
  }

  const pickReportAttachments = useCallback(
    async (kind: "email" | "bill"): Promise<void> => {
      try {
        const result = await getDocumentAsync({
          copyToCacheDirectory: true,
          multiple: true,
          type: "*/*",
        });
        if (result.canceled || result.assets.length === 0) {
          return;
        }

        const filter = kind === "email" ? isEmailAttachmentAsset : isBillAttachmentAsset;
        const supported = result.assets.filter(filter);
        if (supported.length === 0) {
          Alert.alert(
            "Unsupported File",
            kind === "email"
              ? "Please select .eml, .msg, or .pdf files for email attachments."
              : "Please select PDF files for bill attachments.",
          );
          return;
        }

        const prefix =
          kind === "email"
            ? REPORT_EMAIL_ATTACHMENT_PREFIX
            : REPORT_BILL_ATTACHMENT_PREFIX;
        const records = await Promise.all(
          supported.map(async (asset, index) => {
            const id = `${prefix}${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
            const localUrl = await persistContextDocument(asset.uri, asset.name, id);
            return toContextDocRecord({
              projectId,
              id,
              localUrl,
              asset,
            });
          }),
        );
        await upsertContextDocsApi(records);
        if (kind === "email") {
          setEmailAttachments((prev) => [...records, ...prev]);
        } else {
          setBillAttachments((prev) => [...records, ...prev]);
        }
      } catch (error) {
        console.error("[Workspace] Failed to pick report attachments", error);
        Alert.alert(
          "Upload Error",
          "Unable to select attachments right now. Please try again.",
        );
      }
    },
    [projectId, setBillAttachments, setEmailAttachments],
  );

  const removeReportAttachment = useCallback(
    async (attachmentId: string, kind: "email" | "bill"): Promise<void> => {
      try {
        await deleteContextDocByIdApi(projectId, attachmentId);
        if (kind === "email") {
          setEmailAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
        } else {
          setBillAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
        }
      } catch (error) {
        console.error("[Workspace] Failed to remove report attachment", error);
        Alert.alert("Attachment", "Unable to remove this attachment.");
      }
    },
    [projectId, setBillAttachments, setEmailAttachments],
  );

  return {
    router,
    goBackToProjectList,
    projectName,
    instructions,
    setInstructions,
    instructionsDirty,
    isSavingInstructions,
    handleSaveInstructions,
    status,
    reports,
    images,
    emailAttachments,
    billAttachments,
    selected,
    setSelected,
    selectAll,
    galleryOpen,
    setGalleryOpen,
    openProjectMetadata,
    loading,
    toggleSelect,
    handleUploadImages,
    handleCaptureImage,
    bulkTagging,
    handleGenerateTagsForAllUntagged,
    handleDeleteImages,
    pickReportAttachments,
    removeReportAttachment,
    openReportImagesForGenerate,
    openReportImagesForSelectOnly,
    closeReportImageModal,
    handleConfirmReportImages,
    reportImageModalOpen,
    isReportFlowBusy,
    isReportGenerated,
    handleShareReport,
    handleOpenReport,
    handleExportSelectedReports,
  };
}
