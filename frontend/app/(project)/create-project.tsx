import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCreateProjectController } from "@/controller/createProject/controller";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FileCard } from "@/components/project/file-card";
import { PrimaryActionButton } from "@/components/shared/primary-action-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { SectionTitle } from "@/components/shared/section-title";
import { PROJECT_STATUS_OPTIONS } from "@/shared-types/data/project-status";
import { REPRESENTING_PARTY_OPTIONS } from "@/shared-types/data/representing-party";
import { formatContextDocumentSubtitle } from "@/controller/createProject/utils";

function toStatusOptionTestId(statusOption: string): string {
  return `create-project-status-option-${statusOption
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

function toRepresentingPartyOptionTestId(option: string): string {
  return `create-project-representing-party-option-${option
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

export default function CreateProjectScreen() {
  const {
    emailAttachments,
    billAttachments,
    referenceDocuments,
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
  } = useCreateProjectController();

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-900"
      edges={["top", "bottom"]}
      testID="create-project-screen"
    >
      <ScreenHeader
        title="Create Project"
        onPressLeft={handleClose}
        leftIcon="close"
        leftButtonTestID="create-project-close-button"
        centerTitle
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 5, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setIsRepresentingPartyDropdownOpen(false)}
        testID="create-project-scroll-view"
      >
        <ThemedView className="gap-4">
          <SectionTitle title="General Information" icon="dataset" uppercase />

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">
              Project Name <ThemedText className="text-red-500">*</ThemedText>
            </ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
              placeholder="e.g., Maersk Inspection #402"
              placeholderTextColor="#94a3b8"
              value={projectName}
              onChangeText={setProjectName}
              testID="create-project-name-input"
            />
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Project Reference</ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
              value={projectRefPreview}
              editable={false}
            />
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Survey Details</ThemedText>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 min-h-28"
              placeholder="Describe the scope of the inspection, container numbers, or specific damage areas..."
              placeholderTextColor="#94a3b8"
              value={surveyDetails}
              onChangeText={setSurveyDetails}
              multiline
              textAlignVertical="top"
              testID="create-project-survey-details-input"
            />
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Instructions</ThemedText>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 min-h-28"
              placeholder="Inspection instructions for the surveyor team..."
              placeholderTextColor="#94a3b8"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              textAlignVertical="top"
              testID="create-project-instructions-input"
            />
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">
              Status <ThemedText className="text-red-500">*</ThemedText>
            </ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {PROJECT_STATUS_OPTIONS.map((statusOption) => {
                const isSelected = statusOption === status;

                return (
                  <TouchableOpacity
                    key={statusOption}
                    className={`px-3 py-2 rounded-xl border ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                    onPress={() => setStatus(statusOption)}
                    testID={toStatusOptionTestId(statusOption)}
                  >
                    <ThemedText
                      className={
                        isSelected
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-slate-700 dark:text-slate-200"
                      }
                    >
                      {statusOption}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <ThemedText type="defaultSemiBold">
              Location <ThemedText className="text-red-500">*</ThemedText>
            </ThemedText>
            <TextInput
              className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
              placeholder="Port or site"
              placeholderTextColor="#94a3b8"
              value={location}
              onChangeText={setLocation}
              testID="create-project-location-input"
            />
          </View>

          <View className="flex-row gap-3 z-20">
            <View className="flex-1 gap-2">
              <ThemedText type="defaultSemiBold">
                Date <ThemedText className="text-red-500">*</ThemedText>
              </ThemedText>
              <TextInput
                className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                placeholder="05/04/2026"
                placeholderTextColor="#94a3b8"
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                testID="create-project-date-input"
              />
            </View>

            <View className="flex-1 gap-2 relative z-30">
              <ThemedText type="defaultSemiBold">
                Representing Party{" "}
                <ThemedText className="text-red-500">*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 bg-slate-50 dark:bg-slate-800 justify-center"
                onPress={() =>
                  setIsRepresentingPartyDropdownOpen(
                    !isRepresentingPartyDropdownOpen,
                  )
                }
                testID="create-project-representing-party-dropdown"
              >
                <ThemedText
                  className={
                    representingParty
                      ? "text-base text-slate-900 dark:text-white"
                      : "text-base text-slate-400 dark:text-slate-500"
                  }
                >
                  {representingParty || "Select representing party"}
                </ThemedText>
              </TouchableOpacity>
              {isRepresentingPartyDropdownOpen ? (
                <View className="absolute left-0 right-0 top-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden z-50">
                  {REPRESENTING_PARTY_OPTIONS.map((partyOption) => {
                    const isSelected = partyOption === representingParty;

                    return (
                      <TouchableOpacity
                        key={partyOption}
                        className={`px-4 py-3 border-t border-slate-100 dark:border-slate-800 ${
                          isSelected ? "bg-sky-500/10" : ""
                        }`}
                        onPress={() => {
                          setRepresentingParty(partyOption);
                          setIsRepresentingPartyDropdownOpen(false);
                        }}
                        testID={toRepresentingPartyOptionTestId(partyOption)}
                      >
                        <ThemedText
                          className={
                            isSelected
                              ? "text-sky-600 dark:text-sky-400"
                              : "text-slate-700 dark:text-slate-200"
                          }
                        >
                          {partyOption}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        </ThemedView>

        <View className="h-px bg-slate-100 dark:bg-slate-800" />

        <ThemedView className="gap-3">
          <SectionTitle title="Documentation" icon="folder-open" uppercase />
          <ThemedText className="text-sm text-slate-400 -mt-1">
            Attach relevant manifests, instructions, or correspondence.
          </ThemedText>

          <FileCard
            icon="picture-as-pdf"
            title="Reference Documents"
            subtitle="Upload PDF (Max 10MB)"
            onPress={() => {
              void handlePickReferenceDocuments();
            }}
          />

          <FileCard
            icon="mail"
            title="Email Attachments"
            subtitle="Import Email (.eml, .msg, .pdf)"
            onPress={() => {
              void handlePickEmailAttachments();
            }}
          />

          <FileCard
            icon="receipt-long"
            title="Bill Attachments"
            subtitle="Upload Bill PDFs"
            onPress={() => {
              void handlePickBillAttachments();
            }}
          />

          {referenceDocuments.map((file) => (
            <FileCard
              key={file.id}
              title={file.name}
              subtitle={formatContextDocumentSubtitle(
                file.name,
                file.type,
                file.sizeBytes,
              )}
              icon="description"
              variant="uploaded"
              onActionPress={() => removeFile(file.id)}
            />
          ))}

          {emailAttachments.map((file) => (
            <FileCard
              key={file.id}
              title={file.name}
              subtitle={formatContextDocumentSubtitle(
                file.name,
                file.type,
                file.sizeBytes,
              )}
              icon="mail"
              variant="uploaded"
              onActionPress={() => removeFile(file.id)}
            />
          ))}

          {billAttachments.map((file) => (
            <FileCard
              key={file.id}
              title={file.name}
              subtitle={formatContextDocumentSubtitle(
                file.name,
                file.type,
                file.sizeBytes,
              )}
              icon="receipt-long"
              variant="uploaded"
              onActionPress={() => removeFile(file.id)}
            />
          ))}
        </ThemedView>
      </ScrollView>

      <ThemedView className="px-5 pb-8 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <PrimaryActionButton
          label={isAutofilling ? "Inferring Details..." : "Auto Fill from Documents"}
          icon="auto-awesome"
          className="mb-3 flex-row items-center justify-center gap-2 rounded-xl bg-slate-600 py-4"
          onPress={() => {
            void handleAutoFillProject();
          }}
          disabled={isAutofilling || isSubmitting}
          loading={isAutofilling}
          testID="create-project-autofill-button"
        />
        <PrimaryActionButton
          label={isSubmitting ? "Continuing..." : "Continue to Metadata"}
          icon="arrow-forward"
          className="flex-row items-center justify-center gap-2 rounded-xl bg-sky-500 py-4"
          onPress={() => {
            void handleContinue();
          }}
          disabled={isSubmitting}
          loading={isSubmitting}
          testID="create-project-submit-button"
        />
      </ThemedView>
    </SafeAreaView>
  );
}
