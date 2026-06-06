import { useState } from "react";
import { Image, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "bottom"]}
      testID="login-screen"
      style={{ backgroundColor: "#DDD5CE" }}
    >
      <View className="flex-1 px-6 justify-center gap-8">
        {/* Logo */}
        <View className="w-full rounded-xl mt-3 items-center justify-center py-6">
          <Image
            source={require("@/assets/images/surveyopsplus-logo.webp")}
            style={{ width: "100%", height: 130 }}
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <View className="mt-4">
          <ThemedText
            type="title"
            className="text-slate-900 text-4xl leading-[38px] mb-2"
          >
            Sign in
          </ThemedText>

          <ThemedText className="text-slate-600 text-lg leading-7 font-medium">
            Welcome!
          </ThemedText>
        </View>

        {/* Fields */}
        <View className="gap-4">
          {/* Email */}
          <ThemedView className="flex-row items-center gap-3 h-14 px-4 rounded-xl border border-black-400">
            <MaterialIcons name="email" size={20} color="#6b6c6e" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="Email address"
              placeholderTextColor="#6b6c6e"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          {/* Password */}
          <ThemedView className="flex-row items-center gap-3 h-14 px-4 rounded-xl border border-black-400">
            <MaterialIcons name="lock" size={20} color="#6b6c6e" />
            <TextInput
              className="flex-1 text-base text-slate-900"
              placeholder="Password"
              placeholderTextColor="#6b6c6e"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#6b6c6e"
              />
            </TouchableOpacity>
          </ThemedView>

          {/* Forgot password */}
          <TouchableOpacity className="self-end -mt-1">
            <ThemedText className="text-sm text-slate-900 font-medium">
              Forgot password?
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="items-center justify-center rounded-xl border-2 border-primary py-4"
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.85}
            testID="login-submit-button"
          >
            <ThemedText className="text-slate-900 text-base font-bold">
              Login
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center justify-center rounded-xl border-2 border-primary py-4"
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <ThemedText className="text-slate-900 text-base font-semibold">
              Register
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
