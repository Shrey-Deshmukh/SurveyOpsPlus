import { ActivityIndicator, Image, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryActionButton } from '@/components/shared/primary-action-button';
import { ScreenHeader } from '@/components/shared/screen-header';
import { SectionTitle } from '@/components/shared/section-title';
import { useImageDetailsController } from '@/controller/imageDetails/controller';
import { TagAnnotationChip } from '@/components/image-details/tag-annotation-chip';
import { DocumentCitationsSection } from '@/components/image-details/document-citations-section';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function ImageDetailsMetadataScreen() {
  const { imageId } = useLocalSearchParams<{ imageId: string }>();
  const id = Array.isArray(imageId) ? (imageId[0] ?? '') : (imageId ?? '');

  const {
    router,
    image,
    tags,
    newTag,
    setNewTag,
    notes,
    setNotes,
    metaRows,
    citations,
    loading,
    saving,
    generatingTags,
    addTag,
    removeTagAt,
    saveMetadata,
    handleDelete,
    handleGenerateTags,
  } = useImageDetailsController(id);

  function handleSavePress() {
    saveMetadata({ exitAfterSave: true }).catch((error) => {
      console.error("[ImageDetails] Save button failed", error);
    });
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#13a4ec" />
      </SafeAreaView>
    );
  }

  if (!image) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ThemedText className="text-slate-400">Image not found</ThemedText>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <ThemedText className="text-primary font-semibold">Go Back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top', 'bottom']} testID="image-details-screen">

      <ScreenHeader
        title="Image Details"
        onPressLeft={() => router.back()}
        leftButtonTestID="image-details-back-button"
        rightSlot={(
          <View className="flex-row items-center gap-0.5">
            <TouchableOpacity
              className="flex-row items-center gap-1 px-2 py-1"
              onPress={() => {
                void handleGenerateTags();
              }}
              disabled={generatingTags}
              testID="image-details-generate-tags-button"
            >
              {generatingTags ? (
                <ActivityIndicator size="small" color="#13a4ec" />
              ) : (
                <MaterialIcons name="auto-awesome" size={20} color="#13a4ec" />
              )}
              <ThemedText className="text-primary text-xs font-semibold">Tags</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <ThemedText className="text-red-500 text-sm font-medium px-2">Delete</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {image.taggingStatus === 'untagged' && image.taggingLastError ? (
          <View className="mx-4 mb-3 mt-1 p-3 rounded-xl bg-amber-500/12 border border-amber-500/35 dark:border-amber-500/40">
            <ThemedText className="text-sm text-amber-900 dark:text-amber-100">
              Auto-tag did not complete: {image.taggingLastError}
            </ThemedText>
          </View>
        ) : null}

        <View className="m-4 h-56 rounded-2xl overflow-hidden bg-slate-100">
          <Image
            source={{ uri: image.localUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <TouchableOpacity className="absolute top-2.5 right-2.5 bg-black/40 p-2 rounded-lg">
            <MaterialIcons name="crop-free" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ThemedView className="px-4 mb-5">
          <View className="mb-3">
            <SectionTitle title="Annotations" icon="label" />
          </View>
          <ThemedView className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 gap-3">
            <View className="w-full flex-row flex-wrap gap-2">
              {tags.map((tag, i) => (
                <View key={`${tag}-${i}`} style={{ maxWidth: "100%" }}>
                  <TagAnnotationChip
                    tag={tag}
                    index={i}
                    onRemoveAt={removeTagAt}
                  />
                </View>
              ))}
            </View>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 h-10 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-900 dark:text-white"
                placeholder="Add new tag..."
                placeholderTextColor="#94a3b8"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                returnKeyType="done"
                testID="image-details-tag-input"
              />
              <TouchableOpacity className="pl-2" onPress={addTag} testID="image-details-add-tag-button">
                <MaterialIcons name="add-circle" size={24} color="#13a4ec" />
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>

        <ThemedView className="px-4 mb-5">
          <View className="mb-3">
            <SectionTitle title="Observations" icon="edit-note" />
          </View>
          <TextInput
            className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white min-h-24"
            multiline
            textAlignVertical="top"
            placeholder="Describe damage or condition..."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
          />
        </ThemedView>

        {citations ? (
          <DocumentCitationsSection citations={citations} />
        ) : null}

        <ThemedView className="px-4 mb-5">
          <View className="mb-3">
            <SectionTitle title="Technical Metadata" icon="info" />

          </View>
          <ThemedView className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {metaRows.map((row, i) => (
              <View key={row.label}>
                {i > 0 && <View className="h-px bg-slate-100 dark:bg-slate-800" />}
                <View className="flex-row items-center gap-3 p-3">
                  <View className="w-8 h-8 rounded-lg border border-slate-100 dark:border-slate-700 items-center justify-center">
                    <MaterialIcons name={row.icon as MaterialIconName} size={16} color="#94a3b8" />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-xs text-slate-400">{row.label}</ThemedText>
                    <ThemedText className="text-sm font-medium">{row.value}</ThemedText>
                  </View>
                  {row.editable && <MaterialIcons name="edit" size={16} color="#94a3b8" />}
                </View>
              </View>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView className="px-4 pb-8">
          <PrimaryActionButton
            label={saving ? "Saving..." : "Save Metadata"}
            icon="save"
            className="flex-row items-center justify-center gap-2 rounded-xl bg-sky-500 py-4"
            onPress={handleSavePress}
            disabled={saving}
            loading={saving}
            testID="image-metadata-save-button"
          />
        </ThemedView>

      </ScrollView>

    </SafeAreaView>
  );
}
