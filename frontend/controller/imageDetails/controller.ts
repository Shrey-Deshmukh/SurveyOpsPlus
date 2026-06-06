// main controller for the image details screen

import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useImageDetailsPreload } from "@/controller/imageDetails/preload";
import { deletePhoto, savePhotoMetadata, savePhotoTags } from "@/data/photo.dao";
import { updateImageTaggingStatusApi } from "@/db/api/images/images-api";
import { runPersistImageTagging } from "@/data/image-tagging-workflow";
import type { CitationRecord } from "@/shared-types/data/citation-record";
import { extractCitationRecord } from "@/utils/citations-extractor";

export function useImageDetailsController(imageId: string) {
  const router = useRouter();
  const {
    image,
    tags,
    setTags,
    notes,
    setNotes,
    metaRows,
    citationsJson,
    loading,
    reloadFromDb,
  } = useImageDetailsPreload(imageId);

  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);

  /** Parsed citation record — null when no citations have been generated yet. */
  const citations = useMemo<CitationRecord | null>(() => {
    if (!citationsJson) return null;
    try {
      const parsed: unknown = JSON.parse(citationsJson);
      return extractCitationRecord(parsed);
    } catch {
      return null;
    }
  }, [citationsJson]);

  const persistTags = useCallback(
    async (nextTags: string[]) => {
      if (!imageId) return;
      try {
        await savePhotoTags(imageId, nextTags);
        if (image?.projectId && nextTags.length > 0) {
          await updateImageTaggingStatusApi(
            image.projectId,
            imageId,
            "tagged",
            null,
          );
        }
        await reloadFromDb();
      } catch (error) {
        console.error("[ImageDetails] Failed to persist tags", error);
        Alert.alert(
          "Error",
          "Could not save tags. Tap Save on this screen or try again.",
        );
      }
    },
    [image?.projectId, imageId, reloadFromDb],
  );

  function addTag() {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    // Prevent duplicate tags
    if (tags.includes(trimmed)) {
      setNewTag("");
      return;
    }
    const next = [...tags, trimmed];
    setTags(next);
    setNewTag("");
    void persistTags(next);
  }

  function removeTagAt(index: number) {
    const next = tags.filter((_, idx) => idx !== index);
    setTags(next);
    void persistTags(next);
  }

  const saveMetadata = useCallback(
    async (options?: { exitAfterSave?: boolean; silent?: boolean }): Promise<boolean> => {
      if (saving) return false;
      if (!imageId) {
        if (!options?.silent) {
          Alert.alert("Error", "Unable to save metadata for this image.");
        }
        return false;
      }

      setSaving(true);
      try {
        await savePhotoMetadata(imageId, notes, tags);
        if (!options?.silent) {
          Alert.alert("Saved", "Image metadata has been saved.", [
            {
              text: "OK",
              onPress: () => {
                if (options?.exitAfterSave) {
                  router.back();
                }
              },
            },
          ]);
        } else if (options?.exitAfterSave) {
          router.back();
        }
        return true;
      } catch (error) {
        console.error("[ImageDetails] Failed to save metadata", error);
        if (!options?.silent) {
          Alert.alert("Error", "Failed to save image metadata.");
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [imageId, notes, router, saving, tags],
  );

  const handleGenerateTags = useCallback(async () => {
    if (!image) return;
    const fmt = image.format?.trim() || "jpg";
    setGeneratingTags(true);
    try {
      await runPersistImageTagging({
        imageId: image.id,
        projectId: image.projectId,
        localUri: image.localUrl,
        format: fmt,
      });
      await reloadFromDb();
    } catch (error) {
      console.error("[ImageDetails] Generate tags failed", error);
      Alert.alert("Error", "Could not generate tags for this image.");
    } finally {
      setGeneratingTags(false);
    }
  }, [image, reloadFromDb]);

  function handleDelete(): void {
    Alert.alert("Delete", "Delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!imageId) {
            Alert.alert("Error", "Unable to delete this image.");
            return;
          }

          try {
            const deleted = await deletePhoto(imageId);
            if (!deleted) {
              Alert.alert("Not Found", "This image no longer exists.");
              router.back();
              return;
            }
            Alert.alert("Deleted", "Image removed from this project.", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          } catch (error) {
            console.error("[ImageDetails] Failed to delete image", error);
            Alert.alert("Error", "Failed to delete this image.");
          }
        },
      },
    ]);
  }

  return {
    router,
    image,
    tags,
    newTag,
    setNewTag,
    notes,
    setNotes,
    metaRows,
    citations,
    loading,
    saving,
    generatingTags,
    addTag,
    removeTagAt,
    saveMetadata,
    handleDelete,
    handleGenerateTags,
  };
}
