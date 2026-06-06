import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ReportRowMenuProps = {
  top: number;
  right: number;
  onClose: () => void;
  onShare: () => void;
};

export function ReportRowMenu({
  top,
  right,
  onClose,
  onShare,
}: Readonly<ReportRowMenuProps>) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" className="z-50">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <ThemedView
        className="absolute w-52 rounded-xl py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-black/10 elevation-8"
        style={{ top, right }}
      >
        <TouchableOpacity className="flex-row items-center gap-3 px-4 py-3" onPress={onShare} testID="overflow-menu-item-share">
          <MaterialIcons name="ios-share" size={20} color="#94a3b8" />
          <ThemedText>Share</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
}
