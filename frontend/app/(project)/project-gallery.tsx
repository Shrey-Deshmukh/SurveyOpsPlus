import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ImageCard } from '@/components/project/workspace/image-card';
import type { ImageRecord } from '@/shared-types/data/image-record';

type ProjectGalleryProps = Readonly<{
    visible: boolean;
    onClose: () => void;
    images: ImageRecord[];
    onUpload: () => void;
    onCapture: () => void;
    bulkTagging: boolean;
    onGenerateTagsForAllUntagged: () => void;
    onDeleteImages: (imageIds: string[], onComplete?: () => void) => void;
}>;

export default function ProjectGallery({
    visible,
    onClose,
    images,
    onUpload,
    onCapture,
    bulkTagging,
    onGenerateTagsForAllUntagged,
    onDeleteImages,
}: ProjectGalleryProps) {
    const router = useRouter();
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!visible) {
            setSelectionMode(false);
            setSelectedIds(new Set());
        }
    }, [visible]);

    const toggleImageSelection = useCallback((imageId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(imageId)) {
                next.delete(imageId);
            } else {
                next.add(imageId);
            }
            return next;
        });
    }, []);

    const exitSelectionMode = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    }, []);

    const handleHeaderActionPress = useCallback(() => {
        if (selectionMode && selectedIds.size > 0) {
            onDeleteImages([...selectedIds], exitSelectionMode);
            return;
        }
        if (selectionMode) {
            exitSelectionMode();
            return;
        }
        if (images.length === 0) {
            Alert.alert('No images', 'Add images before selecting them for deletion.');
            return;
        }
        setSelectionMode(true);
    }, [
        selectionMode,
        selectedIds,
        onDeleteImages,
        exitSelectionMode,
        images.length,
    ]);

    // items: capture button, upload button, then real images
    const allItems: ('capture' | 'upload' | ImageRecord)[] = ['capture', 'upload', ...images];

    // split items into rows of 2
    const imageRows: (typeof allItems)[] = [];
    for (let i = 0; i < allItems.length; i += 2) {
        imageRows.push(allItems.slice(i, i + 2));
    }

    const selectedCount = selectedIds.size;
    const showDeleteAction = selectionMode && selectedCount > 0;

    let headerActionLabel = 'Select images to delete';
    if (showDeleteAction) {
        headerActionLabel = `Delete ${selectedCount} selected images`;
    } else if (selectionMode) {
        headerActionLabel = 'Cancel selection';
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-[#f7f9fe] dark:bg-slate-950" edges={['top', 'bottom']}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-10 h-10 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50"
                    >
                        <MaterialIcons name="close" size={22} color="#005ea4" />
                    </TouchableOpacity>
                    <ThemedText className="font-semibold text-lg text-slate-900 dark:text-slate-50">Visual Gallery</ThemedText>
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                            className="min-w-10 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 py-2 px-2"
                            onPress={handleHeaderActionPress}
                            disabled={!showDeleteAction && images.length === 0}
                            accessibilityLabel={headerActionLabel}
                        >
                            {showDeleteAction ? (
                                <MaterialIcons name="delete" size={22} color="#dc2626" />
                            ) : (
                                <MaterialIcons
                                    name={selectionMode ? 'close' : 'checklist'}
                                    size={22}
                                    color="#005ea4"
                                />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="min-w-10 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 py-2 px-2"
                            onPress={onGenerateTagsForAllUntagged}
                            disabled={bulkTagging || images.length === 0 || selectionMode}
                            accessibilityLabel="Generate tags for all untagged images"
                        >
                            {bulkTagging ? (
                                <ActivityIndicator size="small" color="#005ea4" />
                            ) : (
                                <MaterialIcons name="auto-awesome" size={22} color="#005ea4" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Heading */}
                    <ThemedText
                        className="text-3xl font-extrabold text-blue-600 dark:text-white mb-2"
                        style={{ letterSpacing: -0.5 }}
                    >
                        {images.length} Images
                    </ThemedText>
                    {selectionMode && (
                        <ThemedText className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            {selectedCount === 0
                                ? 'Tap images to select, then delete.'
                                : `${selectedCount} selected`}
                        </ThemedText>
                    )}
                    {!selectionMode && <View className="mb-6" />}

                    {/* Grid */}
                    {imageRows.map((row) => (
                        <View
                            key={row.map((item) => (typeof item === 'string' ? item : item.id)).join('-')}
                            className="flex-row justify-between mb-3"
                        >
                            {row.map((item) => {
                                if (item === 'capture') {
                                    return (
                                        <TouchableOpacity
                                            key="capture"
                                            className="rounded-2xl items-center justify-center"
                                            style={{ width: '48%', aspectRatio: 1, backgroundColor: '#005ea4' }}
                                            activeOpacity={0.85}
                                            onPress={onCapture}
                                            disabled={selectionMode}
                                        >
                                            <MaterialIcons name="camera-alt" size={32} color="#fff" />
                                            <ThemedText className="text-white text-xs font-bold mt-2 uppercase text-center" style={{ letterSpacing: 1 }}>
                                                Capture Image
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                }
                                if (item === 'upload') {
                                    return (
                                        <TouchableOpacity
                                            key="upload"
                                            className="rounded-2xl items-center justify-center"
                                            style={{ width: '48%', aspectRatio: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#005ea4' }}
                                            activeOpacity={0.85}
                                            onPress={onUpload}
                                            disabled={selectionMode}
                                        >
                                            <MaterialIcons name="upload-file" size={32} color="#005ea4" />
                                            <ThemedText className="text-[#005ea4] text-xs font-bold mt-2 uppercase text-center" style={{ letterSpacing: 1 }}>
                                                Upload Images
                                            </ThemedText>
                                            <ThemedText className="text-[#005ea4]/70 text-[10px] text-center mt-1">
                                                Max 25MB (JPG, PNG)
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                }
                                const isSelected = selectedIds.has(item.id);
                                return (
                                    <ImageCard
                                        key={item.id}
                                        image={item}
                                        selectable={selectionMode}
                                        selected={isSelected}
                                        onPress={() => {
                                            if (selectionMode) {
                                                toggleImageSelection(item.id);
                                                return;
                                            }
                                            onClose();
                                            router.push({ pathname: '/(project)/image-details-metadata', params: { imageId: item.id } });
                                        }}
                                    />
                                );
                            })}
                            {row.length === 1 && <View style={{ width: '48%' }} />}
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
