import { Platform } from "react-native";
import { isDevice } from "expo-device";
import { resolveExpoGoDevHost } from "./utils";

export const API_PREFIX = "/api";

// Production gateway (no trailing slash); `client` still prefixes `/api`.
const PRODUCTION_BASE_URL = "http://surveyopsplus.backend.com";

// Dev default when `EXPO_PUBLIC_BACKEND_URL` is unset: host loopback from the emulator vs simulator.
function resolveDevBaseUrlWithoutEnv(): string {
  // laptops ip for android app install
  // return "http://192.168.4.46:8000";

  switch (Platform.OS) {
    case "android": {
      // Emulator -> Android host loopback alias.
      if (!isDevice) {
        return "http://10.0.2.2:8000";
      }

      // Physical Expo Go should use the same host as the scanned Metro URL.
      const expoGoHost = resolveExpoGoDevHost();
      if (expoGoHost) {
        return `http://${expoGoHost}:8000`;
      }

      // Physical device fallback (works only with adb reverse).
      return "http://localhost:8000";
    }
    case "ios": {
      // Simulator can reach the dev machine via localhost.
      if (!isDevice) {
        return "http://localhost:8000";
      }

      // Physical Expo Go (iPhone/iPad) must use the Metro host, not localhost.
      const expoGoHost = resolveExpoGoDevHost();
      if (expoGoHost) {
        return `http://${expoGoHost}:8000`;
      }

      return "http://localhost:8000";
    }
    default:
      return "http://localhost:8000";
  }
}

// `EXPO_PUBLIC_BACKEND_URL` wins in dev and prod. Otherwise: dev → local/emulator host; release → production host.
function resolveDefaultBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.replace(/\/+$/, "");
  }
  if (__DEV__) {
    return resolveDevBaseUrlWithoutEnv();
  }
  return PRODUCTION_BASE_URL;
}

export const BASE_URL = resolveDefaultBaseUrl();