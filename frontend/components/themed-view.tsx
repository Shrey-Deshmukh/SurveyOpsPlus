import { View, type ViewProps } from 'react-native';
import { cssInterop } from 'nativewind';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const shouldApplyThemeBackground = Boolean(lightColor || darkColor);
  const themedBackgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const backgroundColor = shouldApplyThemeBackground ? themedBackgroundColor : undefined;

  return <View style={[backgroundColor ? { backgroundColor } : undefined, style]} {...otherProps} />;
}

cssInterop(ThemedView, {
  className: 'style',
});
