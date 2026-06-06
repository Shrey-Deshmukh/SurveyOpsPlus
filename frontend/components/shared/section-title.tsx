import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type SectionTitleProps = {
  title: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  uppercase?: boolean;
};

export function SectionTitle({ title, icon, uppercase = false }: Readonly<SectionTitleProps>) {
  return (
    <View className="flex-row items-center gap-2">
      {icon ? <MaterialIcons name={icon} size={18} color="#13a4ec" /> : null}
      <ThemedText
        className={`font-bold tracking-widest text-slate-400 ${uppercase ? 'text-xs uppercase' : 'text-base'
          }`}
      >
        {title}
      </ThemedText>
    </View>
  );
}
