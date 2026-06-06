import { useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { FileCard } from "@/components/project/file-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryActionButton } from "@/components/shared/primary-action-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { SectionTitle } from "@/components/shared/section-title";
import { formatContextDocumentSubtitle } from "@/controller/createProject/utils";
import { useEditProjectMetadataController } from "@/controller/editProjectMetadata/controller";
import { shareLocalDocuments } from "@/controller/utils/document-utils";

export default function EditProjectMetadataScreen() {
  const router = useRouter();
  const {
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
  } = useEditProjectMetadataController();

  const handleShareDoc = useCallback(async (localUrl: string) => {
    try {
      await shareLocalDocuments([localUrl]);
    } catch (error) {
      console.error("[EditProjectMetadata] Failed to share document", error);
      Alert.alert(
        "Unable to Share",
        "Could not open the share sheet. Please try again."
      );
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#13a4ec" />
      </SafeAreaView>
    );
  }

  if (!projectId) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={["top", "bottom"]}>
        <ScreenHeader
          title="Edit Metadata"
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
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={["top", "bottom"]}
      testID="edit-project-metadata-screen"
    >
      <ScreenHeader
        title="Edit Metadata"
        onPressLeft={() => router.back()}
        leftButtonTestID="edit-project-metadata-back-button"
        centerTitle
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView className="px-5 pt-5 pb-2">
          <SectionTitle title="Identification" icon="fingerprint" />
        </ThemedView>
        <ThemedView className="px-5 gap-4 pb-5">
          <View className="gap-2">
            <ThemedText className="text-sm text-slate-400">Project Reference #</ThemedText>
            <View className="flex-row items-center h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <TextInput
                className="flex-1 px-4 text-base text-slate-400"
                editable={false}
                value={ref}
              />
              <MaterialIcons
                name="lock"
                size={18}
                color="#94a3b8"
                style={{ marginRight: 12 }}
              />
            </View>
          </View>
          <View className="gap-2">
            <ThemedText className="text-sm text-slate-400">Container ID</ThemedText>
            <TextInput
              className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800 tracking-widest"
              placeholder="MSKU 123456 7"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={containerId}
              onChangeText={setContainerId}
              testID="edit-project-metadata-container-id-input"
            />
            <ThemedText className="text-xs text-slate-400">
              Format: 4 Letters, 7 Numbers (ISO 6346)
            </ThemedText>
          </View>
        </ThemedView>

        <View className="h-px bg-slate-200 dark:bg-slate-700 mx-5" />

        <ThemedView className="px-5 pt-5 pb-2">
          <SectionTitle title="Vessel Info" icon="directions-boat" />
        </ThemedView>
        <ThemedView className="px-5 gap-4 pb-5">
          <View className="gap-2">
            <ThemedText className="text-sm text-slate-400">Vessel Name</ThemedText>
            <TextInput
              className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
              value={vessel}
              onChangeText={setVessel}
              testID="edit-project-metadata-vessel-name-input"
            />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1 gap-2">
              <ThemedText className="text-sm text-slate-400">Voyage No.</ThemedText>
              <TextInput
                className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                value={voyage}
                onChangeText={setVoyage}
                testID="edit-project-metadata-voyage-no-input"
              />
            </View>
            <View className="flex-1 gap-2">
              <ThemedText className="text-sm text-slate-400">Operator</ThemedText>
              <TextInput
                className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                placeholder="Ex: MSC"
                placeholderTextColor="#94a3b8"
                value={operator}
                onChangeText={setOperator}
                testID="edit-project-metadata-operator-input"
              />
            </View>
          </View>
        </ThemedView>

        <View className="h-px bg-slate-200 dark:bg-slate-700 mx-5" />

        <ThemedView className="px-5 pt-5 pb-2">
          <SectionTitle title="Logistics" icon="anchor" />
        </ThemedView>
        <ThemedView className="px-5 gap-4 pb-5">
          <View className="gap-2">
            <ThemedText className="text-sm text-slate-400">Port of Loading (POL)</ThemedText>
            <TextInput
              className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
              value={pol}
              onChangeText={setPol}
              testID="edit-project-metadata-port-of-loading-input"
            />
          </View>
          <View className="gap-2">
            <ThemedText className="text-sm text-slate-400">Port of Discharge (POD)</ThemedText>
            <TextInput
              className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
              value={pod}
              onChangeText={setPod}
              testID="edit-project-metadata-port-of-discharge-input"
            />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-[3] gap-2">
              <ThemedText className="text-sm text-slate-400">Inspection Date</ThemedText>
              <TextInput
                className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                value={date}
                onChangeText={setDate}
                testID="edit-project-metadata-inspection-date-input"
              />
            </View>
            <View className="flex-[2] gap-2">
              <ThemedText className="text-sm text-slate-400">Time</ThemedText>
              <TextInput
                className="h-12 border border-slate-300 dark:border-slate-600 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                value={time}
                onChangeText={setTime}
                testID="edit-project-metadata-inspection-time-input"
              />
            </View>
          </View>
        </ThemedView>

        <View className="h-px bg-slate-200 dark:bg-slate-700 mx-5" />

        <ThemedView className="px-5 pt-5 pb-5 gap-3">
          <SectionTitle title="Context Documents" icon="folder-open" />
          {contextDocs.length === 0 ? (
            <ThemedText className="text-sm text-slate-400">
              No uploaded context documents found for this project.
            </ThemedText>
          ) : (
            contextDocs.map((document) => (
              <FileCard
                key={document.id}
                title={document.name ?? "Document"}
                subtitle={formatContextDocumentSubtitle(
                  document.name ?? "Document",
                  document.type,
                  document.sizeBytes,
                )}
                icon="description"
                variant="uploaded"
                actionIcon="open-in-new"
                onActionPress={
                  document.localUrl
                    ? () => handleShareDoc(document.localUrl!)
                    : undefined
                }
              />
            ))
          )}
        </ThemedView>
      </ScrollView>

      <ThemedView className="px-4 pb-8 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <PrimaryActionButton
          label={isAutofilling ? "Inferring Metadata..." : "Auto Fill from Documents"}
          icon="auto-awesome"
          onPress={() => {
            void handleAutoFillMetadata();
          }}
          className="mb-3 flex-row items-center justify-center gap-2 bg-slate-600 rounded-xl h-14"
          disabled={isAutofilling || isSaving}
          loading={isAutofilling}
          testID="edit-project-metadata-autofill-button"
        />
        <PrimaryActionButton
          label={isSaving ? "Saving..." : "Save Changes"}
          icon="save"
          onPress={() => {
            void handleSaveChanges();
          }}
          className="flex-row items-center justify-center gap-2 bg-sky-600 dark:bg-sky-500 rounded-xl h-14"
          disabled={isSaving}
          loading={isSaving}
          testID="edit-project-metadata-save-button"
        />
      </ThemedView>
    </SafeAreaView>
  );
}
