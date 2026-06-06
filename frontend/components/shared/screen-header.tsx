import { ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ScreenHeaderProps = {
  title: string;
  titleClassName?: string;
  onPressLeft?: () => void;
  leftIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  leftButtonTestID?: string;
  rightSlot?: ReactNode;
  centerTitle?: boolean;
};

export function ScreenHeader({
  title,
  titleClassName,
  onPressLeft,
  leftIcon = 'arrow-back-ios-new',
  leftButtonTestID,
  rightSlot,
  centerTitle = false,
}: Readonly<ScreenHeaderProps>) {
  let leftNode = null;
  if (onPressLeft) {
    leftNode = (
      <TouchableOpacity
        className="w-10 h-10 rounded-full items-center justify-center"
        onPress={onPressLeft}
        testID={leftButtonTestID}
      >
        <MaterialIcons name={leftIcon} size={22} color="#94a3b8" />
      </TouchableOpacity>
    );
  } else if (centerTitle) {
    leftNode = <View className="w-10 h-10" />;
  }

  const rightNode = rightSlot ?? (centerTitle ? <View className="w-10 h-10" /> : null);

  return (
    <ThemedView className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      {leftNode}

      <ThemedText
        type="defaultSemiBold"
        className={`${titleClassName ?? 'text-xl'} ${centerTitle ? 'flex-1 text-center' : ''}`}
      >
        {title}
      </ThemedText>

      {rightNode}
    </ThemedView>
  );
}
