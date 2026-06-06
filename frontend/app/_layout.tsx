import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { DatabaseBootstrapProvider } from "@/components/database/database-bootstrap-provider";

const formModalPresentation =
  Platform.OS === "ios" ? ("modal" as const) : undefined;

const cardPresentation = Platform.OS === "ios" ? ("card" as const) : undefined;

/** Keep tabs mounted behind form modals so page navigation uses a normal push. */
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        const ImagePicker = await import("expo-image-picker");
        const MediaLibrary = await import("expo-media-library");

        const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
        if (!cameraPermission.granted && cameraPermission.canAskAgain && !isCancelled) {
          await ImagePicker.requestCameraPermissionsAsync();
        }

        const mediaPermission = await MediaLibrary.getPermissionsAsync(false, ["photo"]);
        if (!mediaPermission.granted && mediaPermission.canAskAgain && !isCancelled) {
          await MediaLibrary.requestPermissionsAsync(false, ["photo"]);
        }
      } catch (error) {
        console.warn("[Permissions] Failed to bootstrap camera/media permissions", error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <DatabaseBootstrapProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          ...(Platform.OS === "android"
            ? { animation: "slide_from_right" as const }
            : {}),
        }}
      >
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
        <Stack.Screen
          name="(project)/project-list-overflow-metadata"
          options={
            formModalPresentation
              ? { presentation: formModalPresentation }
              : undefined
          }
        />
      </Stack>
    </DatabaseBootstrapProvider>
  );
}
