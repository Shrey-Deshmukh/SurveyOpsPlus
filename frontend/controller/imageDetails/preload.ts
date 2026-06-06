// loads state for the image details screen

import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { loadPhoto, type MetaRow } from "@/data/photo.dao";
import type { ImageRecord } from "@/shared-types/data/image-record";

export function useImageDetailsPreload(imageId: string) {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [metaRows, setMetaRows] = useState<MetaRow[]>([]);
  const [citationsJson, setCitationsJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        setLoading(true);
        try {
          const data = await loadPhoto(imageId);
          if (!isActive) return;

          if (data) {
            setImage(data.image);
            setTags(data.tags);
            setNotes(data.image.notes ?? "");
            setMetaRows(data.rows);
            setCitationsJson(data.citationsJson);
          } else {
            setImage(null);
            setTags([]);
            setNotes("");
            setMetaRows([]);
            setCitationsJson(null);
          }
        } catch (error) {
          console.error("[ImageDetailsPreload] Failed to load image", error);
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [imageId]),
  );

  const reloadFromDb = useCallback(async () => {
    if (!imageId) return;
    try {
      const data = await loadPhoto(imageId);
      if (data) {
        setImage(data.image);
        setTags(data.tags);
        setNotes(data.image.notes ?? "");
        setMetaRows(data.rows);
        setCitationsJson(data.citationsJson);
      }
    } catch (error) {
      console.error("[ImageDetailsPreload] reload failed", error);
    }
  }, [imageId]);

  return {
    image,
    tags,
    setTags,
    notes,
    setNotes,
    metaRows,
    citationsJson,
    loading,
    reloadFromDb,
  };
}
