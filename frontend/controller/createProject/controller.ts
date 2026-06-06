// main controller for the data flow logic of the screen

import { Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  getDocumentAsync,
  type DocumentPickerAsset,
} from "expo-document-picker";

import { useCreateProjectPreload } from "@/controller/createProject/preload";
import {
  type CreateProjectMetadataAutofill,
  type CreateProjectContextDoc,
  type CreateProjectForm,
  mapCreateProjectFormToRecord,
  serializeMetadataAutofillRouteParam,
  serializeContextDocsRouteParam,
  serializeProjectRouteParam,
} from "@/controller/createProject/transforms";
import { toProjectRef } from "@/controller/createProject/utils";
import { validateCreateProjectForm } from "@/controller/createProject/validation";
import { persistContextDocument } from "@/controller/utils/document-utils";
import {
  isProjectStatus,
  type ProjectStatus,
} from "@/shared-types/data/project-status";
import {
  isRepresentingParty,
  type RepresentingParty,
} from "@/shared-types/data/representing-party";
import {
  inferProjectAndMetadataFromAttachments,
  type MetadataAutofillAttachment,
} from "@/data/autofill-metadata.dao";

type UseCreateProjectControllerResult = {
  files: CreateProjectContextDoc[];
  referenceDocuments: CreateProjectContextDoc[];
  emailAttachments: CreateProjectContextDoc[];
  billAttachments: CreateProjectContextDoc[];
  addFiles: (files: CreateProjectContextDoc[]) => void;
  handlePickReferenceDocuments: () => Promise<void>;
  handlePickEmailAttachments: () => Promise<void>;
  handlePickBillAttachments: () => Promise<void>;
  handleClose: () => void;
  handleContinue: () => Promise<void>;
  handleAutoFillProject: () => Promise<void>;
  isAutofilling: boolean;
  isSubmitting: boolean;
  instructions: string;
  setInstructions: (value: string) => void;
  status: ProjectStatus;
  setStatus: (value: ProjectStatus) => void;
  location: string;
  setLocation: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  representingParty: RepresentingParty | "";
  setRepresentingParty: (value: RepresentingParty | "") => void;
  isRepresentingPartyDropdownOpen: boolean;
  setIsRepresentingPartyDropdownOpen: (value: boolean) => void;
  loadingFiles: boolean;
  projectName: string;
  projectRefPreview: string;
  removeFile: (fileId: string) => void;
  setProjectName: (value: string) => void;
  setSurveyDetails: (value: string) => void;
  surveyDetails: string;
};

const REPORT_EMAIL_ATTACHMENT_PREFIX = "report-email-attachment-";
const REPORT_BILL_ATTACHMENT_PREFIX = "report-bill-attachment-";
const REFERENCE_DOCUMENT_PREFIX = "context-doc-";

function toFileExtension(name: string): string {
  const extension = name.split(".").at(-1);
  if (!extension || extension === name) {
    return "";
  }

  return extension.toLowerCase();
}

function isPdfDocument(asset: DocumentPickerAsset): boolean {
  return (
    asset.mimeType === "application/pdf" || toFileExtension(asset.name) === "pdf"
  );
}

function isCorrespondenceDocument(
  asset: DocumentPickerAsset,
): boolean {
  const extension = toFileExtension(asset.name);
  const correspondenceMimeTypes = new Set([
    "message/rfc822",
    "application/vnd.ms-outlook",
  ]);

  return (
    extension === "eml" ||
    extension === "msg" ||
    extension === "pdf" ||
    correspondenceMimeTypes.has(asset.mimeType ?? "")
    || asset.mimeType === "application/pdf"
  );
}

function toAttachmentType(
  fileName: string,
  declaredType: string | null,
): string {
  if (declaredType && declaredType.trim().length > 0) {
    return declaredType;
  }
  const extension = toFileExtension(fileName);
  if (extension === "pdf") {
    return "application/pdf";
  }
  if (extension === "eml") {
    return "message/rfc822";
  }
  if (extension === "msg") {
    return "application/vnd.ms-outlook";
  }
  return "application/octet-stream";
}

function toAutofillAttachment(document: CreateProjectContextDoc): MetadataAutofillAttachment {
  return {
    uri: document.localUrl,
    name: document.name,
    type: toAttachmentType(document.name, document.type),
  };
}

function toProjectNameToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().replace(/\s+/g, "-");
  return normalized.length > 0 ? normalized : null;
}

