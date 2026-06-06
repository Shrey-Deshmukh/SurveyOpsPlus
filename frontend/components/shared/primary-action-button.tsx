import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

type PrimaryActionButtonProps = {
  label: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

export function PrimaryActionButton({
  label,
  icon,
  onPress,
  className = 'flex-row items-center justify-center gap-2 bg-primary rounded-xl py-4',
  disabled = false,
  loading = false,
  testID,
}: Readonly<PrimaryActionButtonProps>) {
  const resolvedClassName = `${className}${disabled ? ' opacity-60' : ''}`;

  return (
    <TouchableOpacity
      className={resolvedClassName}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      testID={testID}
    >
      <ThemedText className="text-white text-base font-semibold">{label}</ThemedText>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : icon ? (
        <MaterialIcons name={icon} size={20} color="#fff" />
      ) : null}
    </TouchableOpacity>
  );
}
