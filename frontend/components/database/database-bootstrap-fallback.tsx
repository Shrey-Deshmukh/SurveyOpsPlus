import { ActivityIndicator, Text, View } from "react-native";

export function DatabaseBootstrapFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
      <ActivityIndicator size="large" color="#13a4ec" />
      <Text className="mt-3 text-slate-500 dark:text-slate-300">
        Preparing local database...
      </Text>
    </View>
  );
}