export function useCreateProjectController(): UseCreateProjectControllerResult {
  const router = useRouter();
  const {
    projectSeedTimestamp,
    files,
    projectName,
    setProjectName,
    surveyDetails,
    setSurveyDetails,
    instructions,
    setInstructions,
    status,
    setStatus,
    location,
    setLocation,
    date,
    setDate,
    representingParty,
    setRepresentingParty,
    isRepresentingPartyDropdownOpen,
    setIsRepresentingPartyDropdownOpen,
    removeFile,
    addFiles,
    isSubmitting,
    setIsSubmitting,
  } = useCreateProjectPreload();
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [metadataAutofill, setMetadataAutofill] = useState<CreateProjectMetadataAutofill>({});
  const projectRefPreview = toProjectRef(projectName, projectSeedTimestamp);
  const emailAttachments = files.filter((file) =>
    file.id.startsWith(REPORT_EMAIL_ATTACHMENT_PREFIX),
  );
  const billAttachments = files.filter((file) =>
    file.id.startsWith(REPORT_BILL_ATTACHMENT_PREFIX),
  );
  const referenceDocuments = files.filter(
    (file) =>
      !file.id.startsWith(REPORT_EMAIL_ATTACHMENT_PREFIX) &&
      !file.id.startsWith(REPORT_BILL_ATTACHMENT_PREFIX),
  );

  async function pickDocuments(
    idPrefix: string,
    filter: (asset: DocumentPickerAsset) => boolean,
    emptySelectionMessage: string,
  ): Promise<void> {
    try {
      const result = await getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: "*/*",
      });

      if (result.canceled) {
        return;
      }

      const filteredAssets = result.assets.filter(filter);
      if (filteredAssets.length === 0) {
        Alert.alert("Unsupported File", emptySelectionMessage);
        return;
      }

      const pickedAt = Date.now();
      const nextFiles = await Promise.all(
        filteredAssets.map(async (asset, index) => {
          const id = `${idPrefix}${pickedAt}-${index}`;
          const localUrl = await persistContextDocument(asset.uri, asset.name, id);

          return {
            id,
            name: asset.name,
            type: asset.mimeType ?? null,
            localUrl,
            sizeBytes: asset.size ?? null,
          };
        }),
      );
      addFiles(nextFiles);
    } catch (error) {
      console.error("[CreateProject] Failed to pick context documents", error);
      Alert.alert(
        "Upload Error",
        "Unable to select files from this device right now.",
      );
    }
  }

  async function handlePickBillAttachments(): Promise<void> {
    await pickDocuments(
      REPORT_BILL_ATTACHMENT_PREFIX,
      isPdfDocument,
      "Please select PDF documents for Bill Attachments.",
    );
  }

  async function handlePickReferenceDocuments(): Promise<void> {
    await pickDocuments(
      REFERENCE_DOCUMENT_PREFIX,
      isPdfDocument,
      "Please select PDF documents for Reference Documents.",
    );
  }

  async function handlePickEmailAttachments(): Promise<void> {
    await pickDocuments(
      REPORT_EMAIL_ATTACHMENT_PREFIX,
      isCorrespondenceDocument,
      "Please select .eml, .msg, or .pdf files for Email Attachments.",
    );
  }

  async function handleAutoFillProject(): Promise<void> {
    if (isAutofilling) {
      return;
    }

    const emailAutofillAttachments = emailAttachments.map(toAutofillAttachment);
    const billAutofillAttachments = billAttachments.map(toAutofillAttachment);
    if (emailAutofillAttachments.length === 0 && billAutofillAttachments.length === 0) {
      Alert.alert(
        "No Autofill Documents",
        "Upload at least one Email Attachment or Bill Attachment to use Auto Fill.",
      );
      return;
    }

    setIsAutofilling(true);
    try {
      const inferred = await inferProjectAndMetadataFromAttachments({
        emailAttachments: emailAutofillAttachments,
        billAttachments: billAutofillAttachments,
      });
      const inferredProjectName =
        inferred.project.projectName ??
        (() => {
          const portToken = toProjectNameToken(
            inferred.metadata.portOfLoading ??
            inferred.project.location,
          );
          const containerToken = toProjectNameToken(inferred.metadata.containerId);
          const dateToken = toProjectNameToken(
            inferred.project.date ??
            inferred.metadata.inspectionDate,
          );
          if (!portToken || !containerToken || !dateToken) {
            return "";
          }
          return `${portToken}-${containerToken}-${dateToken}`;
        })();
      if (inferredProjectName !== null) {
        setProjectName(inferredProjectName);
      }
      if (inferred.project.surveyDetails) {
        setSurveyDetails(inferred.project.surveyDetails);
      }
      if (inferred.project.instructions) {
        setInstructions(inferred.project.instructions);
      }
      if (inferred.project.location) {
        setLocation(inferred.project.location);
      }
      if (inferred.project.date) {
        setDate(inferred.project.date);
      }
      if (inferred.project.status && isProjectStatus(inferred.project.status)) {
        setStatus(inferred.project.status);
      }
      if (
        inferred.project.representingParty &&
        isRepresentingParty(inferred.project.representingParty)
      ) {
        setRepresentingParty(inferred.project.representingParty);
      }
      setMetadataAutofill({
        containerId: inferred.metadata.containerId ?? undefined,
        vesselName: inferred.metadata.vesselName ?? undefined,
        voyageNo: inferred.metadata.voyageNo ?? undefined,
        operator: inferred.metadata.operator ?? undefined,
        portOfLoading: inferred.metadata.portOfLoading ?? undefined,
        portOfDischarge: inferred.metadata.portOfDischarge ?? undefined,
        inspectionDate: inferred.metadata.inspectionDate ?? undefined,
        inspectionTime: inferred.metadata.inspectionTime ?? undefined,
      });

      const updatedCount = [
        inferred.project.projectName,
        inferred.project.surveyDetails,
        inferred.project.instructions,
        inferred.project.location,
        inferred.project.date,
        inferred.project.status && isProjectStatus(inferred.project.status)
          ? inferred.project.status
          : null,
        inferred.project.representingParty &&
        isRepresentingParty(inferred.project.representingParty)
          ? inferred.project.representingParty
          : null,
        inferred.metadata.containerId,
        inferred.metadata.vesselName,
        inferred.metadata.voyageNo,
        inferred.metadata.operator,
        inferred.metadata.portOfLoading,
        inferred.metadata.portOfDischarge,
        inferred.metadata.inspectionDate,
        inferred.metadata.inspectionTime,
      ].filter(Boolean).length;

      if (updatedCount === 0) {
        Alert.alert(
          "No Details Found",
          "No reliable first-page details were detected from the uploaded documents.",
        );
      } else {
        Alert.alert(
          "Auto Fill Complete",
          `Updated ${updatedCount} field${updatedCount === 1 ? "" : "s"}, including survey details when detected. Please review before continuing.`,
        );
      }
    } catch (error) {
      console.error("[CreateProject] Failed to auto-fill project details", error);
      Alert.alert(
        "Auto Fill Error",
        "Unable to infer project details from the uploaded documents right now.",
      );
    } finally {
      setIsAutofilling(false);
    }
  }

  async function handleContinue(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    const createProjectForm: CreateProjectForm = {
      projectName,
      surveyDetails,
      instructions,
      status,
      location,
      date,
      representingParty,
    };
    const validation = validateCreateProjectForm(createProjectForm);
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const { project } = mapCreateProjectFormToRecord(
        createProjectForm,
        new Date(projectSeedTimestamp),
      );

      router.push({
        pathname: "/(project)/create-project-metadata",
        params: {
          project: serializeProjectRouteParam(project),
          contextDocs: serializeContextDocsRouteParam(files),
          metadataAutofill: serializeMetadataAutofillRouteParam(metadataAutofill),
        },
      });
    } catch (error) {
      console.error("[CreateProject] Failed to advance to metadata", error);
      Alert.alert("Navigation Error", "Unable to continue to metadata.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose(): void {
    router.back();
  }

  return {
    files,
    referenceDocuments,
    emailAttachments,
    billAttachments,
    addFiles,
    handlePickReferenceDocuments,
    handlePickEmailAttachments,
    handlePickBillAttachments,
    handleClose,
    handleContinue,
    handleAutoFillProject,
    isAutofilling,
    isSubmitting,
    instructions,
    setInstructions,
    status,
    setStatus,
    location,
    setLocation,
    date,
    setDate,
    representingParty,
    setRepresentingParty,
    isRepresentingPartyDropdownOpen,
    setIsRepresentingPartyDropdownOpen,
    projectName,
    projectRefPreview,
    removeFile,
    setProjectName,
    setSurveyDetails,
    surveyDetails,
    loadingFiles: false,
  };
}
