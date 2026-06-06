import { useCallback, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { apiRequest, RestMethod } from "@/rest/client";
import { BASE_URL } from "@/rest/constants";

type AlphaPingResponse = {
  service?: string;
  client_ip?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const handlePingBackend = useCallback(async () => {
    setIsPinging(true);
    setPingStatus(null);

    try {
      const response = await apiRequest<AlphaPingResponse>("/v1/alpha", {
        method: RestMethod.Get,
      });
      const service = response?.service ?? "Alpha";
      const clientIp = response?.client_ip ?? "unknown";
      setPingStatus(`Connected: ${service} (server sees ${clientIp})`);
    } catch (error) {
      console.error("[Profile] Backend ping failed", {
        baseUrl: BASE_URL,
        route: "/api/v1/alpha",
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      const message = error instanceof Error ? error.message : "Unknown error";
      setPingStatus(`Connection failed: ${message}`);
    } finally {
      setIsPinging(false);
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={["top"]}>
      <ThemedView className="px-4 py-3">
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <MaterialIcons name="person" size={48} color="#94a3b8" />
        <ThemedText type="defaultSemiBold">Your Profile</ThemedText>
        <ThemedText className="text-slate-400">
          Profile settings will appear here.
        </ThemedText>
        <TouchableOpacity
          className="mt-2 w-full max-w-sm flex-row items-center justify-center gap-2 rounded-xl border border-sky-400 py-3.5"
          onPress={() => {
            void handlePingBackend();
          }}
          activeOpacity={0.85}
          disabled={isPinging}
          testID="profile-ping-backend-button"
        >
          {isPinging ? (
            <ActivityIndicator size="small" color="#0284c7" />
          ) : (
            <MaterialIcons name="wifi-tethering" size={20} color="#0284c7" />
          )}
          <ThemedText className="text-sky-700 dark:text-sky-300 font-semibold">
            {isPinging ? "Pinging backend..." : "Ping Backend"}
          </ThemedText>
        </TouchableOpacity>
        {pingStatus ? (
          <ThemedText className="w-full max-w-sm text-xs text-slate-500 dark:text-slate-300 text-center">
            {pingStatus}
          </ThemedText>
        ) : null}
        <TouchableOpacity
          className="mt-4 w-full max-w-sm flex-row items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 py-3.5"
          onPress={() => router.replace("/login")}
          activeOpacity={0.85}
        >
          <MaterialIcons name="logout" size={20} color="#94a3b8" />
          <ThemedText className="text-slate-700 dark:text-slate-200 font-semibold">
            Log out
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

