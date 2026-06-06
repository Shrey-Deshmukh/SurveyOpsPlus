import { Stack } from "expo-router";
import { Platform } from "react-native";

const formModalPresentation =
  Platform.OS === "ios" ? ("modal" as const) : undefined;

const cardPresentation = Platform.OS === "ios" ? ("card" as const) : undefined;

export default function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(project)/project-workspace"
        options={
          cardPresentation ? { presentation: cardPresentation } : undefined
        }
      />
      <Stack.Screen
        name="(project)/create-project"
        options={
          formModalPresentation
            ? { presentation: formModalPresentation }
            : undefined
        }
      />
      <Stack.Screen
        name="(project)/create-project-metadata"
        options={
          formModalPresentation
            ? { presentation: formModalPresentation }
            : undefined
        }
      />
      <Stack.Screen
        name="(project)/edit-project-metadata"
        options={
          formModalPresentation
            ? { presentation: formModalPresentation }
            : undefined
        }
      />
      <Stack.Screen
        name="(project)/image-details-metadata"
        options={
          formModalPresentation
            ? { presentation: formModalPresentation }
            : undefined
        }
      />
    </Stack>
  );
}
