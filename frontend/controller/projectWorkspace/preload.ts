// loads state and effect for the workspace screen

import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { loadWorkspace, type Report } from "@/data/workspace.dao";
import type { ImageRecord } from "@/shared-types/data/image-record";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";

export function useWorkspacePreload(projectId: string) {
  const [projectName, setProjectName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [savedInstructions, setSavedInstructions] = useState("");
  const [representingParty, setRepresentingParty] = useState("");
  const [status, setStatus] = useState("Draft");
  const [reports, setReports] = useState<Report[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [emailAttachments, setEmailAttachments] = useState<ContextDocRecord[]>([]);
  const [billAttachments, setBillAttachments] = useState<ContextDocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        if (!hasLoadedOnceRef.current) {
          setLoading(true);
        }

        try {
          const workspace = await loadWorkspace(projectId);
          if (!isActive) {
            return;
          }

          setProjectName(workspace.projectName);
          setInstructions(workspace.instructions);
          setSavedInstructions(workspace.instructions);
          setRepresentingParty(workspace.representingParty);
          setStatus(workspace.status);
          setReports(workspace.reports);
          setImages(workspace.images);
          setEmailAttachments(workspace.emailAttachments);
          setBillAttachments(workspace.billAttachments);
          hasLoadedOnceRef.current = true;
        } catch (error) {
          console.error("[WorkspacePreload] Failed to load workspace", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      void loadData();

      return () => {
        isActive = false;
      };
    }, [projectId]),
  );

  return {
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
  };
}
