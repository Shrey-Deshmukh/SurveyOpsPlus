import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import type { ImageRecord } from "@/shared-types/data/image-record";
import { displayNameForReportImage } from "@/utils/report-image-display-name";

export type ReportImagePickerModalProps = Readonly<{
  visible: boolean;
  title: string;
  images: ImageRecord[];
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}>;

export function ReportImagePickerModal({
  visible,
  title,
  images,
  confirmLabel,
  onClose,
  onConfirm,
}: ReportImagePickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) {
      return;
    }
    const fromDb = new Set(
      images.filter((img) => img.isImageIncluded).map((img) => img.id),
    );
    setSelected(fromDb);
  }, [visible, images]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm([...selected]);
  }, [onConfirm, selected]);

  const data = useMemo(() => images, [images]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        className="flex-1 bg-white dark:bg-slate-950"
        edges={["top", "bottom"]}
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={22} color="#005ea4" />
          </TouchableOpacity>
          <ThemedText className="font-semibold text-lg text-slate-900 dark:text-slate-50">
            {title}
          </ThemedText>
          <View className="w-10" />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 120, gap: 12 }}
          ListEmptyComponent={(
            <ThemedText className="text-center text-slate-500 dark:text-slate-400 px-6">
              No images in this project yet.
            </ThemedText>
          )}
          renderItem={({ item }) => {
            const isOn = selected.has(item.id);
            const label = displayNameForReportImage(item);
            return (
              <TouchableOpacity
                className={`flex-1 rounded-2xl overflow-hidden border-2 ${
                  isOn
                    ? "border-sky-400 bg-sky-100 dark:border-sky-400 dark:bg-sky-900/50"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                }`}
                activeOpacity={0.85}
                onPress={() => toggle(item.id)}
              >
                <View className="aspect-square w-full">
                  <Image
                    source={{ uri: item.localUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="px-2 py-2">
                  <ThemedText
                    className="text-xs font-semibold"
                    numberOfLines={2}
                  >
                    {label}
                  </ThemedText>
                </View>
                {isOn && (
                  <View className="absolute top-2 right-2 bg-sky-400 rounded-full p-1">
                    <MaterialIcons name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        <View className="absolute left-0 right-0 bottom-0 px-4 pb-4 pt-2 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <TouchableOpacity
            className="rounded-xl py-3.5 items-center justify-center bg-primary"
            activeOpacity={0.88}
            onPress={handleConfirm}
          >
            <ThemedText className="text-white text-sm font-bold">
              {confirmLabel}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
