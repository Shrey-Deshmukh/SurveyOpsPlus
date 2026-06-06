import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type FileCardProps = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  variant?: 'upload' | 'uploaded';
  onPress?: () => void;
  onActionPress?: () => void;
  actionIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
};

export function FileCard({
  title,
  subtitle,
  icon,
  variant = 'upload',
  onPress,
  onActionPress,
  actionIcon,
}: Readonly<FileCardProps>) {
  const isUploaded = variant === 'uploaded';
  const isPressable = Boolean(onPress) || !isUploaded;
  const Container = isPressable ? TouchableOpacity : ThemedView;

  return (
    <Container
      className={`flex-row items-center gap-3 rounded-xl ${isUploaded
          ? 'p-3 border border-slate-200 dark:border-slate-700'
          : 'p-4 border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
        }`}
      {...(isPressable ? { onPress, activeOpacity: 0.85 } : {})}
    >
      <View
        className={`items-center justify-center rounded-xl border ${isUploaded
            ? 'w-10 h-10 bg-red-50 border-transparent'
            : 'w-12 h-12 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
          }`}
      >
        <MaterialIcons name={icon} size={isUploaded ? 20 : 26} color={isUploaded ? '#ef4444' : '#13a4ec'} />
      </View>

      <View className="flex-1">
        <ThemedText type="defaultSemiBold" className={isUploaded ? 'text-sm' : ''} numberOfLines={isUploaded ? 1 : undefined}>
          {title}
        </ThemedText>
        <ThemedText className="text-xs text-slate-400">{subtitle}</ThemedText>
      </View>

      {isUploaded ? (
        onActionPress ? (
          <TouchableOpacity onPress={onActionPress}>
            <MaterialIcons name={actionIcon ?? 'delete'} size={20} color="#94a3b8" />
          </TouchableOpacity>
        ) : (
          <MaterialIcons name={actionIcon ?? 'open-in-new'} size={20} color="#94a3b8" />
        )
      ) : (
        <MaterialIcons name="add" size={20} color="#94a3b8" />
      )}
    </Container>
  );
}
