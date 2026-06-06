import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { insertImageApi } from "@/db/api/images/images-api";
import { listProjectsApi } from "@/db/api/projects/projects-api";
import type { ImageRecord } from "@/shared-types/data/image-record";

const E2E_TEST_IMAGE_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sN5YqkAAAAASUVORK5CYII=";

function buildSeedImageRecord(projectId: string): ImageRecord {
  const timestamp = Date.now();
  return {
    id: `img-${projectId}-${timestamp}-e2e-seed`,
    projectId,
    localUrl: E2E_TEST_IMAGE_DATA_URI,
    sizeBytes: null,
    format: "png",
    notes: null,
    longitude: null,
    latitude: null,
    createdAt: new Date().toISOString(),
    uploadedAt: timestamp,
    isImageIncluded: false,
    taggingStatus: "untagged",
    taggingLastError: null,
  };
}

export default function SeedImageScreen() {
  const router = useRouter();
  const startedRef = useRef(false);
  const { projectName } = useLocalSearchParams<{ projectName?: string }>();

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void (async () => {
      if (!__DEV__) {
        router.replace("/(tabs)");
        return;
      }

      const normalizedProjectName =
        typeof projectName === "string" ? projectName.trim() : "";
      if (!normalizedProjectName) {
        console.error("[E2E] Missing project name for image seed");
        router.replace("/(tabs)");
        return;
      }

      try {
        const projects = await listProjectsApi();
        const project = projects.find(
          (candidate) => candidate.name === normalizedProjectName,
        );

        if (!project) {
          throw new Error(`Project not found for seed: ${normalizedProjectName}`);
        }

        await insertImageApi(buildSeedImageRecord(project.id));
        router.replace({
          pathname: "/(project)/project-workspace",
          params: { id: project.id },
        });
      } catch (error) {
        console.error("[E2E] Failed to seed mock image", error);
        router.replace("/(tabs)");
      }
    })();
  }, [projectName, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900 px-6">
      <ActivityIndicator size="large" color="#13a4ec" />
      <ThemedText className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Preparing test image...
      </ThemedText>
    </View>
  );
}
