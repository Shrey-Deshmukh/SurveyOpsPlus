import { Modal, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type OverflowMenuItem = {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  onPress?: () => void;
  showDividerBefore?: boolean;
};

type OverflowMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: OverflowMenuItem[];
};

function toOverflowMenuItemTestId(label: string): string {
  return `overflow-menu-item-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

export function OverflowMenu({ visible, onClose, items }: Readonly<OverflowMenuProps>) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose}>
        <ThemedView className="absolute top-14 right-3 w-52 rounded-xl py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-black/10 elevation-8">
          {items.map((item) => (
            <View key={item.label}>
              {item.showDividerBefore ? <View className="h-px bg-slate-100 dark:bg-slate-700 mx-4" /> : null}
              <TouchableOpacity
                className="flex-row items-center gap-3 px-4 py-3"
                onPress={() => {
                  onClose();
                  item.onPress?.();
                }}
                testID={toOverflowMenuItemTestId(item.label)}
              >
                <MaterialIcons name={item.icon} size={20} color={item.iconColor ?? '#94a3b8'} />
                <ThemedText>{item.label}</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
}
