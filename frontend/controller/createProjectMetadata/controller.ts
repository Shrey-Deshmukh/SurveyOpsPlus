import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  type CreateProjectMetadataForm,
  mapCreateProjectContextDocsToRecords,
  mapCreateProjectMetadataFormToRecord,
  parseContextDocsRouteParam,
  parseMetadataAutofillRouteParam,
  parseProjectRouteParam,
  toSaveProjectErrorMessage,
} from "@/controller/createProject/transforms";
import {
  format24HourTime,
  formatIsoLocalDate,
} from "@/controller/createProject/utils";
import { validateCreateProjectMetadataForm } from "@/controller/createProject/validation";
import { createProjectWithMetadata } from "@/data/metadata.dao";

export function useCreateProjectMetadataController() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    project?: string | string[];
    contextDocs?: string | string[];
    metadataAutofill?: string | string[];
  }>();
  const project = useMemo(
    () => parseProjectRouteParam(params.project),
    [params.project],
  );
  const contextDocs = useMemo(
    () => parseContextDocsRouteParam(params.contextDocs),
    [params.contextDocs],
  );
  const metadataAutofill = useMemo(
    () => parseMetadataAutofillRouteParam(params.metadataAutofill),
    [params.metadataAutofill],
  );

  const [containerId, setContainerId] = useState(
    () => metadataAutofill.containerId ?? "",
  );
  const [vesselName, setVesselName] = useState(
    () => metadataAutofill.vesselName ?? "",
  );
  const [voyageNo, setVoyageNo] = useState(
    () => metadataAutofill.voyageNo ?? "",
  );
  const [operator, setOperator] = useState(
    () => metadataAutofill.operator ?? "",
  );
  const [portOfLoading, setPortOfLoading] = useState(
    () => metadataAutofill.portOfLoading ?? "",
  );
  const [portOfDischarge, setPortOfDischarge] = useState(
    () => metadataAutofill.portOfDischarge ?? "",
  );
  const [inspectionDate, setInspectionDate] = useState(
    () => metadataAutofill.inspectionDate ?? formatIsoLocalDate(new Date()),
  );
  const [inspectionTime, setInspectionTime] = useState(
    () => metadataAutofill.inspectionTime ?? format24HourTime(new Date()),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateProject(): Promise<void> {
    if (!project || isSubmitting) {
      return;
    }

    const createProjectMetadataForm: CreateProjectMetadataForm = {
      containerId,
      vesselName,
      voyageNo,
      operator,
      portOfLoading,
      portOfDischarge,
      inspectionDate,
      inspectionTime,
    };
    const validation =
      validateCreateProjectMetadataForm(createProjectMetadataForm);
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }

    setContainerId(validation.normalizedContainerId);
    setIsSubmitting(true);

    try {
      const metadata = mapCreateProjectMetadataFormToRecord(
        project.id,
        {
          ...createProjectMetadataForm,
          containerId: validation.normalizedContainerId,
        },
      );
      const nowMs = Date.now();
      const contextDocRecords = mapCreateProjectContextDocsToRecords(
        project.id,
        contextDocs,
        nowMs,
      );

      await createProjectWithMetadata(project, metadata, contextDocRecords);
      router.dismissTo("/(tabs)");
      setTimeout(() => {
        router.push({
          pathname: "/(project)/project-workspace",
          params: { id: project.id },
        });
      }, 0);
    } catch (error) {
      console.error("[CreateProjectMetadata] Failed to save project", error);
      Alert.alert("Database Error", toSaveProjectErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    project,
    contextDocs,
    containerId,
    setContainerId,
    vesselName,
    setVesselName,
    voyageNo,
    setVoyageNo,
    operator,
    setOperator,
    portOfLoading,
    setPortOfLoading,
    portOfDischarge,
    setPortOfDischarge,
    inspectionDate,
    setInspectionDate,
    inspectionTime,
    setInspectionTime,
    isSubmitting,
    handleCreateProject,
  };
}
