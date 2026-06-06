import { Text, View } from "react-native";

type DatabaseBootstrapErrorProps = {
  message: string;
};

export function DatabaseBootstrapError({
  message,
}: DatabaseBootstrapErrorProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-white dark:bg-slate-900">
      <Text className="text-xl font-semibold text-slate-900 dark:text-white">
        Database startup failed
      </Text>
      <Text className="mt-2 text-center text-slate-500 dark:text-slate-300">
        {message}
      </Text>
    </View>
  );
}
