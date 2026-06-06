import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  type CreateProjectMetadataForm,
  mapCreateProjectMetadataFormToRecord,
  toSaveProjectErrorMessage,
} from "@/controller/createProject/transforms";
import {
  format24HourTime,
  formatIsoLocalDate,
} from "@/controller/createProject/utils";
import { validateCreateProjectMetadataForm } from "@/controller/createProject/validation";
import {
  loadMetadataEditor,
  persistProjectMetadata,
} from "@/data/metadata.dao";
import {
  inferProjectMetadataFromAttachments,
  type MetadataAutofillAttachment,
} from "@/data/autofill-metadata.dao";
import type { ContextDocRecord } from "@/shared-types/data/context-doc-record";

const REPORT_EMAIL_ATTACHMENT_PREFIX = "report-email-attachment-";
const REPORT_BILL_ATTACHMENT_PREFIX = "report-bill-attachment-";

function toAttachmentType(
  fileName: string,
  declaredType: string | null,
): string {
  if (declaredType && declaredType.trim().length > 0) {
    return declaredType;
  }
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lower.endsWith(".eml")) {
    return "message/rfc822";
  }
  if (lower.endsWith(".msg")) {
    return "application/vnd.ms-outlook";
  }
  return "application/octet-stream";
}

function toAutofillAttachment(document: {
  name: string | null;
  type: string | null;
  localUrl: string | null;
}): MetadataAutofillAttachment | null {
  if (!document.localUrl) {
    return null;
  }
  const fileName = document.name?.trim() || "attachment";
  return {
    uri: document.localUrl,
    name: fileName,
    type: toAttachmentType(fileName, document.type),
  };
}

export function useEditProjectMetadataController() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const projectId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    return typeof raw === "string" ? raw : "";
  }, [params.id]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ref, setRef] = useState("");
  const [containerId, setContainerId] = useState("");
  const [vessel, setVessel] = useState("");
  const [voyage, setVoyage] = useState("");
  const [operator, setOperator] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [date, setDate] = useState(() => formatIsoLocalDate(new Date()));
  const [time, setTime] = useState(() => format24HourTime(new Date()));
  const [contextDocs, setContextDocs] = useState<ContextDocRecord[]>([]);
  const [isAutofilling, setIsAutofilling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const payload = await loadMetadataEditor(projectId);

        if (cancelled) {
          return;
        }

        if (!payload) {
          setLoading(false);
          return;
        }

        setRef(payload.projectRef);
        setContainerId(payload.form.containerId);
        setVessel(payload.form.vessel);
        setVoyage(payload.form.voyage);
        setOperator(payload.form.operator);
        setPol(payload.form.pol);
        setPod(payload.form.pod);
        setDate(payload.form.date);
        setTime(payload.form.time);
        setContextDocs(payload.contextDocs);
      } catch (error) {
        console.error("[EditProjectMetadata] Failed to load metadata", error);
        if (!cancelled) {
          Alert.alert("Load Error", toSaveProjectErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleAutoFillMetadata(): Promise<void> {
    if (isAutofilling) {
      return;
    }

    const emailAttachments = contextDocs
      .filter((document) => document.id.startsWith(REPORT_EMAIL_ATTACHMENT_PREFIX))
      .map(toAutofillAttachment)
      .filter((attachment): attachment is MetadataAutofillAttachment =>
        attachment !== null
      );
    const billAttachments = contextDocs
      .filter((document) => document.id.startsWith(REPORT_BILL_ATTACHMENT_PREFIX))
      .map(toAutofillAttachment)
      .filter((attachment): attachment is MetadataAutofillAttachment =>
        attachment !== null
      );

    if (emailAttachments.length === 0 && billAttachments.length === 0) {
      Alert.alert(
        "No Autofill Documents",
        "No Email Attachment or Bill Attachment documents were found for this project.",
      );
      return;
    }

    setIsAutofilling(true);
    try {
      const inferred = await inferProjectMetadataFromAttachments({
        emailAttachments,
        billAttachments,
      });

      if (inferred.containerId) setContainerId(inferred.containerId);
      if (inferred.vesselName) setVessel(inferred.vesselName);
      if (inferred.voyageNo) setVoyage(inferred.voyageNo);
      if (inferred.operator) setOperator(inferred.operator);
      if (inferred.portOfLoading) setPol(inferred.portOfLoading);
      if (inferred.portOfDischarge) setPod(inferred.portOfDischarge);
      if (inferred.inspectionDate) setDate(inferred.inspectionDate);
      if (inferred.inspectionTime) setTime(inferred.inspectionTime);

      const updatedCount = Object.values(inferred).filter(Boolean).length;
      if (updatedCount === 0) {
        Alert.alert(
          "No Metadata Found",
          "No reliable metadata values were detected in the uploaded documents.",
        );
      } else {
        Alert.alert(
          "Auto Fill Complete",
          `Updated ${updatedCount} field${updatedCount === 1 ? "" : "s"}. Please review before saving.`,
        );
      }
    } catch (error) {
      console.error("[EditProjectMetadata] Failed to auto-fill metadata", error);
      Alert.alert("Auto Fill Error", toSaveProjectErrorMessage(error));
    } finally {
      setIsAutofilling(false);
    }
  }

  async function handleSaveChanges(): Promise<void> {
    if (!projectId || isSaving) {
      return;
    }

    const form: CreateProjectMetadataForm = {
      containerId,
      vesselName: vessel,
      voyageNo: voyage,
      operator,
      portOfLoading: pol,
      portOfDischarge: pod,
      inspectionDate: date,
      inspectionTime: time,
    };

    const validation = validateCreateProjectMetadataForm(form);
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    setContainerId(validation.normalizedContainerId);
    setIsSaving(true);

    try {
      const metadata = mapCreateProjectMetadataFormToRecord(
        projectId,
        {
          ...form,
          containerId: validation.normalizedContainerId,
        },
      );
      await persistProjectMetadata(metadata);
      router.back();
    } catch (error) {
      console.error("[EditProjectMetadata] Failed to save metadata", error);
      Alert.alert("Database Error", toSaveProjectErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return {
    projectId,
    loading,
    isSaving,
    ref,
    containerId,
    setContainerId,
    vessel,
    setVessel,
    voyage,
    setVoyage,
    operator,
    setOperator,
    pol,
    setPol,
    pod,
    setPod,
    date,
    setDate,
    time,
    setTime,
    contextDocs,
    isAutofilling,
    handleAutoFillMetadata,
    handleSaveChanges,
  };
}
