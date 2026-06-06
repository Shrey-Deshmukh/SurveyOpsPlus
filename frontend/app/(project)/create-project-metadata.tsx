import { ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { FileCard } from "@/components/project/file-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryActionButton } from "@/components/shared/primary-action-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { SectionTitle } from "@/components/shared/section-title";
import { useCreateProjectMetadataController } from "@/controller/createProjectMetadata/controller";
import {
  formatContextDocumentSubtitle,
} from "@/controller/createProject/utils";

export default function CreateProjectMetadataScreen() {
  const router = useRouter();
  const {
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
  } = useCreateProjectMetadataController();

  if (!project) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-slate-900"
        edges={["top", "bottom"]}
        testID="create-project-metadata-screen"
      >
        <ScreenHeader
          title="Project Metadata"
          onPressLeft={() => router.back()}
          centerTitle
        />
        <View className="flex-1 items-center justify-center px-8">
          <ThemedText className="text-center text-slate-500">
            Project details could not be loaded. Please return and try again.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-900"
      edges={["top", "bottom"]}
      testID="create-project-metadata-screen"
    >
      <ScreenHeader
        title="Project Metadata"
        onPressLeft={() => router.back()}
        centerTitle
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="create-project-metadata-scroll-view"
      >
        <ThemedView className="gap-4">
          <SectionTitle title="Project Reference" icon="badge" uppercase />

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Reference ID</ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              editable={false}
              value={project.ref}
            />
          </View>
        </ThemedView>

        <View className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

        <ThemedView className="gap-4">
          <SectionTitle title="Container & Vessel" icon="directions-boat" uppercase />

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Container ID</ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
              placeholder="MSKU1234567"
              placeholderTextColor="#94a3b8"
              value={containerId}
              onChangeText={setContainerId}
              autoCapitalize="characters"
              testID="create-project-metadata-container-id-input"
            />
            <ThemedText className="text-xs text-slate-400">
              Use ISO 6346 format (4 letters + 7 digits).
            </ThemedText>
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Vessel Name</ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
              placeholder="Maersk Kensington"
              placeholderTextColor="#94a3b8"
              value={vesselName}
              onChangeText={setVesselName}
              testID="create-project-metadata-vessel-name-input"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <ThemedText type="defaultSemiBold">Voyage No.</ThemedText>
              <TextInput
                className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                placeholder="304E"
                placeholderTextColor="#94a3b8"
                value={voyageNo}
                onChangeText={setVoyageNo}
                testID="create-project-metadata-voyage-no-input"
              />
            </View>

            <View className="flex-1 gap-2">
              <ThemedText type="defaultSemiBold">Operator</ThemedText>
              <TextInput
                className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                placeholder="MSC"
                placeholderTextColor="#94a3b8"
                value={operator}
                onChangeText={setOperator}
                testID="create-project-metadata-operator-input"
              />
            </View>
          </View>
        </ThemedView>

        <View className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

        <ThemedView className="gap-4">
          <SectionTitle title="Inspection Logistics" icon="anchor" uppercase />

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Port of Loading</ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
              placeholder="Singapore, SG"
              placeholderTextColor="#94a3b8"
              value={portOfLoading}
              onChangeText={setPortOfLoading}
              testID="create-project-metadata-port-of-loading-input"
            />
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Port of Discharge</ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
              placeholder="Los Angeles, US"
              placeholderTextColor="#94a3b8"
              value={portOfDischarge}
              onChangeText={setPortOfDischarge}
              testID="create-project-metadata-port-of-discharge-input"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <ThemedText type="defaultSemiBold">Inspection Date</ThemedText>
              <TextInput
                className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                placeholder="2026-05-04"
                placeholderTextColor="#94a3b8"
                value={inspectionDate}
                onChangeText={setInspectionDate}
                testID="create-project-metadata-inspection-date-input"
              />
              <ThemedText className="text-xs text-slate-400">
                Use YYYY-MM-DD format.
              </ThemedText>
            </View>

            <View className="flex-1 gap-2">
              <ThemedText type="defaultSemiBold">Inspection Time</ThemedText>
              <TextInput
                className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                placeholder="14:30"
                placeholderTextColor="#94a3b8"
                value={inspectionTime}
                onChangeText={setInspectionTime}
                testID="create-project-metadata-inspection-time-input"
              />
              <ThemedText className="text-xs text-slate-400">
                Use 24-hour HH:MM format.
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <View className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

        <ThemedView className="gap-3">
          <SectionTitle title="Context Documents" icon="folder-open" uppercase />
          {contextDocs.length === 0 ? (
            <ThemedText className="text-sm text-slate-400">
              No context documents were added in the previous step.
            </ThemedText>
          ) : (
            contextDocs.map((document) => (
              <FileCard
                key={document.id}
                title={document.name}
                subtitle={formatContextDocumentSubtitle(
                  document.name,
                  document.type,
                  document.sizeBytes,
                )}
                icon="description"
                variant="uploaded"
              />
            ))
          )}
        </ThemedView>
      </ScrollView>

      <ThemedView className="px-5 pb-8 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <PrimaryActionButton
          label={isSubmitting ? "Creating..." : "Create Project"}
          icon="check-circle"
          className="flex-row items-center justify-center gap-2 rounded-xl bg-sky-500 py-4"
          onPress={() => {
            void handleCreateProject();
          }}
          disabled={isSubmitting}
          loading={isSubmitting}
          testID="create-project-metadata-submit-button"
        />
      </ThemedView>
    </SafeAreaView>
  );
}
