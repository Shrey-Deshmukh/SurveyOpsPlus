import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  type View as RNView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OverflowMenu } from '@/components/shared/overflow-menu';
import { ReportRowMenu } from '@/components/shared/report-row-menu';
import { ScreenHeader } from '@/components/shared/screen-header';
import { SectionTitle } from '@/components/shared/section-title';
import { TaggingStatusDot } from '@/components/project/workspace/image-card';
import ProjectGallery from './project-gallery';
import { ReportImagePickerModal } from '@/components/project/workspace/report-image-picker-modal';
import { useWorkspaceController } from '@/controller/projectWorkspace/controller';
import type { Report } from '@/data/workspace.dao';
import { formatContextDocumentSubtitle } from '@/controller/createProject/utils';
import { FileCard } from '@/components/project/file-card';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function ProjectWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id ?? '';

  const {
    router,
    goBackToProjectList,
    projectName,
    instructions,
    setInstructions,
    instructionsDirty,
    isSavingInstructions,
    handleSaveInstructions,
    status,
    reports,
    images,
    emailAttachments,
    billAttachments,
    selected,
    galleryOpen,
    setGalleryOpen,
    openProjectMetadata,
    loading,
    toggleSelect,
    selectAll,
    handleUploadImages,
    handleCaptureImage,
    bulkTagging,
    handleGenerateTagsForAllUntagged,
    handleDeleteImages,
    pickReportAttachments,
    removeReportAttachment,
    openReportImagesForGenerate,
    openReportImagesForSelectOnly,
    closeReportImageModal,
    handleConfirmReportImages,
    reportImageModalOpen,
    isReportFlowBusy,
    isReportGenerated,
    handleShareReport,
    handleExportSelectedReports,
  } = useWorkspaceController(projectId);

  const [reportMenu, setReportMenu] = useState<{
    report: Report;
    top: number;
    right: number;
  } | null>(null);
  const reportMenuAnchorRefs = useRef<Map<string, RNView>>(new Map());

  const toggleReportMenu = useCallback((report: Report) => {
    if (reportMenu?.report.id === report.id) {
      setReportMenu(null);
      return;
    }

    reportMenuAnchorRefs.current.get(report.id)?.measureInWindow((x, y, width) => {
      const screenWidth = Dimensions.get('window').width;
      setReportMenu({
        report,
        top: y - 52,
        right: screenWidth - (x + width),
      });
    });
  }, [reportMenu?.report.id]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBackToProjectList();
        return true;
      });

      return () => {
        subscription.remove();
      };
    }, [goBackToProjectList]),
  );

  const openGallery = useCallback(() => {
    setGalleryOpen(true);
  }, [setGalleryOpen]);

  const createToggleSelectHandler = useCallback(
    (reportId: string) => () => {
      toggleSelect(reportId);
    },
    [toggleSelect],
  );

  useEffect(() => {
    if (!instructionsDirty || isSavingInstructions) {
      return;
    }

    const debounceId = setTimeout(() => {
      void handleSaveInstructions();
    }, 900);

    return () => {
      clearTimeout(debounceId);
    };
  }, [handleSaveInstructions, instructions, instructionsDirty, isSavingInstructions]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#13a4ec" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" testID="project-workspace-screen">

      <ScreenHeader
        title={projectName || 'Project Workspace'}
        onPressLeft={goBackToProjectList}
        leftButtonTestID="project-workspace-back-button"
        rightSlot={(
          <TouchableOpacity
            className="flex-row items-center gap-1.5 rounded-lg border-2 border-sky-500 bg-sky-100 dark:bg-sky-500/20 px-3 py-2"
            onPress={openProjectMetadata}
            accessibilityRole="button"
            accessibilityLabel="Show Metadata"
            activeOpacity={0.85}
            testID="project-workspace-show-metadata-button"
          >
            <MaterialIcons name="info" size={18} color="#0284c7" />
            <ThemedText className="text-sky-700 dark:text-sky-300 text-sm font-semibold">
              Show Metadata
            </ThemedText>
          </TouchableOpacity>
        )}
      />

      <View className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>

          <ThemedView className="px-5 pt-5 pb-5">
            <View className="flex-row justify-between items-center mb-2.5">
              <SectionTitle title="Instructions" uppercase />
              <View className="bg-primary/10 px-2 py-0.5 rounded">
                <ThemedText className="text-xs font-bold text-primary" style={{ fontSize: 9 }}>{status.toUpperCase()}</ThemedText>
              </View>
            </View>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-700 dark:text-slate-300 h-32 leading-5"
              multiline
              scrollEnabled
              textAlignVertical="top"
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Enter survey instructions here..."
              placeholderTextColor="#94a3b8"
              testID="project-workspace-instructions-input"
            />
            {(instructionsDirty || isSavingInstructions) ? (
              <ThemedText className="text-[11px] text-sky-600 mt-1">
                Saving...
              </ThemedText>
            ) : null}
          </ThemedView>

          <ThemedView className="px-5 pb-5">
            <View className="mb-3.5">
              <SectionTitle title="Capture Media" uppercase />
            </View>
            <View className="flex-row gap-3.5 mb-4">
              <TouchableOpacity
                className="flex-1 h-28 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#005ea4' }}
                activeOpacity={0.85}
                onPress={() => handleCaptureImage()}
              >
                <MaterialIcons name="camera-alt" size={32} color="#fff" />
                <ThemedText className="text-white text-xs font-bold mt-2 uppercase text-center" style={{ letterSpacing: 1 }}>
                  Capture Image
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-28 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#005ea4' }}
                activeOpacity={0.85}
                onPress={handleUploadImages}
                testID="project-workspace-upload-images-button"
              >
                <MaterialIcons name="upload-file" size={32} color="#005ea4" />
                <ThemedText className="text-[#005ea4] text-xs font-bold mt-2 uppercase text-center" style={{ letterSpacing: 1 }}>
                  Upload Images
                </ThemedText>
                <ThemedText className="text-[#005ea4]/70 text-[10px] text-center mt-1">
                  Max 25MB (JPG, PNG)
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Thumbnail Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.slice(0, 5).map((image, index) => (
                <View key={image.id} className="relative w-20 h-20 rounded-xl overflow-hidden mr-2 bg-slate-100 dark:bg-slate-800">
                  <TouchableOpacity
                    className="w-full h-full"
                    onPress={() => router.push({ pathname: '/(project)/image-details-metadata', params: { imageId: image.id } })}
                    testID={`project-workspace-image-thumbnail-${index}`}
                  >
                    <Image source={{ uri: image.localUrl }} className="w-full h-full" resizeMode="cover" />
                  </TouchableOpacity>
                  <View className="absolute bottom-1 right-1" pointerEvents="none">
                    <TaggingStatusDot image={image} size="sm" />
                  </View>
                </View>
              ))}
              {images.length > 5 && (
                <TouchableOpacity
                  className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 items-center justify-center"
                  onPress={() => setGalleryOpen(true)}
                  activeOpacity={0.7}
                >
                  <ThemedText className="text-xs text-slate-400">+{images.length - 5} More</ThemedText>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 mt-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              onPress={() => {
                void handleGenerateTagsForAllUntagged();
              }}
              disabled={bulkTagging}
              activeOpacity={0.75}
            >
              {bulkTagging ? (
                <ActivityIndicator size="small" color="#005ea4" />
              ) : (
                <MaterialIcons name="auto-awesome" size={18} color="#005ea4" />
              )}
              <ThemedText className="text-sm font-semibold" style={{ color: '#005ea4' }}>
                {bulkTagging
                  ? 'Generating tags…'
                  : `Generate tags (${images.filter((img) => img.taggingStatus === 'untagged').length} untagged)`}
              </ThemedText>
            </TouchableOpacity>

            {/* View Gallery button */}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 mt-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              onPress={openGallery}
              activeOpacity={0.75}
            >
              <MaterialIcons name="photo-library" size={18} color="#005ea4" />
              <ThemedText className="text-sm font-semibold" style={{ color: '#005ea4' }}>
                View Gallery
              </ThemedText>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,94,164,0.1)' }}>
                <ThemedText style={{ fontSize: 10, fontWeight: '700', color: '#005ea4' }}>
                  {images.length}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView className="px-5 pb-5">
            <View className="mb-3.5">
              <SectionTitle title="Report Attachments" icon="attach-file" uppercase />
            </View>
            <FileCard
              icon="mail"
              title="Email Attachments"
              subtitle="Upload .eml, .msg, or .pdf files"
              onPress={() => {
                void pickReportAttachments('email');
              }}
            />
            <View className="h-2" />
            <FileCard
              icon="receipt-long"
              title="Bill Attachments"
              subtitle="Upload billing PDFs"
              onPress={() => {
                void pickReportAttachments('bill');
              }}
            />
            {emailAttachments.map((attachment) => (
              <View key={attachment.id} className="mt-2">
                <FileCard
                  title={attachment.name ?? 'Email Attachment'}
                  subtitle={formatContextDocumentSubtitle(
                    attachment.name ?? 'Email Attachment',
                    attachment.type,
                    attachment.sizeBytes,
                  )}
                  icon="mail"
                  variant="uploaded"
                  onActionPress={() => {
                    void removeReportAttachment(attachment.id, 'email');
                  }}
                />
              </View>
            ))}
            {billAttachments.map((attachment) => (
              <View key={attachment.id} className="mt-2">
                <FileCard
                  title={attachment.name ?? 'Bill Attachment'}
                  subtitle={formatContextDocumentSubtitle(
                    attachment.name ?? 'Bill Attachment',
                    attachment.type,
                    attachment.sizeBytes,
                  )}
                  icon="receipt-long"
                  variant="uploaded"
                  onActionPress={() => {
                    void removeReportAttachment(attachment.id, 'bill');
                  }}
                />
              </View>
            ))}
          </ThemedView>

          <ThemedView className="pt-5">
            <View className="flex-row justify-between items-center px-5 mb-2">
              <ThemedText type="defaultSemiBold" className="text-lg">Reports</ThemedText>
              <TouchableOpacity onPress={() => selectAll(reports.map((r) => r.id))}>
                <ThemedText className="text-xs font-bold text-primary">Select All</ThemedText>
              </TouchableOpacity>
            </View>
            <View className="flex-row px-5 mb-3.5 gap-2">
              <TouchableOpacity
                className="flex-1 rounded-xl border-2 border-primary px-3 py-2.5 items-center justify-center"
                onPress={openReportImagesForGenerate}
                disabled={isReportFlowBusy}
                activeOpacity={0.85}
                testID="project-workspace-generate-report-button"
              >
                <ThemedText className="text-primary text-xs font-bold text-center">
                  {isReportFlowBusy ? 'Working…' : (isReportGenerated ? 'Re-generate Report' : 'Generate Report')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2.5 items-center justify-center"
                onPress={openReportImagesForSelectOnly}
                disabled={reports.length === 0 || isReportFlowBusy}
                activeOpacity={0.85}
                testID="project-workspace-select-images-button"
              >
                <ThemedText
                  className="text-xs font-bold text-center"
                  style={{ color: reports.length === 0 ? '#94a3b8' : '#005ea4' }}
                >
                  Select Images
                </ThemedText>
              </TouchableOpacity>
            </View>
            {reports.map((report, i) => (
              <View key={report.id}>
                {i > 0 && <View className="h-px bg-slate-100 dark:bg-slate-800 mx-5" />}
                <View className="flex-row items-center px-5 py-3.5 gap-3">
                  <TouchableOpacity
                    className="w-5 h-5 rounded items-center justify-center border-2"
                    style={{
                      borderColor: selected.includes(report.id) ? '#13a4ec' : '#cbd5e1',
                      backgroundColor: selected.includes(report.id) ? '#13a4ec' : 'transparent',
                    }}
                    onPress={createToggleSelectHandler(report.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected.includes(report.id) }}
                  >
                    {selected.includes(report.id) && <MaterialIcons name="check" size={13} color="#fff" />}
                  </TouchableOpacity>
                  <View
                    className="flex-1 flex-row items-center gap-3"
                    testID={`project-workspace-open-report-${i}`}
                  >
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: report.iconBg }}>
                      <MaterialIcons name={report.icon as MaterialIconName} size={22} color={report.iconColor} />
                    </View>
                    <View className="flex-1">
                      <ThemedText type="defaultSemiBold" className="text-sm" numberOfLines={1}>{report.name}</ThemedText>
                      <ThemedText className="text-xs text-slate-400 mt-0.5">{report.date} • {report.size}</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    ref={(node) => {
                      if (node) {
                        reportMenuAnchorRefs.current.set(report.id, node);
                      } else {
                        reportMenuAnchorRefs.current.delete(report.id);
                      }
                    }}
                    className="p-1"
                    onPress={() => toggleReportMenu(report)}
                    testID={`project-workspace-report-menu-${i}`}
                  >
                    <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ThemedView>

        </ScrollView>

        {selected.length > 0 && (
          <View className="flex-row items-center justify-between bg-slate-900 rounded-xl mx-4 mb-4 px-4 py-3">
            <ThemedText className="text-white text-sm">{selected.length} Selected</ThemedText>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-row items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg"
                onPress={() => {
                  void handleExportSelectedReports();
                }}
                testID="project-workspace-export-reports-button"
              >
                <MaterialIcons name="ios-share" size={15} color="#fff" />
                <ThemedText className="text-white text-xs font-semibold">Export</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-lg">
                <MaterialIcons name="cloud-upload" size={15} color="#fff" />
                <ThemedText className="text-white text-xs font-semibold">Upload</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Gallery modal */}
      <ProjectGallery
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={images}
        onUpload={handleUploadImages}
        onCapture={() => handleCaptureImage({ closeGalleryBeforeNavigate: () => setGalleryOpen(false) })}
        bulkTagging={bulkTagging}
        onGenerateTagsForAllUntagged={() => {
          void handleGenerateTagsForAllUntagged();
        }}
        onDeleteImages={handleDeleteImages}
      />

      <ReportImagePickerModal
        visible={reportImageModalOpen}
        title="Report images"
        images={images}
        confirmLabel="Confirm Images"
        onClose={closeReportImageModal}
        onConfirm={handleConfirmReportImages}
      />

      {reportMenu ? (
        <ReportRowMenu
          top={reportMenu.top}
          right={reportMenu.right}
          onClose={() => setReportMenu(null)}
          onShare={() => {
            const { report } = reportMenu;
            setReportMenu(null);
            requestAnimationFrame(() => {
              void handleShareReport(report);
            });
          }}
        />
      ) : null}

    </SafeAreaView>
  );
}
